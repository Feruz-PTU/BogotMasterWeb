import { useState, useEffect } from 'react';
import './QuoteCart.css';
import { useQuote } from '../context/QuoteContext';
import { useLanguage } from '../context/LanguageContext';
import { sendQuoteEmail, isEmailConfigured } from '../services/emailService';
import SuccessModal from './SuccessModal';

const emptyForm = { name: '', company: '', email: '', phone: '', message: '' };

const QuoteCart = () => {
    const { items, count, isOpen, openCart, closeCart, removeItem, updateQuantity, clear } = useQuote();
    const { t, language } = useLanguage();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = t('form_email_error');
        if (!form.email.trim()) e.email = t('form_email_error');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('form_email_invalid');
        if (!form.phone.trim()) e.phone = t('modal_phone_error');
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        if (items.length === 0 || !validate()) return;
        setSubmitting(true);
        try {
            if (!isEmailConfigured()) {
                await new Promise(r => setTimeout(r, 800));
            } else {
                const res = await sendQuoteEmail(form, items, language);
                if (!res.success) throw new Error(res.message);
            }
            setStatus('success');
            setShowSuccess(true);
            setForm(emptyForm);
            setTimeout(() => {
                clear();
                setStatus(null);
                closeCart();
            }, 600);
        } catch {
            setStatus('error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* Success popup */}
            <SuccessModal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                title={t('modal_success_title') || '✓ Quote Sent!'}
                message={t('quote_success') || 'Thank you! Your quote request has been received. We will get back to you shortly.'}
            />

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
                    <button className="quote-cart-close" onClick={closeCart} aria-label="Close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {items.length === 0 ? (
                    <p className="quote-cart-empty">{t('quote_empty')}</p>
                ) : (
                    <>
                        <div className="quote-cart-items">
                            {items.map(item => (
                                <div className="quote-cart-item" key={item.slug}>
                                    <img src={item.image} alt={item.title} loading="lazy" />
                                    <div className="quote-cart-item-body">
                                        <span className="quote-cart-item-title">{item.title}</span>
                                        <input
                                            type="text"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.slug, e.target.value)}
                                            placeholder={t('quote_qty_placeholder')}
                                            className="quote-cart-qty"
                                        />
                                    </div>
                                    <button
                                        className="quote-cart-remove"
                                        onClick={() => removeItem(item.slug)}
                                        aria-label={t('quote_remove')}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button className="quote-cart-clear" onClick={clear}>{t('quote_clear')}</button>

                        <form className="quote-cart-form" onSubmit={handleSubmit}>
                            <div className="qc-field">
                                <input name="name" value={form.name} onChange={handleChange}
                                    placeholder={`${t('form_name')} *`} className={errors.name ? 'error' : ''} />
                                {errors.name && <span className="qc-error">{errors.name}</span>}
                            </div>
                            <div className="qc-field">
                                <input name="company" value={form.company} onChange={handleChange}
                                    placeholder={t('quote_company')} />
                            </div>
                            <div className="qc-field">
                                <input name="email" type="email" value={form.email} onChange={handleChange}
                                    placeholder={`${t('form_email')} *`} className={errors.email ? 'error' : ''} />
                                {errors.email && <span className="qc-error">{errors.email}</span>}
                            </div>
                            <div className="qc-field">
                                <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                                    placeholder={`${t('modal_phone')} *`} className={errors.phone ? 'error' : ''} />
                                {errors.phone && <span className="qc-error">{errors.phone}</span>}
                            </div>
                            <div className="qc-field">
                                <textarea name="message" value={form.message} onChange={handleChange}
                                    placeholder={t('form_comment')} rows="2" />
                            </div>

                            {status === 'error' && <div className="qc-error-box">{t('modal_error')}</div>}

                            <button type="submit" className="quote-cart-submit" disabled={submitting || status === 'success'}>
                                {submitting ? t('form_sending') : t('quote_submit')}
                            </button>
                        </form>
                    </>
                )}
            </aside>
        </>
    );
};

export default QuoteCart;
