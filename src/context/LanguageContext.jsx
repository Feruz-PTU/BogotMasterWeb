import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { SEED_TRANSLATIONS } from '../data/seed';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const DEFAULT_LANGUAGES = SEED_TRANSLATIONS.languages;
const DEFAULT_STRINGS = { ru: SEED_TRANSLATIONS.ru, en: SEED_TRANSLATIONS.en };

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        try {
            const stored = localStorage.getItem('lang');
            return stored || DEFAULT_LANGUAGES[0]?.code || 'ru';
        } catch {
            return 'ru';
        }
    });
    const [languages, setLanguages] = useState(DEFAULT_LANGUAGES);
    const [allTranslations, setAllTranslations] = useState(DEFAULT_STRINGS);

    const loadTranslations = useCallback(async () => {
        try {
            const { fetchTranslations } = await import('../supabase/data');
            const data = await fetchTranslations();
            if (!data) return;
            
            if (data.languages?.length) setLanguages(data.languages);
            
            const merged = {};
            const langs = data.languages?.length ? data.languages : DEFAULT_LANGUAGES;
            
            langs.forEach(lang => {
                merged[lang.code] = {
                    ...(SEED_TRANSLATIONS[lang.code] || SEED_TRANSLATIONS.en || {}),
                    ...(data[lang.code] || {}),
                };
            });
            setAllTranslations(merged);
        } catch (err) {
            console.error('Error loading translations:', err);
        }
    }, []);

    useEffect(() => {
        loadTranslations();
    }, [loadTranslations]);

    const t = useCallback((key) => {
        if (!allTranslations) return key;
        return allTranslations[language]?.[key] ??
               allTranslations['en']?.[key] ??
               allTranslations['ru']?.[key] ??
               key;
    }, [allTranslations, language]);

    const switchLanguage = (code) => {
        setLanguage(code);
        try {
            localStorage.setItem('lang', code);
        } catch { /* ignore */ }
    };

    return (
        <LanguageContext.Provider value={{ language, languages, switchLanguage, t, refreshTranslations: loadTranslations }}>
            {children}
        </LanguageContext.Provider>
    );
};
