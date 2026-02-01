import React, { useState } from 'react';
import './PriceModal.css';
import SocialButtons from './SocialButtons';
import { sendPriceInquiryEmail, isEmailConfigured } from '../services/emailService';

import { useLanguage } from '../context/LanguageContext';

const PriceModal = ({ isOpen, onClose, productTitle, onSubmitSuccess }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        quantity: '',
        message: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    if (!isOpen) return null;

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = t('form_name_placeholder'); // or specific error
        }

        if (!formData.phone.trim()) {
            newErrors.phone = t('modal_phone_error');
        } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
            newErrors.phone = t('modal_phone_invalid');
        }

        if (!formData.email.trim()) {
            newErrors.email = t('form_email_error');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t('form_email_invalid');
        }

        if (!formData.quantity.trim()) {
            newErrors.quantity = t('modal_quantity_error');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
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

        setIsSubmitting(true);

        try {
            // Check if EmailJS is configured
            if (!isEmailConfigured()) {
                console.warn('EmailJS not configured. See src/services/emailService.js');
                // Simulate success for demo purposes
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                // Send email via EmailJS
                const result = await sendPriceInquiryEmail({
                    ...formData,
                    product: productTitle
                });

                if (!result.success) {
                    throw new Error(result.message);
                }
            }

            // Reset form
            setFormData({
                name: '',
                phone: '',
                email: '',
                quantity: '',
                message: ''
            });

            setSubmitStatus('success');

            // Close modal after showing success message
            setTimeout(() => {
                onClose();
                setSubmitStatus(null);
            }, 2000);

        } catch (error) {
            console.error('Error submitting form:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="modal-header">
                    <h2>{t('modal_price_title')}</h2>
                    <p className="modal-product">{productTitle}</p>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="modal-form-group">
                        <label>{t('form_name')} *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`modal-input ${errors.name ? 'error' : ''}`}
                            placeholder={t('form_name_placeholder')}
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="modal-form-row">
                        <div className="modal-form-group">
                            <label>{t('modal_phone')} *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={`modal-input ${errors.phone ? 'error' : ''}`}
                                placeholder="+998 90 123 45 67"
                            />
                            {errors.phone && <span className="error-message">{errors.phone}</span>}
                        </div>

                        <div className="modal-form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`modal-input ${errors.email ? 'error' : ''}`}
                                placeholder="example@mail.com"
                            />
                            {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>
                    </div>

                    <div className="modal-form-group">
                        <label>{t('modal_quantity')} *</label>
                        <input
                            type="text"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            className={`modal-input ${errors.quantity ? 'error' : ''}`}
                            placeholder={t('modal_quantity_placeholder')}
                        />
                        {errors.quantity && <span className="error-message">{errors.quantity}</span>}
                    </div>

                    <div className="modal-form-group">
                        <label>{t('form_comment')}</label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            className="modal-textarea"
                            placeholder={t('modal_comment_placeholder')}
                            rows="3"
                        />
                    </div>

                    {submitStatus === 'success' && (
                        <div className="modal-success-message">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{t('modal_success')}</span>
                        </div>
                    )}

                    {submitStatus === 'error' && (
                        <div className="modal-error-message">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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

                    <SocialButtons productName={productTitle} />
                </form>
            </div>
        </div>
    );
};

export default PriceModal;
