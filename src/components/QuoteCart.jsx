import { useEffect, useState } from 'react';
import './QuoteCart.css';
import { useQuote } from '../context/QuoteContext';
import { useLanguage } from '../context/LanguageContext';
import { useRequest } from '../context/RequestContext';

/**
 * A quantity typed in the older cart ("5 t", "500 kg", "22"), as a line for
 * the request form. Anything else starts blank.
 */
function legacyLine(item) {
    const m = String(item.quantity || '')
        .trim()
        .match(/^(\d+(?:[.,]\d+)?)\s*(t|т|tons?|тонн?\w*|kg|кг)?\.?$/i);
    if (!m) return { slug: item.slug };
    const unit = m[2] && /^(kg|кг)$/i.test(m[2]) ? 'kg' : 't';
    return { slug: item.slug, quantity: m[1], unit };
}

/** The list's identity, so the "sent" note only shows for the list that was sent. */
const signatureOf = (items) => items.map((i) => i.slug).join(',');

/**
 * The quote list: the products a visitor collected with "Add to quote". The
 * button opens the request form as a price quote for all of them. Sending
 * does not empty the list (folder 24): it stays until the visitor removes the
 * products or clears it, with a note giving the request's reference.
 */
const QuoteCart = () => {
    const { items, count, isOpen, openCart, closeCart, removeItem, clear } = useQuote();
    const { t } = useLanguage();
    const { openRequest } = useRequest();
    // { reference, signature } of the last request sent from this list.
    const [lastSent, setLastSent] = useState(null);
    const sentNote = lastSent && lastSent.signature === signatureOf(items) ? lastSent.reference : '';

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const requestQuote = () => {
        const signature = signatureOf(items);
        closeCart();
        openRequest({
            type: 'quote',
            products: items.map(legacyLine),
            onSent: (type, reference) => setLastSent({ reference, signature }),
        });
    };

    return (
        <>
            {/* Floating toggle — only once at least one item is added */}
            {count > 0 && !isOpen && (
                <button className="quote-fab" onClick={openCart} aria-label={t('quote_cart_title')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM20 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    <span className="quote-fab-badge">{count}</span>
                </button>
            )}

            <div className={`quote-cart-overlay ${isOpen ? 'open' : ''}`} onClick={closeCart} />

            <aside className={`quote-cart ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
                <div className="quote-cart-head">
                    <h3>{t('quote_cart_title')}</h3>
                    <button className="quote-cart-close" onClick={closeCart} aria-label={t('a11y_close')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {items.length === 0 ? (
                    <p className="quote-cart-empty">{t('quote_empty')}</p>
                ) : (
                    <>
                        {sentNote && (
                            <p className="quote-cart-sent" role="status">
                                {t('quote_sent_note').replace('{ref}', sentNote)}
                            </p>
                        )}
                        <div className="quote-cart-items">
                            {items.map(item => (
                                <div className="quote-cart-item" key={item.slug}>
                                    <img src={item.image} alt="" loading="lazy" />
                                    <div className="quote-cart-item-body">
                                        <span className="quote-cart-item-title">{item.title}</span>
                                    </div>
                                    <button
                                        className="quote-cart-remove"
                                        onClick={() => removeItem(item.slug)}
                                        aria-label={`${t('quote_remove')}: ${item.title}`}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button className="quote-cart-clear" onClick={clear}>{t('quote_clear')}</button>

                        <button type="button" className="quote-cart-submit" onClick={requestQuote}>
                            {t('quote_request_btn')}
                        </button>
                        <p className="quote-cart-note">{t('quote_request_note')}</p>
                    </>
                )}
            </aside>
        </>
    );
};

export default QuoteCart;
