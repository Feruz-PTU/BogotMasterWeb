import { useState, useEffect, useId, useRef } from 'react';
import './PriceModal.css';
import SocialButtons from './SocialButtons';
import SuccessModal from './SuccessModal';
import LocalLink from './LocalLink';
import { sendPriceInquiryEmail } from '../services/emailService';
import { useLanguage } from '../context/LanguageContext';
import { useSpamGuard } from '../hooks/useSpamGuard';
import { track, EVENTS, leadContext } from '../analytics';
import { isValidEmail, isValidPhone } from '../utils/formValidation';

const emptyForm = { name: '', phone: '', email: '', quantity: '', message: '' };

/**
 * `requireQuantity` is false where the form asks a general question rather
 * than for a price (the contact page's "Write to us" banner, the About page's
 * consultation button).
 */
const PriceModal = ({ isOpen, onClose, productTitle, requireQuantity = true }) => {
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

    const [formData, setFormData] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);
    const { honeypotProps, isLikelyBot, guardPayload, reset, restartClock } = useSpamGuard();
    // Whether anything has been typed since the last send.
    const typed = useRef(false);

    useEffect(() => {
        if (!isOpen) return;
        track(EVENTS.QUOTE_MODAL_OPEN);
        // The bot check counts time from here, not from page load. Not when
        // something is already typed, though: a visitor who closes the form
        // and opens it again must not look like a bot.
        if (!typed.current) restartClock();
    }, [isOpen, restartClock]);

    // Hooks above this line: they must run on every render.
    if (!isOpen) return null;

    const validateForm = () => {
        const newErrors = {};

        // Was `t('form_name_placeholder')`, so the error read "John Doe".
        if (!formData.name.trim()) {
            newErrors.name = t('form_name_error');
        }

        // Phone is optional: a buyer abroad may prefer email only.
        if (formData.phone.trim() && !isValidPhone(formData.phone)) {
            newErrors.phone = t('modal_phone_invalid');
        }

        if (!formData.email.trim()) {
            newErrors.email = t('form_email_error');
        } else if (!isValidEmail(formData.email)) {
            newErrors.email = t('form_email_invalid');
        }

        if (requireQuantity && !formData.quantity.trim()) {
            newErrors.quantity = t('modal_quantity_error');
        }

        setErrors(newErrors);
        // On a phone the form is taller than the screen: take the visitor to
        // the first field that needs fixing.
        const first = ['name', 'phone', 'email', 'quantity'].find((k) => newErrors[k]);
        if (first) document.getElementById(fieldId(first))?.focus();
        return !first;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        typed.current = true;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Silently accept and discard: telling a bot why it failed helps it.
        if (isLikelyBot()) {
            setFormData(emptyForm);
            typed.current = false;
            setSubmitStatus('success');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await sendPriceInquiryEmail({
                ...formData,
                product: productTitle,
                ...guardPayload(),
                ...leadContext(language),
            }, language);

            if (!result.success) {
                throw new Error(result.message);
            }

            track(EVENTS.FORM_SUBMIT_PRICE);
            setFormData(emptyForm);
            typed.current = false;
            reset();
            setSubmitStatus('success');

        } catch (error) {
            console.error('Error submitting form:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSuccessClose = () => {
        setSubmitStatus(null);
        onClose();
    };

    // aria-describedby for a field: its hint, then its error when there is one.
    const describedBy = (name, hasHint = false) =>
        [hasHint && fieldId(`${name}-hint`), errors[name] && fieldId(`${name}-error`)]
            .filter(Boolean)
            .join(' ') || undefined;

    const errorText = (name) =>
        errors[name] && (
            <span className="error-message" id={fieldId(`${name}-error`)} role="alert">
                {errors[name]}
            </span>
        );

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <button className="modal-close" onClick={onClose} aria-label={t('a11y_close')}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="modal-header">
                        <h2>{t('modal_price_title')}</h2>
                        <p className="modal-product">{productTitle}</p>
                    </div>

                    <form className="modal-form" onSubmit={handleSubmit} noValidate>
                        <input {...honeypotProps} />

                        <div className="modal-form-group modal-group-name">
                            <label htmlFor={fieldId('name')}>
                                {t('form_name')} <span aria-hidden="true">*</span>
                            </label>
                            <input
                                id={fieldId('name')}
                                type="text"
                                name="name"
                                autoComplete="name"
                                aria-required="true"
                                aria-invalid={errors.name ? 'true' : undefined}
                                aria-describedby={describedBy('name')}
                                value={formData.name}
                                onChange={handleChange}
                                className={`modal-input ${errors.name ? 'error' : ''}`}
                                placeholder={t('form_name_placeholder')}
                            />
                            {errorText('name')}
                        </div>

                        <div className="modal-form-row modal-group-contact">
                            <div className="modal-form-group">
                                <label htmlFor={fieldId('phone')}>
                                    {t('modal_phone')} <span className="form-optional">({t('form_optional')})</span>
                                </label>
                                <input
                                    id={fieldId('phone')}
                                    type="tel"
                                    name="phone"
                                    autoComplete="tel"
                                    aria-invalid={errors.phone ? 'true' : undefined}
                                    aria-describedby={describedBy('phone', true)}
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`modal-input ${errors.phone ? 'error' : ''}`}
                                />
                                <span className="form-hint" id={fieldId('phone-hint')}>{t('form_phone_hint')}</span>
                                {errorText('phone')}
                            </div>

                            <div className="modal-form-group">
                                <label htmlFor={fieldId('email')}>
                                    {t('form_email')} <span aria-hidden="true">*</span>
                                </label>
                                <input
                                    id={fieldId('email')}
                                    type="email"
                                    name="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    aria-required="true"
                                    aria-invalid={errors.email ? 'true' : undefined}
                                    aria-describedby={describedBy('email')}
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`modal-input ${errors.email ? 'error' : ''}`}
                                    placeholder="example@mail.com"
                                />
                                {errorText('email')}
                            </div>
                        </div>

                        <div className="modal-form-group modal-group-quantity">
                            <label htmlFor={fieldId('quantity')}>
                                {t('modal_quantity')}{' '}
                                {requireQuantity
                                    ? <span aria-hidden="true">*</span>
                                    : <span className="form-optional">({t('form_optional')})</span>}
                            </label>
                            <input
                                id={fieldId('quantity')}
                                type="text"
                                name="quantity"
                                aria-required={requireQuantity ? 'true' : undefined}
                                aria-invalid={errors.quantity ? 'true' : undefined}
                                aria-describedby={describedBy('quantity', true)}
                                value={formData.quantity}
                                onChange={handleChange}
                                className={`modal-input ${errors.quantity ? 'error' : ''}`}
                                placeholder={t('modal_quantity_placeholder')}
                            />
                            <span className="form-hint" id={fieldId('quantity-hint')}>{t('form_moq_hint')}</span>
                            {errorText('quantity')}
                        </div>

                        <div className="modal-form-group modal-group-comment">
                            <label htmlFor={fieldId('message')}>{t('form_comment')}</label>
                            <textarea
                                id={fieldId('message')}
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                className="modal-textarea"
                                placeholder={t('modal_comment_placeholder')}
                                rows="3"
                            />
                        </div>

                        {submitStatus === 'error' && (
                            <div className="modal-error-message" role="alert">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{t('modal_error')}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="modal-submit-btn"
                            disabled={isSubmitting || submitStatus === 'success'}
                        >
                            {isSubmitting ? t('form_sending') : t('modal_submit')}
                        </button>

                        <div className="form-notes">
                            <p className="form-reply-note">{t('form_reply_time')}</p>
                            <p className="form-privacy-note">
                                {t('form_privacy_note')}{' '}
                                <LocalLink to="/privacy" onClick={onClose}>{t('privacy_title')}</LocalLink>
                            </p>
                        </div>

                        <SocialButtons productName={productTitle} />
                    </form>
                </div>
            </div>

            <SuccessModal
                isOpen={submitStatus === 'success'}
                onClose={handleSuccessClose}
                title={t('modal_success_title') || '✓ Inquiry Sent!'}
                message={t('modal_success') || 'Thank you! We have received your inquiry and will contact you shortly.'}
            />
        </>
    );
};

export default PriceModal;
