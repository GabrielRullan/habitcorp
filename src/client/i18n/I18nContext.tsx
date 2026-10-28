import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Language, Translations, translations } from './translations';

export interface LanguageOption {
  code: Language;
  name: string;
  short: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'ca', name: 'Català', short: 'CA', flag: '🇦🇩' },
  { code: 'es', name: 'Español', short: 'ES', flag: '🇪🇸' },
  { code: 'en', name: 'English', short: 'EN', flag: '🇬🇧' },
];

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
  languages: LanguageOption[];
  formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function detectDefaultLanguage(): Language {
  try {
    const saved = localStorage.getItem('habitcorp_lang');
    if (saved === 'ca' || saved === 'es' || saved === 'en') {
      return saved;
    }
    const navLang = (navigator.language || '').toLowerCase();
    if (navLang.startsWith('ca')) return 'ca';
    if (navLang.startsWith('es')) return 'es';
  } catch {}
  return 'en';
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => detectDefaultLanguage());

  const setLang = (nextLang: Language) => {
    setLangState(nextLang);
    try {
      localStorage.setItem('habitcorp_lang', nextLang);
      document.documentElement.lang = nextLang;
    } catch {}
  };

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {}
  }, [lang]);

  const t = useMemo(() => {
    return translations[lang] || translations.en;
  }, [lang]);

  const localeMap: Record<Language, string> = {
    ca: 'ca-ES',
    es: 'es-ES',
    en: 'en-US',
  };

  const formatDate = (dateInput: string | Date, options?: Intl.DateTimeFormatOptions) => {
    try {
      const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      return d.toLocaleDateString(localeMap[lang] || 'en-US', options);
    } catch {
      return String(dateInput);
    }
  };

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang,
        t,
        languages: SUPPORTED_LANGUAGES,
        formatDate,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
