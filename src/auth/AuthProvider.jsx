import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const AuthContext = createContext(null);
const DEMO_AUTH_KEY = 'orzu_demo_auth_v1';

function roleFromDemoEmail(email) {
  const value = email.toLowerCase();
  if (value.includes('admin')) return 'admin';
  if (value.includes('seller')) return 'seller';
  return 'buyer';
}

function createDemoAuth(email = 'buyer@demo.test') {
  const role = roleFromDemoEmail(email);
  const id = `demo-${role}`;
  return {
    session: { user: { id, email } },
    profile: {
      id,
      email,
      full_name: `Demo ${role}`,
      role,
      is_blocked: false,
    },
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(async (userId, email = null) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    if (!isSupabaseConfigured) {
      const saved = JSON.parse(localStorage.getItem(DEMO_AUTH_KEY) ?? 'null');
      const nextProfile = saved?.profile ?? createDemoAuth().profile;
      setProfile(nextProfile);
      return nextProfile;
    }

    setProfileLoading(true);
    try {
      let profileData = null;
      let profileError = null;

      // Try selecting with avatar_url
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, phone, is_blocked, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      profileData = data;
      profileError = error;

      if (error && (error.message.includes('avatar_url') || error.code === '42703')) {
        // Retry without avatar_url if column does not exist
        const { data: retryData, error: retryError } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, phone, is_blocked')
          .eq('id', userId)
          .maybeSingle();

        profileData = retryData;
        profileError = retryError;
      }

      if (profileError) {
        console.error('Failed to load profile:', profileError);
        setProfile(null);
        return null;
      }

      // Auto-sync email into profiles table if null
      if (profileData && !profileData.email && email) {
        try {
          await supabase.from('profiles').update({ email }).eq('id', userId);
          profileData.email = email;
        } catch (syncErr) {
          console.warn('Failed to sync email to profiles table on load:', syncErr);
        }
      }

      setProfile(profileData);
      return profileData;
    } catch (err) {
      console.error('Unhandled error loading profile:', err);
      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured) {
        const saved = JSON.parse(localStorage.getItem(DEMO_AUTH_KEY) ?? 'null');
        if (saved) {
          setSession(saved.session);
          setProfile(saved.profile);
        }
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Failed to get session:', error);
          setSession(null);
          setProfile(null);
          return;
        }

        const currentSession = data.session;
        setSession(currentSession);

        if (currentSession?.user?.id) {
          await loadProfile(currentSession.user.id, currentSession.user.email);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setSession(null);
        setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    if (!isSupabaseConfigured) {
      return () => {
        mounted = false;
      };
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      try {
        setSession(nextSession);

        if (nextSession?.user?.id) {
          await loadProfile(nextSession.user.id, nextSession.user.email);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('Error on auth state change:', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signInWithPassword = async ({ email, password }) => {
    if (!isSupabaseConfigured) {
      const demoAuth = createDemoAuth(email);
      localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(demoAuth));
      setSession(demoAuth.session);
      setProfile(demoAuth.profile);
      return { user: demoAuth.session.user, profile: demoAuth.profile };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Sync email on login just in case it is missing in profiles
    if (data.user?.id) {
      try {
        await supabase.from('profiles').update({ email: data.user.email }).eq('id', data.user.id);
      } catch (syncErr) {
        console.warn('Failed to sync email to profiles table on login:', syncErr);
      }
    }

    const nextProfile = await loadProfile(data.user.id, data.user.email);
    return { user: data.user, profile: nextProfile };
  };

  const signUp = useCallback(async ({ email, password, fullName, role = 'buyer', phone }) => {
    if (!isSupabaseConfigured) {
      const demoAuth = {
        session: { user: { id: `demo-${role}-${Date.now()}`, email } },
        profile: {
          id: `demo-${role}-${Date.now()}`,
          email,
          full_name: fullName || `Demo ${role}`,
          role,
          phone,
          is_blocked: false,
        },
      };
      localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(demoAuth));
      setSession(demoAuth.session);
      setProfile(demoAuth.profile);
      return { user: demoAuth.session.user, profile: demoAuth.profile };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          phone: phone,
        },
      },
    });

    if (error) throw error;

    // Manually insert/upsert profile row with email to ensure it's in public.profiles table
    if (data.user?.id) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          role: role,
          phone: phone,
        });
      } catch (upsertErr) {
        console.warn('Failed to upsert profile record on signup:', upsertErr);
      }
    }

    let nextProfile = null;
    if (data.session?.user?.id) {
      nextProfile = await loadProfile(data.session.user.id, data.session.user.email);
    }
    return { user: data.user, session: data.session, profile: nextProfile };
  }, [loadProfile]);

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      localStorage.removeItem(DEMO_AUTH_KEY);
      setSession(null);
      setProfile(null);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setProfile(null);
  };

  const resetPasswordForEmail = async (email) => {
    if (!isSupabaseConfigured) {
      return { success: true };
    }

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    return { success: true };
  };

  const updatePassword = async (newPassword) => {
    if (!isSupabaseConfigured) {
      const saved = JSON.parse(localStorage.getItem(DEMO_AUTH_KEY) ?? 'null');
      if (saved && saved.profile) {
        saved.profile.password = newPassword;
        localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(saved));
      }
      return { success: true };
    }

    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return { data, success: true };
  };

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    loading: loading || profileLoading,
    isAuthenticated: Boolean(session?.user),
    isDemoMode: !isSupabaseConfigured,
    signInWithPassword,
    signUp,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    refreshProfile: () => loadProfile(session?.user?.id, session?.user?.email),
  }), [session, profile, loading, profileLoading, loadProfile, signUp]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
