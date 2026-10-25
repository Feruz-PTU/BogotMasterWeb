// Email is sent by the Vercel serverless function at /api/send (which holds the
// Resend API key server-side). This module records the lead in Supabase and
// forwards the form data to that endpoint.
//
// NOTE: `saveInquiry` is now imported DYNAMICALLY. It used to be a static
// import, which pulled src/supabase/* — and therefore the whole Supabase SDK,
// roughly 110-140 KB — into the eagerly-loaded homepage bundle, defeating the
// dynamic imports the contexts were careful to use. The SDK is only needed at
// the moment someone actually submits a form.
//
// Every send has one reference (utils/leadReference.js), made here before both
// calls, so the saved lead, both emails and the success screen carry the same
// one. Each sender resolves to { success, reference, confirmation }:
// `confirmation` is true once the server reports the auto-reply as sent.

import { makeReference } from '../utils/leadReference';

async function postSend(payload) {
    const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    let data = {};
    try {
        data = await res.json();
    } catch {
        /* non-JSON response */
    }
    if (!res.ok || !data.success) {
        return {
            success: false,
            message: data.message || `Request failed (${res.status})`,
        };
    }
    return {
        success: true,
        // The server keeps the browser's reference; it makes its own only when
        // that one is missing or malformed.
        reference: data.reference || payload.reference,
        confirmation: data.confirmation === true,
    };
}

async function record(row) {
    try {
        const { saveInquiry } = await import('../supabase/data');
        await saveInquiry(row);
    } catch {
        // A failed save must never block the email, and the error object can
        // echo the submitted lead back into the console, so it is swallowed.
    }
}

/** Fields shared by every form: where the lead came from. */
const context = (formData) => ({
    page_url: formData.page_url || null,
    language: formData.language || null,
    referrer_host: formData.referrer_host || null,
});

/** Anti-bot signals, forwarded so the server can re-check them. */
const guard = (formData) => ({
    company_website: formData.company_website || '',
    elapsed_ms: formData.elapsed_ms || 0,
});

/** The contact page's short form (Contact.jsx). */
export const sendContactEmail = async (formData, language = 'en') => {
    const reference = makeReference();
    record({
        type: 'contact',
        reference,
        name: formData.name,
        email: formData.email,
        message: formData.message,
        ...context(formData),
    });

    return postSend({
        type: 'contact',
        reference,
        language,
        name: formData.name,
        email: formData.email,
        message: formData.message,
        ...guard(formData),
    });
};

// The database refuses a lead over 8 KB (the inquiries_insert policy in
// supabase/phase2-migration.sql). A long Russian message alone can pass that,
// since each Cyrillic letter takes 2 bytes, so the database copy of the
// message is shortened when needed; the email always carries the full text.
const DB_LIMIT_BYTES = 7000;
const byteLength = (value) => new TextEncoder().encode(JSON.stringify(value)).length;

function fitForDatabase(row) {
    if (byteLength(row) <= DB_LIMIT_BYTES || !row.message) return row;
    const note = ' […] (shortened here; the full text is in the email)';
    let message = row.message;
    while (message.length > 0 && byteLength({ ...row, message: message + note }) > DB_LIMIT_BYTES) {
        message = message.slice(0, Math.floor(message.length * 0.9));
    }
    return { ...row, message: message + note };
}

/**
 * The request form (RequestForm.jsx), all four types. `request` holds the
 * fields its type shows (empty strings for the rest), the spam-guard fields
 * and the page context. The lead is saved first, so a failed email never loses it.
 */
export const sendRequest = async (request, language = 'en') => {
    const { company_website, elapsed_ms, page_url, referrer_host, ...fields } = request;
    const reference = makeReference();
    // Only filled fields are stored and sent.
    const filled = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => (Array.isArray(v) ? v.length > 0 : String(v ?? '').trim() !== ''))
    );
    const items = filled.items || [];
    const product = items.map((i) => i.title).join(', ');

    record(fitForDatabase({
        ...filled,
        reference,
        ...(product ? { product } : {}),
        ...context({ page_url, language, referrer_host }),
    }));

    return postSend({
        ...filled,
        reference,
        ...(product ? { product } : {}),
        items: items.map((i) => ({ title: i.title, quantity: i.quantity || '' })),
        language,
        ...guard({ company_website, elapsed_ms }),
    });
};
