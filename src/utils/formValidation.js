// Checks shared by the price form and the quote cart.

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/**
 * Phone is optional, so this only runs when the field is filled: 7–20 digits,
 * with an optional leading "+", spaces, dashes and brackets.
 */
export const isValidPhone = (value) => {
    const v = value.trim();
    if (!/^\+?[\d\s()-]+$/.test(v)) return false;
    const digits = v.replace(/\D/g, '').length;
    return digits >= 7 && digits <= 20;
};
