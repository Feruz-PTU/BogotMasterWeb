import { createContext, useContext, useState, useEffect } from 'react';
import { SEED_PRODUCTS, SEED_SETTINGS } from '../data/seed';
import { useLanguage } from './LanguageContext';

const ContentContext = createContext();

export const useContent = () => useContext(ContentContext);

export const ContentProvider = ({ children }) => {
    const { language } = useLanguage();
    const [rawProducts, setRawProducts] = useState(SEED_PRODUCTS);
    const [rawSettings, setRawSettings] = useState(SEED_SETTINGS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                // Dynamically import the data layer so the Supabase SDK stays out
                // of the initial bundle / critical path. Seed data renders instantly;
                // live content swaps in once Supabase resolves.
                const { fetchProducts, fetchSettings } = await import('../supabase/data');
                const [products, settings] = await Promise.all([
                    fetchProducts(),
                    fetchSettings(),
                ]);
                setRawProducts(products.length ? products : SEED_PRODUCTS);
                setRawSettings(settings || SEED_SETTINGS);
            } catch {
                setRawProducts(SEED_PRODUCTS);
                setRawSettings(SEED_SETTINGS);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const lang = language || 'ru';

    const products = rawProducts.map(p => ({
        ...p,
        title: p[`title_${lang}`] || p.title_ru || '',
        description: p[`desc_${lang}`] || p.desc_ru || '',
    }));

    const settings = rawSettings ? {
        ...rawSettings,
        hero_title: rawSettings[`hero_title_${lang}`] || rawSettings.hero_title_ru || '',
        hero_subtitle: rawSettings[`hero_subtitle_${lang}`] || rawSettings.hero_subtitle_ru || '',
        hero_cta: rawSettings[`hero_cta_${lang}`] || rawSettings.hero_cta_ru || '',
        address: rawSettings[`address_${lang}`] || rawSettings.address_ru || '',
    } : null;

    const featuredProducts = products.filter(p => p.featured);
    const gallery = rawSettings?.gallery || [];

    const refreshProducts = async () => {
        try {
            const { fetchProducts } = await import('../supabase/data');
            const products = await fetchProducts();
            if (products.length) setRawProducts(products);
        } catch { /* silent */ }
    };

    const refreshSettings = async () => {
        try {
            const { fetchSettings } = await import('../supabase/data');
            const settings = await fetchSettings();
            if (settings) setRawSettings(settings);
        } catch { /* silent */ }
    };

    return (
        <ContentContext.Provider value={{
            products,
            featuredProducts,
            gallery,
            settings,
            loading,
            rawProducts,
            rawSettings,
            refreshProducts,
            refreshSettings,
        }}>
            {children}
        </ContentContext.Provider>
    );
};
