/**
 * The FAQ's groups and order, and which languages an answer is written in:
 * the small part the public FAQ page needs. The admin's and the build's
 * checks are in ./faqChecks.js, so they stay out of the main bundle (a module
 * shared with the page lands there with everything any page imports from it).
 *
 * One answer, as the admin and the build see it:
 *   { id, slug, order, status,                 ← table columns (supabase/faq.sql)
 *     group, q_en, a_en, q_ru, a_ru,           ← the `data` document
 *     links: [{ to, label_en, label_ru }],
 *     related_products: ['powder', …],
 *     source, updated }
 *
 * An answer appears on a language's page only when it has both the question
 * and the answer in that language, so English can be published before the
 * Russian is ready.
 */

/** The five groups, in buying order (audit Appendix B §B4). */
export const FAQ_GROUPS = [
    { id: 'products', label: 'Products and grades' },
    { id: 'quality', label: 'Quality, testing and storage' },
    { id: 'ordering', label: 'Ordering and samples' },
    { id: 'shipping', label: 'Shipping, documents and customs' },
    { id: 'origin', label: 'Origin and the plant' },
];

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/** The languages in which the answer is complete: question and answer. */
export function faqLanguages(item, codes) {
    return codes.filter((c) => text(item[`q_${c}`]) && text(item[`a_${c}`]));
}

/** Group order first, then the order inside the group. */
export function sortFaq(items) {
    const rank = (g) => {
        const i = FAQ_GROUPS.findIndex((x) => x.id === g);
        return i === -1 ? FAQ_GROUPS.length : i;
    };
    return [...items].sort(
        (a, b) => rank(a.group) - rank(b.group) || (a.order ?? 0) - (b.order ?? 0) || String(a.slug).localeCompare(String(b.slug)),
    );
}
