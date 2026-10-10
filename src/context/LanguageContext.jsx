import { createContext, useContext, useCallback, useMemo, useState } from 'react';
import BUILD_CONTENT from '../data/build-content.json';
import {
    DEFAULT_LANGUAGE,
    LIVE_LANGUAGES,
    isLiveLanguage,
} from '../i18n/languages';
import { FALLBACK_STRINGS } from '../i18n/fallback-strings';

/**
 * Database strings win; the bundled defaults fill any gap. Without this, a
 * deploy made before the SQL migration has run would render raw key names on
 * every page ("skip_to_content", "Slice A — seo_suffix_licorice").
 */
function withFallbacks(fromDatabase) {
    const merged = {};
    for (const { code } of LIVE_LANGUAGES) {
        merged[code] = {
            ...(FALLBACK_STRINGS[code] || {}),
            ...(fromDatabase?.[code] || {}),
        };
    }
    return merged;
}

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

/**
 * The active language comes from the URL and NOTHING else.
 *
 * There is deliberately no localStorage read here. A stored preference used to
 * override the URL, which meant one URL could render two different languages —
 * search engines could only ever see the default, and a shared link did not
 * reliably open in the language it was written in.
 *
 * `language` is passed down from the router (see App.jsx). To change language
 * you follow a real link to the other language's URL.
 */
export const LanguageProvider = ({ language, children }) => {
    const activeLanguage = isLiveLanguage(language) ? language : DEFAULT_LANGUAGE;

    // Translations are baked into the build. Public pages therefore need zero
    // network requests to render text, and the server HTML and the first
    // browser render are byte-identical (no flash, no hydration mismatch).
    const [allTranslations, setAllTranslations] = useState(() =>
        withFallbacks(BUILD_CONTENT.translations)
    );

    /** Admin-only: pull the newest strings after an edit. */
    const refreshTranslations = useCallback(async () => {
        try {
            const { fetchTranslations } = await import('../supabase/data');
            const data = await fetchTranslations();
            if (!data) return;
            const merged = {};
            for (const { code } of LIVE_LANGUAGES) {
                merged[code] = {
                    ...(FALLBACK_STRINGS[code] || {}),
                    ...(BUILD_CONTENT.translations[code] || {}),
                    ...(data[code] || {}),
                };
            }
            setAllTranslations(merged);
        } catch {
            /* keep the baked-in strings */
        }
    }, []);

    const t = useCallback(
        (key) => {
            const current = allTranslations?.[activeLanguage]?.[key];
            if (current != null && current !== '') return current;
            // Fall back to the DEFAULT language, never to an arbitrary one.
            // This is what stops Russian text appearing on English pages.
            const fallback = allTranslations?.[DEFAULT_LANGUAGE]?.[key];
            if (fallback != null && fallback !== '') return fallback;
            return key;
        },
        [allTranslations, activeLanguage]
    );

    const value = useMemo(
        () => ({
            language: activeLanguage,
            languages: LIVE_LANGUAGES,
            t,
            refreshTranslations,
        }),
        [activeLanguage, t, refreshTranslations]
    );

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
