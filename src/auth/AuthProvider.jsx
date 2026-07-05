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

  const loadProfile = useCallback(async (userId) => {
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
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, phone, is_blocked')
      .eq('id', userId)
      .single();

    setProfileLoading(false);

    if (error) {
      console.error('Failed to load profile:', error);
      setProfile(null);
      return null;
    }

    setProfile(data);
    return data;
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

      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error('Failed to get session:', error);
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const currentSession = data.session;
      setSession(currentSession);

      if (currentSession?.user?.id) {
        await loadProfile(currentSession.user.id);
      }

      if (mounted) setLoading(false);
    }

    initAuth();

    if (!isSupabaseConfigured) {
      return () => {
        mounted = false;
      };
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);

      if (nextSession?.user?.id) {
        await loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
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

    const nextProfile = await loadProfile(data.user.id);
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

    let nextProfile = null;
    if (data.session?.user?.id) {
      nextProfile = await loadProfile(data.session.user.id);
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
    refreshProfile: () => loadProfile(session?.user?.id),
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
