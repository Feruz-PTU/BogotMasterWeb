// Email is sent by the Vercel serverless function at /api/send (which holds the
// Resend API key server-side). This module records the lead in Supabase and
// forwards the form data to that endpoint.
//
// NOTE: `saveInquiry` is now imported DYNAMICALLY. It used to be a static
// import, which pulled src/supabase/* — and therefore the whole Supabase SDK,
// roughly 110-140 KB — into the eagerly-loaded homepage bundle, defeating the
// dynamic imports the contexts were careful to use. The SDK is only needed at
// the moment someone actually submits a form.

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
    return { success: true };
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

export const sendContactEmail = async (formData, language = 'en') => {
    record({
        type: 'contact',
        name: formData.name,
        email: formData.email,
        message: formData.message,
        ...context(formData),
    });

    return postSend({
        type: 'contact',
        language,
        name: formData.name,
        email: formData.email,
        message: formData.message,
        ...guard(formData),
    });
};

export const sendPriceInquiryEmail = async (formData, language = 'en') => {
    record({
        type: 'price',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        product: formData.product,
        quantity: formData.quantity,
        message: formData.message,
        ...context(formData),
    });

    return postSend({
        type: 'price',
        language,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        product: formData.product,
        quantity: formData.quantity,
        message: formData.message,
        ...guard(formData),
    });
};

export const sendQuoteEmail = async (formData, items, language = 'en') => {
    // The optional B2B fields. Every one of these was previously missing, so
    // each enquiry began with a round-trip asking the basics.
    const text = (v) => String(v || '').trim();
    const totalQuantity = text(formData.total_quantity);
    const trade = {
        destination_country: text(formData.destination_country),
        destination_port: text(formData.destination_port),
        incoterms: text(formData.incoterms),
        total_quantity: totalQuantity,
        // The unit select always has a value; on its own it says nothing.
        quantity_unit: totalQuantity ? text(formData.quantity_unit) : '',
        timeline: text(formData.timeline),
    };

    record({
        type: 'quote',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company || '',
        items: items.map((i) => ({
            slug: i.slug,
            title: i.title,
            quantity: i.quantity || '',
        })),
        message: formData.message || '',
        ...trade,
        ...context(formData),
    });

    return postSend({
        type: 'quote',
        language,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company || '',
        product: items.map((i) => i.title).join(', '),
        items: items.map((i) => ({
            title: i.title,
            quantity: i.quantity || '',
        })),
        message: formData.message || '',
        ...trade,
        ...guard(formData),
    });
};
