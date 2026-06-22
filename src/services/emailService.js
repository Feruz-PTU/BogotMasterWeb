import { saveInquiry } from '../supabase/data';

// Email is sent by the Vercel serverless function at /api/send (which holds the
// Resend API key server-side). This module just records the lead in Supabase and
// forwards the form data to that endpoint.

async function postSend(payload) {
    const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    let data = {};
    try { data = await res.json(); } catch { /* non-JSON response */ }
    if (!res.ok || !data.success) {
        return { success: false, message: data.message || `Request failed (${res.status})` };
    }
    return { success: true };
}

export const sendContactEmail = async (formData, language = 'ru') => {
    // Record the lead first — a failed email must never lose it.
    saveInquiry({ type: 'contact', name: formData.name, email: formData.email, message: formData.message })
        .catch(err => console.warn('saveInquiry failed:', err));

    return postSend({
        type: 'contact',
        language,
        name: formData.name,
        email: formData.email,
        message: formData.message,
    });
};

export const sendPriceInquiryEmail = async (formData, language = 'ru') => {
    saveInquiry({ type: 'price', name: formData.name, email: formData.email, phone: formData.phone, product: formData.product, quantity: formData.quantity, message: formData.message })
        .catch(err => console.warn('saveInquiry failed:', err));

    return postSend({
        type: 'price',
        language,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        product: formData.product,
        quantity: formData.quantity,
        message: formData.message,
    });
};

export const sendQuoteEmail = async (formData, items, language = 'ru') => {
    saveInquiry({
        type: 'quote',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company || '',
        items: items.map(i => ({ slug: i.slug, title: i.title, quantity: i.quantity || '' })),
        message: formData.message || '',
    }).catch(err => console.warn('saveInquiry failed:', err));

    return postSend({
        type: 'quote',
        language,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company || '',
        product: items.map(i => i.title).join(', '),
        items: items.map(i => ({ title: i.title, quantity: i.quantity || '' })),
        message: formData.message || '',
    });
};

// Kept for backwards compatibility with the form components. Configuration now
// lives server-side (in the /api/send function), so the client always attempts
// to send and relies on the endpoint's response.
export const isEmailConfigured = () => true;
