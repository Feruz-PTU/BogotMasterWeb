/**
 * The published FAQ answers (src/data/build-faq.json, written by
 * scripts/fetch-content.mjs), kept out of the main bundle:
 * - the server build gets them up front from entry-server.jsx (provideFaq);
 * - a browser that opens /faq directly reads them back from the page itself:
 *   FaqList writes them into a JSON <script> next to the list;
 * - a browser that arrives from another page downloads them as their own
 *   chunk (loadFaq).
 * Public pages never ask the database.
 */
import { useEffect, useState } from 'react';
import { faqLanguages, sortFaq } from './faq';

export const FAQ_EMBED_ID = 'faq-data';

/** Server build only: every published answer. */
let provided = null;
/** Browser: language → answers, once read or downloaded. */
const ready = new Map();

export function provideFaq(data) {
    provided = Array.isArray(data?.items) ? data.items : [];
}

/**
 * The answers written in one language, as the page shows them:
 * { slug, group, q, a, links: [{ to, label }], updated }.
 */
export function localizeFaq(items, language) {
    return sortFaq(items)
        .filter((item) => faqLanguages(item, [language]).length)
        .map((item) => ({
            slug: item.slug,
            group: item.group,
            q: item[`q_${language}`].trim(),
            a: item[`a_${language}`].trim(),
            links: (Array.isArray(item.links) ? item.links : [])
                .filter((l) => l && typeof l.to === 'string' && l.to.trim())
                .map((l) => ({ to: l.to.trim(), label: String(l[`label_${language}`] || '').trim() })),
            updated: item.updated || '',
        }));
}

/** The answers if they are at hand without a download, else null. */
export function faqNow(language) {
    if (provided) return localizeFaq(provided, language);
    if (ready.has(language)) return ready.get(language);
    if (typeof document === 'undefined') return null;
    const el = document.getElementById(FAQ_EMBED_ID);
    if (!el) return null;
    try {
        const data = JSON.parse(el.textContent);
        // Another language's page may still be on screen while this one renders.
        if (data.language !== language || !Array.isArray(data.items)) return null;
        ready.set(language, data.items);
        return data.items;
    } catch {
        return null;
    }
}

export async function loadFaq(language) {
    const { default: data } = await import('../data/build-faq.json');
    const items = localizeFaq(data.items || [], language);
    ready.set(language, items);
    return items;
}

/**
 * The answers for `language` (null while they download). Pass null to skip,
 * for pages that are not the FAQ.
 */
export function useFaq(language) {
    const [state, setState] = useState(() => ({ language, items: language ? faqNow(language) : null }));
    const items = state.language === language ? state.items : language ? faqNow(language) : null;

    useEffect(() => {
        if (!language || items) return undefined;
        let live = true;
        loadFaq(language).then(
            (loaded) => live && setState({ language, items: loaded }),
            () => live && setState({ language, items: [] }),
        );
        return () => {
            live = false;
        };
    }, [language, items]);

    return items;
}

/** The newest of the given date and the answers' own dates (YYYY-MM-DD). */
export const latestFaqDate = (date, items) =>
    (items || []).reduce((max, i) => (/^\d{4}-\d{2}-\d{2}$/.test(i.updated) && i.updated > max ? i.updated : max), date);
