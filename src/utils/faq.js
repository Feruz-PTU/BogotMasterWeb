/**
 * The FAQ's fixed lists and checks, shared by the admin editor
 * (pages/admin/FaqAdmin.jsx), the build (scripts/fetch-content.mjs) and the
 * FAQ page.
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
import { findPlaceholders } from './placeholder.js';

/** The five groups, in buying order (audit Appendix B §B4). */
export const FAQ_GROUPS = [
    { id: 'products', label: 'Products and grades' },
    { id: 'quality', label: 'Quality, testing and storage' },
    { id: 'ordering', label: 'Ordering and samples' },
    { id: 'shipping', label: 'Shipping, documents and customs' },
    { id: 'origin', label: 'Origin and the plant' },
];

export const FAQ_STATUSES = [
    { id: 'published', label: 'Published', hint: 'On the site after the next rebuild.' },
    { id: 'needs_owner', label: 'Needs owner', hint: 'Waiting for a fact from the owner. Not on the site.' },
    { id: 'draft', label: 'Draft', hint: 'Not on the site.' },
];

/** Where the answer's facts come from. */
export const FAQ_SOURCES = [
    { id: 'site', label: 'Facts already on the site' },
    { id: 'owner', label: "The owner's answer" },
    { id: 'reg', label: 'A law, standard or published source' },
];

/** The anchor rule; supabase/faq.sql enforces the same one. */
export const FAQ_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const FAQ_SLUG_MAX = 80;

/** The recommended answer length, in words (audit §4.1). */
export const FAQ_WORDS = { min: 40, max: 100 };

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/** The languages in which the answer is complete: question and answer. */
export function faqLanguages(item, codes) {
    return codes.filter((c) => text(item[`q_${c}`]) && text(item[`a_${c}`]));
}

/** Words in an answer, not counting the addresses of Markdown links. */
export function faqWordCount(answer) {
    const plain = text(answer).replace(/\]\([^)]*\)/g, ']');
    return plain ? plain.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
}

/** Every "[owner: …]" or "[verify]" mark anywhere in the answer's text. */
export function faqPlaceholders(item) {
    const found = [];
    const walk = (value) => {
        if (typeof value === 'string') found.push(...findPlaceholders(value));
        else if (Array.isArray(value)) value.forEach(walk);
        else if (value && typeof value === 'object') Object.values(value).forEach(walk);
    };
    for (const [key, value] of Object.entries(item)) {
        if (!['id', 'slug', 'order', 'status', 'createdAt', 'updatedAt'].includes(key)) walk(value);
    }
    return found;
}

/** A link target the page can use: a site path, or a full https address. */
export const isFaqLinkTarget = (to) => /^\/(?!\/)\S*$/.test(text(to)) || /^https:\/\/\S+$/.test(text(to));

/**
 * What stands between an answer and publishing.
 * - errors, as { code, message }: it cannot be published until these are
 *   fixed. code is 'slug', 'group', 'text' or 'marks' (an "[owner: …]" or
 *   "[verify]" mark is left);
 * - warnings, as messages: it can be published, but someone should look.
 * `codes` are the site's languages; `productSlugs`, when given, are the
 * products a related-product slug may name.
 */
export function faqProblems(item, { codes = ['en', 'ru'], productSlugs } = {}) {
    const errors = [];
    const warnings = [];
    const error = (code, message) => errors.push({ code, message });
    const slug = text(item.slug);

    if (!slug) error('slug', 'The anchor (slug) is empty.');
    else if (!FAQ_SLUG.test(slug) || slug.length > FAQ_SLUG_MAX) {
        error('slug', 'The anchor may only use lowercase letters, digits and single hyphens (e.g. "hs-code").');
    }
    if (!FAQ_GROUPS.some((g) => g.id === item.group)) error('group', 'Choose a group.');

    const complete = faqLanguages(item, codes);
    if (!complete.length) error('text', 'It needs a question and an answer in at least one language.');

    const marks = faqPlaceholders(item);
    if (marks.length) {
        error('marks', `It still has ${marks.length === 1 ? 'a mark' : `${marks.length} marks`} to fill in: ${[...new Set(marks)].join(', ')}.`);
    }

    for (const c of codes) {
        const q = text(item[`q_${c}`]);
        const a = text(item[`a_${c}`]);
        const label = c.toUpperCase();
        if (complete.length && !complete.includes(c)) {
            warnings.push(q || a
                ? `${label}: the question or the answer is empty, so it will not show on the ${label} page.`
                : `No ${label} text yet: it will not show on the ${label} page.`);
        }
        if (a) {
            const words = faqWordCount(a);
            if (words < FAQ_WORDS.min || words > FAQ_WORDS.max) {
                warnings.push(`${label} answer: ${words} words (aim for ${FAQ_WORDS.min}–${FAQ_WORDS.max}).`);
            }
        }
    }

    for (const link of Array.isArray(item.links) ? item.links : []) {
        if (!isFaqLinkTarget(link?.to)) {
            warnings.push(`Link "${text(link?.to) || '(empty)'}" should be a site path such as /logistics#incoterms, or a full https:// address.`);
        }
    }
    if (productSlugs) {
        for (const s of Array.isArray(item.related_products) ? item.related_products : []) {
            if (!productSlugs.includes(s)) warnings.push(`Related product "${s}" is not on the site.`);
        }
    }
    return { errors, warnings };
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
