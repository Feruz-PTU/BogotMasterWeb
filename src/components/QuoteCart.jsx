import { useState, useEffect, useId } from 'react';
import './QuoteCart.css';
import { useQuote } from '../context/QuoteContext';
import { useLanguage } from '../context/LanguageContext';
import { sendQuoteEmail } from '../services/emailService';
import { isValidEmail, isValidPhone } from '../utils/formValidation';
import { INCOTERMS_ANY, INCOTERMS_SEA, QUANTITY_UNITS, incotermLabel } from '../i18n/incoterms';
import SuccessModal from './SuccessModal';
import LocalLink from './LocalLink';

const emptyForm = {
    name: '',
    company: '',
    email: '',
    phone: '',
    message: '',
    // Shipping details, all optional. They were sent and emailed but never shown.
    destination_country: '',
    destination_port: '',
    incoterms: '',
    total_quantity: '',
    quantity_unit: 't',
    timeline: '',
};

const QuoteCart = () => {
    const { items, count, isOpen, openCart, closeCart, removeItem, updateQuantity, clear } = useQuote();
    const { t, language } = useLanguage();
    const uid = useId();
    const fieldId = (name) => `${uid}-${name}`;

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
        // Was `form_email_error`, so an empty name read "Enter email".
        if (!form.name.trim()) e.name = t('form_name_error');
        if (!form.email.trim()) e.email = t('form_email_error');
        else if (!isValidEmail(form.email)) e.email = t('form_email_invalid');
        // Phone is optional; checked only when filled.
        if (form.phone.trim() && !isValidPhone(form.phone)) e.phone = t('modal_phone_invalid');
        setErrors(e);
        // The submit button is at the bottom of a long drawer: take the
        // visitor to the first field that needs fixing.
        const first = ['name', 'email', 'phone'].find((k) => e[k]);
        if (first) document.getElementById(fieldId(first))?.focus();
        return !first;
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        if (items.length === 0 || !validate()) return;
        setSubmitting(true);
        try {
            const res = await sendQuoteEmail(form, items, language);
            if (!res.success) throw new Error(res.message);
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

    const describedBy = (name, hasHint = false) =>
        [hasHint && fieldId(`${name}-hint`), errors[name] && fieldId(`${name}-error`)]
            .filter(Boolean)
            .join(' ') || undefined;

    const errorText = (name) =>
        errors[name] && (
            <span className="qc-error" id={fieldId(`${name}-error`)} role="alert">{errors[name]}</span>
        );

    // A plain optional text field of the shipping group.
    const tradeField = (name, label, props = {}) => (
        <div className="qc-field">
            <label htmlFor={fieldId(name)}>{label}</label>
            <input id={fieldId(name)} name={name} value={form[name]} onChange={handleChange} maxLength={80} {...props} />
        </div>
    );

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
                                            aria-label={`${t('modal_quantity')}: ${item.title}`}
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

                        <form className="quote-cart-form" onSubmit={handleSubmit} noValidate>
                            <div className="qc-field">
                                <label htmlFor={fieldId('name')}>
                                    {t('form_name')} <span aria-hidden="true">*</span>
                                </label>
                                <input id={fieldId('name')} name="name" autoComplete="name"
                                    value={form.name} onChange={handleChange}
                                    aria-required="true" aria-invalid={errors.name ? 'true' : undefined}
                                    aria-describedby={describedBy('name')} className={errors.name ? 'error' : ''} />
                                {errorText('name')}
                            </div>
                            <div className="qc-field">
                                <label htmlFor={fieldId('company')}>{t('quote_company')}</label>
                                <input id={fieldId('company')} name="company" autoComplete="organization"
                                    value={form.company} onChange={handleChange} maxLength={200} />
                            </div>
                            <div className="qc-field">
                                <label htmlFor={fieldId('email')}>
                                    {t('form_email')} <span aria-hidden="true">*</span>
                                </label>
                                <input id={fieldId('email')} name="email" type="email" inputMode="email" autoComplete="email"
                                    value={form.email} onChange={handleChange}
                                    aria-required="true" aria-invalid={errors.email ? 'true' : undefined}
                                    aria-describedby={describedBy('email')} className={errors.email ? 'error' : ''} />
                                {errorText('email')}
                            </div>
                            <div className="qc-field">
                                <label htmlFor={fieldId('phone')}>
                                    {t('modal_phone')} <span className="form-optional">({t('form_optional')})</span>
                                </label>
                                <input id={fieldId('phone')} name="phone" type="tel" autoComplete="tel"
                                    value={form.phone} onChange={handleChange}
                                    aria-invalid={errors.phone ? 'true' : undefined}
                                    aria-describedby={describedBy('phone', true)} className={errors.phone ? 'error' : ''} />
                                <span className="form-hint" id={fieldId('phone-hint')}>{t('form_phone_hint')}</span>
                                {errorText('phone')}
                            </div>

                            <fieldset className="qc-trade" aria-describedby={fieldId('trade-hint')}>
                                <legend>{t('quote_optional_title')}</legend>
                                <p className="form-hint" id={fieldId('trade-hint')}>{t('quote_optional_hint')}</p>

                                {tradeField('destination_country', t('quote_destination_country'), { autoComplete: 'country-name' })}
                                {tradeField('destination_port', t('quote_destination_port'))}

                                <div className="qc-field">
                                    <label htmlFor={fieldId('incoterms')}>{t('quote_incoterms')}</label>
                                    <select id={fieldId('incoterms')} name="incoterms" value={form.incoterms} onChange={handleChange}>
                                        <option value="">{t('quote_incoterms_choose')}</option>
                                        <optgroup label={t('quote_incoterms_any')}>
                                            {INCOTERMS_ANY.map((code) => (
                                                <option key={code} value={code}>{incotermLabel(code, language)}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label={t('quote_incoterms_sea')}>
                                            {INCOTERMS_SEA.map((code) => (
                                                <option key={code} value={code}>{incotermLabel(code, language)}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>

                                <div className="qc-row">
                                    <div className="qc-field">
                                        <label htmlFor={fieldId('total_quantity')}>{t('quote_total_quantity')}</label>
                                        <input id={fieldId('total_quantity')} name="total_quantity" inputMode="decimal"
                                            value={form.total_quantity} onChange={handleChange} maxLength={32} />
                                    </div>
                                    <div className="qc-field">
                                        <label htmlFor={fieldId('quantity_unit')}>{t('quote_unit')}</label>
                                        <select id={fieldId('quantity_unit')} name="quantity_unit" value={form.quantity_unit} onChange={handleChange}>
                                            {QUANTITY_UNITS.map((u) => (
                                                <option key={u.value} value={u.value}>{t(u.label)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {tradeField('timeline', t('quote_timeline'), { placeholder: t('quote_timeline_placeholder') })}
                            </fieldset>

                            <div className="qc-field">
                                <label htmlFor={fieldId('message')}>{t('form_comment')}</label>
                                <textarea id={fieldId('message')} name="message" value={form.message} onChange={handleChange} rows="2" />
                            </div>

                            {status === 'error' && <div className="qc-error-box" role="alert">{t('modal_error')}</div>}

                            <button type="submit" className="quote-cart-submit" disabled={submitting || status === 'success'}>
                                {submitting ? t('form_sending') : t('quote_submit')}
                            </button>

                            <div className="form-notes">
                                <p className="form-reply-note">{t('form_reply_time')}</p>
                                <p className="form-privacy-note">
                                    {t('form_privacy_note')}{' '}
                                    <LocalLink to="/privacy" onClick={closeCart}>{t('privacy_title')}</LocalLink>
                                </p>
                            </div>
                        </form>
                    </>
                )}
            </aside>
        </>
    );
};

export default QuoteCart;
