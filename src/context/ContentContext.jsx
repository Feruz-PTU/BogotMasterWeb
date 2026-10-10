import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import BUILD_CONTENT from '../data/build-content.json';
import { useLanguage } from './LanguageContext';
import { DEFAULT_LANGUAGE } from '../i18n/languages';

const ContentContext = createContext();

export const useContent = () => useContext(ContentContext);

/**
 * Content comes from `build-content.json`, a snapshot taken from Supabase at
 * build time (see scripts/fetch-content.mjs).
 *
 * Public pages make NO database calls at all. That is what makes the
 * prerendered HTML and the hydrated page identical, and it removes three
 * network round-trips from every page load. When an admin saves a change the
 * site rebuilds (see api/rebuild.js), so the snapshot is never stale.
 *
 * The admin dashboard calls refreshProducts()/refreshSettings() explicitly,
 * because it must see un-published edits immediately.
 */
export const ContentProvider = ({ children }) => {
    const { language } = useLanguage();
    const [rawProducts, setRawProducts] = useState(BUILD_CONTENT.products);
    const [rawSettings, setRawSettings] = useState(BUILD_CONTENT.settings);

    const lang = language || DEFAULT_LANGUAGE;

    /**
     * Pick the value for the active language.
     * Falls back to the DEFAULT language, not to Russian. An English page can
     * therefore never silently display Russian text — the old `|| _ru`
     * fallback was the reason Russian leaked into English titles and
     * meta descriptions.
     */
    const pick = useCallback(
        (obj, base) => {
            if (!obj) return '';
            const current = obj[`${base}_${lang}`];
            if (current != null && String(current).trim() !== '') return current;
            const fallback = obj[`${base}_${DEFAULT_LANGUAGE}`];
            if (fallback != null && String(fallback).trim() !== '') return fallback;
            return '';
        },
        [lang]
    );

    const products = useMemo(
        () =>
            rawProducts
                .filter((p) => !p.hidden)
                .map((p) => ({
                    ...p,
                    title: pick(p, 'title'),
                    description: pick(p, 'description') || pick(p, 'desc'),
                    // Specs are stored per language: specs: { en: {...}, ru: {...} }
                    activeSpecs:
                        p.specs?.[lang] ||
                        p.specs?.[DEFAULT_LANGUAGE] ||
                        null,
                })),
        [rawProducts, pick, lang]
    );

    const settings = useMemo(
        () =>
            rawSettings
                ? {
                      ...rawSettings,
                      hero_title: pick(rawSettings, 'hero_title'),
                      hero_subtitle: pick(rawSettings, 'hero_subtitle'),
                      hero_cta: pick(rawSettings, 'hero_cta'),
                      address: pick(rawSettings, 'address'),
                  }
                : null,
        [rawSettings, pick]
    );

    const featuredProducts = useMemo(
        () => products.filter((p) => p.featured),
        [products]
    );

    const gallery = useMemo(() => rawSettings?.gallery || [], [rawSettings]);

    const refreshProducts = useCallback(async () => {
        try {
            const { fetchProducts } = await import('../supabase/data');
            const next = await fetchProducts();
            if (next?.length) setRawProducts(next);
        } catch {
            /* keep the build snapshot */
        }
    }, []);

    const refreshSettings = useCallback(async () => {
        try {
            const { fetchSettings } = await import('../supabase/data');
            const next = await fetchSettings();
            if (next) setRawSettings(next);
        } catch {
            /* keep the build snapshot */
        }
    }, []);

    const value = useMemo(
        () => ({
            products,
            featuredProducts,
            gallery,
            settings,
            // Content is always present at first paint now, so nothing ever
            // renders a skeleton on a public page.
            loading: false,
            rawProducts,
            rawSettings,
            refreshProducts,
            refreshSettings,
        }),
        [
            products,
            featuredProducts,
            gallery,
            settings,
            rawProducts,
            rawSettings,
            refreshProducts,
            refreshSettings,
        ]
    );

    return (
        <ContentContext.Provider value={value}>
            {children}
        </ContentContext.Provider>
    );
};
