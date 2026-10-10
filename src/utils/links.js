/**
 * Builders for the contact protocols.
 *
 * Phone numbers and email addresses were previously rendered as plain <p>
 * text everywhere on the public site — `tel:` and `mailto:` appeared only
 * inside the admin dashboard. A buyer on a phone could not tap to call.
 */

/** "+998 97 712 98 26" -> "tel:+998977129826" */
export const telHref = (phone) =>
    `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;

export const mailtoHref = (email) => `mailto:${String(email || '').trim()}`;

/** Digits only, as wa.me expects. */
export const whatsappHref = (number, message) => {
    const digits = String(number || '').replace(/\D/g, '');
    const q = message ? `?text=${encodeURIComponent(message)}` : '';
    return `https://wa.me/${digits}${q}`;
};

export const telegramHref = (handle) =>
    `https://t.me/${String(handle || '').replace(/^@/, '')}`;
