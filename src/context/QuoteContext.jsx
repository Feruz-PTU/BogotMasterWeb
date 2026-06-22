import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const QuoteContext = createContext();

export const useQuote = () => useContext(QuoteContext);

const STORAGE_KEY = 'bm_quote_items';

export const QuoteProvider = ({ children }) => {
    const [items, setItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    });
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch { /* storage unavailable — ignore */ }
    }, [items]);

    const has = useCallback((slug) => items.some(i => i.slug === slug), [items]);

    const addItem = useCallback((product) => {
        setItems(prev =>
            prev.some(i => i.slug === product.slug)
                ? prev
                : [...prev, { slug: product.slug, title: product.title, image: product.image, quantity: '' }]
        );
    }, []);

    const removeItem = useCallback((slug) => {
        setItems(prev => prev.filter(i => i.slug !== slug));
    }, []);

    const toggleItem = useCallback((product) => {
        setItems(prev =>
            prev.some(i => i.slug === product.slug)
                ? prev.filter(i => i.slug !== product.slug)
                : [...prev, { slug: product.slug, title: product.title, image: product.image, quantity: '' }]
        );
    }, []);

    const updateQuantity = useCallback((slug, quantity) => {
        setItems(prev => prev.map(i => (i.slug === slug ? { ...i, quantity } : i)));
    }, []);

    const clear = useCallback(() => setItems([]), []);

    const openCart = useCallback(() => setIsOpen(true), []);
    const closeCart = useCallback(() => setIsOpen(false), []);

    return (
        <QuoteContext.Provider value={{
            items,
            count: items.length,
            has,
            addItem,
            removeItem,
            toggleItem,
            updateQuantity,
            clear,
            isOpen,
            openCart,
            closeCart,
        }}>
            {children}
        </QuoteContext.Provider>
    );
};
