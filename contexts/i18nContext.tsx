import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Default language
const DEFAULT_LANGUAGE = 'fr';

// Define the shape of the context
interface I18nContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
}

// Create the context
export const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Define the props for the provider
interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem('alice-lang') || navigator.language.split('-')[0] || DEFAULT_LANGUAGE;
  });
  const [translations, setTranslations] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const langToLoad = ['en', 'fr'].includes(language) ? language : DEFAULT_LANGUAGE;
        const response = await fetch(`/i18n/locales/${langToLoad}.json`);
        if (!response.ok) {
            // Fallback to default if the language file is not found
            console.warn(`Translation file for ${langToLoad}.json not found, falling back to ${DEFAULT_LANGUAGE}`);
            const fallbackResponse = await fetch(`/i18n/locales/${DEFAULT_LANGUAGE}.json`);
            const data = await fallbackResponse.json();
            setTranslations(data);
            return;
        }
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error('Failed to load translations:', error);
      }
    };
    loadTranslations();
  }, [language]);

  const setLanguage = (lang: string) => {
    localStorage.setItem('alice-lang', lang);
    setLanguageState(lang);
  };

  const t = useCallback((key: string, options?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let result = translations;
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key; // Return the key itself if not found
      }
    }

    if (typeof result === 'string' && options) {
      // FIX: Explicitly type the accumulator `str` as a string to resolve TS inference issue.
      return Object.entries(options).reduce((str: string, [key, value]) => {
        return str.replace(`{{${key}}}`, String(value));
      }, result);
    }

    return typeof result === 'string' ? result : key;
  }, [translations]);

  const value = { language, setLanguage, t };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};