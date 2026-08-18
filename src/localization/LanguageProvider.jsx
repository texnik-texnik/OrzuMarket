import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ru } from './locales/ru';
import { tg } from './locales/tg';

const LanguageContext = createContext();

const translations = { ru, tg };

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('orzu_lang') || 'ru';
  });

  const setLang = useCallback((newLang) => {
    if (newLang === 'ru' || newLang === 'tg') {
      setLangState(newLang);
      localStorage.setItem('orzu_lang', newLang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key, replacements = {}) => {
    const translationSet = translations[lang] || translations['ru'];
    let text = translationSet[key] || translations['ru'][key] || key;
    
    // Replace placeholders like {name} safely
    const keys = Object.keys(replacements);
    if (keys.length > 0) {
      keys.forEach((k) => {
        const escapedKey = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text.replace(new RegExp(`{${escapedKey}}`, 'g'), replacements[k]);
      });
    }
    
    return text;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
