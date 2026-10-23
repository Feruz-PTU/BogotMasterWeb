/**
 * Cookieless, first-party analytics.
 *
 * Deliberately NOT Google Analytics / Plausible / Yandex Metrica:
 *  - no cookies and no localStorage, so no consent banner is required;
 *  - no third-party script, so nothing is shared with another company;
 *  - no new paid account.
 *
 * What is recorded per event: the event name (from a fixed list), the page
 * path, the language, and the REFERRER HOST ONLY (e.g. "google.com", never
 * the full referring URL). No visitor identifier of any kind is stored, so
 * events cannot be joined into a profile of one person. The trade-off is
 * honest: you get "which page produced enquiries", not unique-visitor counts.
 *
 * Events go to the `events` table in Supabase. The allowed names are enforced
 * again in the database by a CHECK constraint (supabase/phase2-migration.sql).
 */

import { parsePathname } from './i18n/languages';

export const EVENTS = {
    PAGE_VIEW: 'page_view',
    QUOTE_MODAL_OPEN: 'quote_modal_open',
    QUOTE_ADD: 'quote_add',
    FORM_SUBMIT_CONTACT: 'form_submit_contact',
    FORM_SUBMIT_PRICE: 'form_submit_price',
    FORM_SUBMIT_QUOTE: 'form_submit_quote',
    CLICK_PHONE: 'click_phone',
    CLICK_EMAIL: 'click_email',
    CLICK_WHATSAPP: 'click_whatsapp',
    CLICK_TELEGRAM: 'click_telegram',
    CLICK_CERTIFICATE: 'click_certificate',
};

const ALLOWED = new Set(Object.values(EVENTS));

/** Only the host, so we never store a full referring URL. */
function referrerHost() {
    try {
        if (!document.referrer) return null;
        const url = new URL(document.referrer);
        if (url.hostname === window.location.hostname) return null; // internal
        return url.hostname.slice(0, 120);
    } catch {
        return null;
    }
}

/**
 * The page's language, from the URL: the URL decides the language (see
 * LanguageContext). <html lang> is updated a moment after each page change,
 * so an event fired right after a navigation could carry the old language.
 */
function pageLanguage() {
    return parsePathname(window.location.pathname)?.lang || document.documentElement.lang || null;
}

/** Runs when the browser is idle, so tracking never competes with rendering. */
function whenIdle(fn) {
    if (typeof window === 'undefined') return;
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(fn, { timeout: 3000 });
    } else {
        setTimeout(fn, 600);
    }
}

/**
 * Switched off for the rest of the page after the first failure.
 *
 * The `events` table is created by supabase/phase2-migration.sql. Until that
 * has been run, every call would 404 — and a failed request is logged by the
 * browser no matter how the promise is handled, so an un-migrated site would
 * fill the console with errors. One attempt, then silence.
 */
let disabled = false;

export function track(name, extra = {}) {
    if (typeof window === 'undefined') return;
    if (disabled) return;
    if (!ALLOWED.has(name)) return;

    whenIdle(async () => {
        if (disabled) return;
        try {
            const { recordEvent } = await import('./supabase/data');
            await recordEvent({
                name,
                path: window.location.pathname.slice(0, 200),
                lang: pageLanguage(),
                referrer_host: referrerHost(),
                ...extra,
            });
        } catch {
            // Analytics must never break the page, and must never keep
            // retrying something that is not there.
            disabled = true;
        }
    });
}

/** Context attached to a lead so you can see which page produced it. */
export function leadContext(language) {
    if (typeof window === 'undefined') return {};
    return {
        page_url: window.location.pathname.slice(0, 200),
        language: language || pageLanguage(),
        referrer_host: referrerHost(),
    };
}
