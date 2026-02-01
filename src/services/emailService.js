import emailjs from '@emailjs/browser';

import { EMAILJS_CONFIG } from '../config';

// Link to config file for easier editing
const EMAIL_CONFIG = EMAILJS_CONFIG;

// Initialize EmailJS with public key
emailjs.init(EMAIL_CONFIG.publicKey);

/**
 * Send contact form email
 * @param {Object} formData - { name, email, message }
 * @returns {Promise}
 */
export const sendContactEmail = async (formData) => {
    try {
        const templateParams = {
            from_name: formData.name,
            from_email: formData.email,
            message: formData.message,
            to_name: 'Feruz Team', // Your name/company
        };

        const response = await emailjs.send(
            EMAIL_CONFIG.serviceId,
            EMAIL_CONFIG.contactTemplateId,
            templateParams
        );

        return {
            success: true,
            message: 'Email sent successfully',
            response
        };
    } catch (error) {
        console.error('EmailJS Error:', error);
        return {
            success: false,
            message: error.text || 'Failed to send email',
            error
        };
    }
};

/**
 * Send price inquiry email
 * @param {Object} formData - { name, phone, email, quantity, message, product }
 * @returns {Promise}
 */
export const sendPriceInquiryEmail = async (formData) => {
    try {
        const templateParams = {
            from_name: formData.name,
            from_email: formData.email,
            phone: formData.phone,
            product_name: formData.product,
            quantity: formData.quantity,
            message: formData.message || 'Нет дополнительных комментариев',
            to_name: 'Feruz Team', // Your name/company
        };

        const response = await emailjs.send(
            EMAIL_CONFIG.serviceId,
            EMAIL_CONFIG.priceTemplateId,
            templateParams
        );

        return {
            success: true,
            message: 'Email sent successfully',
            response
        };
    } catch (error) {
        console.error('EmailJS Error:', error);
        return {
            success: false,
            message: error.text || 'Failed to send email',
            error
        };
    }
};

/**
 * Validate email configuration
 * @returns {boolean}
 */
export const isEmailConfigured = () => {
    return (
        EMAIL_CONFIG.serviceId !== 'YOUR_SERVICE_ID' &&
        EMAIL_CONFIG.contactTemplateId !== 'YOUR_CONTACT_TEMPLATE_ID' &&
        EMAIL_CONFIG.priceTemplateId !== 'YOUR_PRICE_TEMPLATE_ID' &&
        EMAIL_CONFIG.publicKey !== 'YOUR_PUBLIC_KEY'
    );
};
