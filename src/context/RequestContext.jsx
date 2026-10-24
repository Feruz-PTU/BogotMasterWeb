import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import RequestModal from '../components/RequestModal';
import { track, EVENTS } from '../analytics';

const RequestContext = createContext({ openRequest: () => {} });

export const useRequest = () => useContext(RequestContext);

/** A request's identity: its type, its products with their quantities, its message. */
const signatureOf = (type, products, message) =>
    `${type}:${products
        .map((p) => (typeof p === 'string' ? p : `${p.slug}=${p.quantity || ''} ${p.unit || ''}`))
        .join(',')}|${message}`;

/**
 * One request form for the whole site, in a pop-up. Any button opens it:
 *
 *   const { openRequest } = useRequest();
 *   openRequest({ type: 'sample', products: ['slice-a'] });
 *
 * - `type`: 'quote' (default) | 'sample' | 'docs' | 'other'.
 * - `products`: slugs, or { slug, quantity, unit } lines.
 * - `message`: text to start the message field with (the FAQ's unanswered search).
 * - `onSent`: called after a successful send (the quote cart empties itself).
 *
 * Reopening the same request keeps what was typed; a different request, or
 * any request after a successful send, starts afresh.
 */
export const RequestProvider = ({ children }) => {
    const [state, setState] = useState({ open: false, request: null });
    const nextId = useRef(1);

    const openRequest = useCallback((options = {}) => {
        const type = options.type || 'quote';
        const products = options.products || [];
        const message = options.message || '';
        const signature = signatureOf(type, products, message);
        track(EVENTS.QUOTE_MODAL_OPEN);
        setState((prev) => {
            const keep = prev.request && prev.request.signature === signature && !prev.request.done;
            return {
                open: true,
                request: keep
                    ? { ...prev.request, onSent: options.onSent }
                    : { id: nextId.current++, signature, type, products, message, onSent: options.onSent, done: false },
            };
        });
    }, []);

    const close = useCallback(() => setState((prev) => ({ ...prev, open: false })), []);

    const handleSent = useCallback(() => {
        state.request?.onSent?.();
        setState((prev) => ({ ...prev, request: prev.request && { ...prev.request, done: true } }));
    }, [state.request]);

    const value = useMemo(() => ({ openRequest }), [openRequest]);

    return (
        <RequestContext.Provider value={value}>
            {children}
            <RequestModal request={state.request} open={state.open} onClose={close} onSent={handleSent} />
        </RequestContext.Provider>
    );
};
