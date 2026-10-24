import { useState } from 'react';
import './Contact.css';
import SocialButtons from './SocialButtons';
import { sendContactEmail } from '../services/emailService';
import { useContent } from '../context/ContentContext';
import { useReveal } from '../hooks/useReveal';
import { useLanguage } from '../context/LanguageContext';
import { useSpamGuard } from '../hooks/useSpamGuard';
import { track, EVENTS, leadContext } from '../analytics';
import { telHref, mailtoHref } from '../utils/links';
import LocalLink from './LocalLink';
import { CONTACT_INFO } from '../config';

const Contact = ({ openPopup }) => {
    useReveal();
    const { t, language } = useLanguage();
    const { settings } = useContent();
    const { honeypotProps, isLikelyBot, guardPayload, reset } = useSpamGuard();

    const contactInfo = {
        phone: settings?.phone || [],
        email: settings?.email || '',
        address: settings?.address || '',
        website: settings?.website || '',
    };

    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    const validateForm = () => {
        const newErrors = {};

        // Was `t('form_name_placeholder')`, so the error for an empty Name
        // field literally read "John Doe".
        if (!formData.name.trim()) {
            newErrors.name = t('form_name_error');
        }

        if (!formData.email.trim()) {
            newErrors.email = t('form_email_error');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t('form_email_invalid');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
        if (submitStatus) setSubmitStatus(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        // Silently accept and discard: telling a bot why it failed helps it.
        if (isLikelyBot()) {
            setSubmitStatus('success');
            setFormData({ name: '', email: '', message: '' });
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const result = await sendContactEmail(
                { ...formData, ...guardPayload(), ...leadContext(language) },
                language
            );
            if (!result.success) throw new Error(result.message);
            setSubmitStatus('success');
            track(EVENTS.FORM_SUBMIT_CONTACT);
            setFormData({ name: '', email: '', message: '' });
            reset();
        } catch {
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="contact-section reveal" id="contact">
            {/* CTA Banner. Was an <h3> appearing before the page's <h2>, which
                inverted the heading outline on the contact page. */}
            <div className="contact-cta-wrapper reveal">
                <div className="contact-cta">
                    <div className="contact-cta-content">
                        <p className="contact-cta-title">{t('contact_cta_title')}</p>
                        <p>{t('contact_cta_text')}</p>
                        <p className="contact-cta-faq">
                            <LocalLink to="/faq">{t('contact_faq_link')}</LocalLink>
                        </p>
                    </div>
                    <button type="button" className="btn-cta" onClick={openPopup}>
                        {t('contact_cta_btn')}
                    </button>
                </div>
            </div>

            <div className="contact-container">
                {/* Left Column - Details */}
                <div className="contact-info reveal reveal-delay-1">
                    {/* The contact page had no h1 at all. */}
                    <h1>{t('contact_title')}</h1>

                    <div className="contact-details">
                        {/* Address */}
                        <div className="contact-item">
                            <div className="icon-wrapper" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" focusable="false">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                                </svg>
                            </div>
                            <div className="contact-text">
                                <h3>{t('contact_address')}</h3>
                                <p>{t('address_line_1')}<br />{t('address_line_2')}</p>
                                <p className="contact-legal">
                                    {t('legal_name_label')}: {CONTACT_INFO.legal_name} ({t('legal_form_note')})
                                    <br />
                                    {t('inn_label')}: {CONTACT_INFO.inn_display}
                                </p>
                            </div>
                        </div>

                        {/* The person who answers: a name, languages and hours
                            tell a buyer abroad who will reply, and when. */}
                        <div className="contact-item">
                            <div className="icon-wrapper" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" focusable="false">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                </svg>
                            </div>
                            <div className="contact-text">
                                <h3>{t('sales_contact_title')}</h3>
                                <p>{t('sales_contact_name')}</p>
                                <p className="contact-sub">{t('sales_contact_languages')}</p>
                                <p className="contact-sub">{t('sales_contact_hours')}</p>
                            </div>
                        </div>

                        {/* Phone — now tappable. These were plain <p> text, so a
                            buyer on a phone could not call and a buyer on a
                            desktop could not click. */}
                        <div className="contact-item">
                            <div className="icon-wrapper" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" focusable="false">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                                </svg>
                            </div>
                            <div className="contact-text">
                                <h3>{t('contact_phone')}</h3>
                                {contactInfo.phone.map((phone) => (
                                    <p key={phone}>
                                        <a
                                            href={telHref(phone)}
                                            onClick={() => track(EVENTS.CLICK_PHONE)}
                                        >
                                            {phone}
                                        </a>
                                    </p>
                                ))}
                            </div>
                        </div>

                        {/* Email */}
                        <div className="contact-item">
                            <div className="icon-wrapper" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" focusable="false">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                </svg>
                            </div>
                            <div className="contact-text">
                                <h3>{t('contact_email')}</h3>
                                <p>
                                    <a
                                        href={mailtoHref(contactInfo.email)}
                                        onClick={() => track(EVENTS.CLICK_EMAIL)}
                                    >
                                        {contactInfo.email}
                                    </a>
                                </p>
                            </div>
                        </div>

                        {/* Site */}
                        <div className="contact-item">
                            <div className="icon-wrapper" aria-hidden="true">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" focusable="false">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                                </svg>
                            </div>
                            <div className="contact-text">
                                <h3>{t('contact_website')}</h3>
                                <p>
                                    <a href={contactInfo.website}>
                                        {settings?.website_display || contactInfo.website}
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Form */}
                <div className="contact-form-wrapper reveal reveal-delay-2">
                    <form className="contact-form" onSubmit={handleSubmit} noValidate>
                        <input {...honeypotProps} />

                        <div className="form-group">
                            <label htmlFor="contact-name">
                                {t('form_name')} <span aria-hidden="true">*</span>
                            </label>
                            <input
                                id="contact-name"
                                type="text"
                                name="name"
                                autoComplete="name"
                                required
                                aria-required="true"
                                aria-invalid={errors.name ? 'true' : undefined}
                                aria-describedby={errors.name ? 'contact-name-error' : undefined}
                                value={formData.name}
                                onChange={handleChange}
                                className={`form-input ${errors.name ? 'error' : ''}`}
                                placeholder={t('form_name_placeholder')}
                            />
                            {errors.name && (
                                <span className="error-message" id="contact-name-error" role="alert">
                                    {errors.name}
                                </span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="contact-email">
                                {t('form_email')} <span aria-hidden="true">*</span>
                            </label>
                            <input
                                id="contact-email"
                                type="email"
                                name="email"
                                inputMode="email"
                                autoComplete="email"
                                required
                                aria-required="true"
                                aria-invalid={errors.email ? 'true' : undefined}
                                aria-describedby={errors.email ? 'contact-email-error' : undefined}
                                value={formData.email}
                                onChange={handleChange}
                                className={`form-input ${errors.email ? 'error' : ''}`}
                                placeholder={t('form_email_placeholder')}
                            />
                            {errors.email && (
                                <span className="error-message" id="contact-email-error" role="alert">
                                    {errors.email}
                                </span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="contact-message">{t('form_comment')}</label>
                            <textarea
                                id="contact-message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                className="form-textarea"
                                rows="4"
                            ></textarea>
                        </div>

                        {submitStatus === 'success' && (
                            <div className="success-message" role="status" aria-live="polite">
                                {t('form_success')}
                            </div>
                        )}

                        {/* An error used to be a dead end. It now offers the
                            channels that do not depend on this form working. */}
                        {submitStatus === 'error' && (
                            <div className="error-message-box" role="alert">
                                <p>{t('form_error')}</p>
                                <p>
                                    <a href={mailtoHref(contactInfo.email)} onClick={() => track(EVENTS.CLICK_EMAIL)}>
                                        {contactInfo.email}
                                    </a>
                                    {contactInfo.phone[0] && (
                                        <>
                                            {' · '}
                                            <a href={telHref(contactInfo.phone[0])} onClick={() => track(EVENTS.CLICK_PHONE)}>
                                                {contactInfo.phone[0]}
                                            </a>
                                        </>
                                    )}
                                </p>
                            </div>
                        )}

                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? t('form_sending') : t('form_submit')}
                        </button>

                        {/* The auto-reply email already promises 24 hours;
                            the site never said so. */}
                        <p className="form-reply-note">{t('form_reply_time')}</p>

                        <p className="form-privacy-note">
                            {t('form_privacy_note')}{' '}
                            <LocalLink to="/privacy">{t('privacy_title')}</LocalLink>
                        </p>

                        <SocialButtons />
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Contact;
