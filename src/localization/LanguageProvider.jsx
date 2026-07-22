import React, { createContext, useContext, useState, useEffect } from 'react';
import { ru } from './locales/ru';
import { tg } from './locales/tg';

const LanguageContext = createContext();

const translations = { ru, tg };

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('orzu_lang') || 'ru';
  });

  const setLang = (newLang) => {
    if (newLang === 'ru' || newLang === 'tg') {
      setLangState(newLang);
      localStorage.setItem('orzu_lang', newLang);
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key, replacements = {}) => {
    const translationSet = translations[lang] || translations['ru'];
    let text = translationSet[key] || translations['ru'][key] || key;
    
    // Replace placeholders like {name} safely
    Object.keys(replacements).forEach((k) => {
      const escapedKey = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(new RegExp(`{${escapedKey}}`, 'g'), replacements[k]);
    });
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
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
