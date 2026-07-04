import React from 'react';
import { useTranslation } from '../localization/LanguageProvider';

export function LanguageSelector() {
  const { lang, setLang } = useTranslation();

  return (
    <div className="lang-selector">
      <button
        type="button"
        className={`lang-btn ${lang === 'ru' ? 'active' : ''}`}
        onClick={() => setLang('ru')}
        aria-label="Русский язык"
      >
        RU
      </button>
      <button
        type="button"
        className={`lang-btn ${lang === 'tg' ? 'active' : ''}`}
        onClick={() => setLang('tg')}
        aria-label="Забони тоҷикӣ"
      >
        TG
      </button>
    </div>
  );
}
