import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const QuoteContext = createContext();

export const useQuote = () => useContext(QuoteContext);

const STORAGE_KEY = 'bm_quote_items';

export const QuoteProvider = ({ children }) => {
    // Empty on the first render, in the browser as in the prerendered HTML;
    // the saved list is read straight after. Reading it during the first
    // render made every page with a saved list differ from its HTML (the
    // cart button, the "Added" buttons), so React threw the HTML away and
    // rendered the whole page again (errors #418, #423). Since folder 24 a
    // send no longer empties the list, so saved lists are common.
    const [items, setItems] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (Array.isArray(saved) && saved.length) setItems(saved);
        } catch { /* storage unavailable or unreadable — ignore */ }
    }, []);

    // The first run sees the empty starting list, not the visitor's: skip it,
    // so it never overwrites the saved list.
    const started = useRef(false);
    useEffect(() => {
        if (!started.current) {
            started.current = true;
            return;
        }
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
