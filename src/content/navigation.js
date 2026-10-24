/**
 * The menu and the footer columns, built from the pages registry
 * (content/pages/index.js) by each page's `section`, so a new page appears in
 * both without editing them (Appendix B §B6; folder 21).
 *
 * A group is { id, label, items: [{ to, label }] } with language-independent
 * paths; LocalLink adds the language prefix. A page shows only in the
 * languages it is written in, and a group with no pages does not show: Quality
 * appears when the first `section: 'quality'` page goes live, About becomes a
 * dropdown when the Origin page (`section: 'about'`) does.
 */
import { PAGES, findPage, pageName } from './pages/index.js';

const item = (page, language) => ({ to: page.path, label: pageName(page, language) });

/** The live pages of one section, in registry order; `topOnly` keeps hubs and single pages. */
function sectionItems(section, language, { topOnly = false } = {}) {
    return PAGES.filter((p) => p.section === section && p.languages.includes(language) && (!topOnly || p.parent == null))
        .map((p) => item(p, language));
}

/** One page by id, if it is live in this language. */
function pageItems(id, language) {
    const page = findPage(id);
    return page && page.languages.includes(language) ? [item(page, language)] : [];
}

/**
 * The top menu. A group with one item is a plain link with the group's
 * label; with more, a dropdown. `t` is the language's string lookup.
 */
/** The applications pages, the hub named "All applications" (it is the group). */
const applicationItems = (language, t) =>
    sectionItems('applications', language).map((i) =>
        i.to === '/applications' ? { ...i, label: t('nav_applications_all') } : i);

export function menuGroups(language, t) {
    const applications = applicationItems(language, t);
    return [
        { id: 'products', label: t('products'), items: [{ to: '/products', label: t('products') }] },
        { id: 'applications', label: t('nav_applications'), items: applications },
        { id: 'quality', label: t('nav_quality'), items: sectionItems('quality', language) },
        { id: 'logistics', label: t('nav_logistics'), items: sectionItems('logistics', language) },
        {
            id: 'resources',
            label: t('nav_resources'),
            items: [...sectionItems('guide', language, { topOnly: true }), { to: '/articles', label: t('articles') }],
        },
        {
            id: 'about',
            label: t('about'),
            items: [{ to: '/about', label: t('nav_company') }, ...sectionItems('about', language)],
        },
    ].filter((g) => g.items.length);
}

/** The footer's link columns. */
export function footerGroups(language, t) {
    return [
        {
            id: 'products',
            label: t('products'),
            items: [
                { to: '/products', label: t('footer_all_products') },
                { to: '/products/custom-order', label: t('footer_custom_order') },
                { to: '/request', label: t('footer_request') },
            ],
        },
        { id: 'applications', label: t('nav_applications'), items: applicationItems(language, t) },
        {
            id: 'quality',
            label: t('footer_quality_shipping'),
            items: [...sectionItems('quality', language), ...sectionItems('logistics', language)],
        },
        {
            id: 'resources',
            label: t('nav_resources'),
            items: [
                ...sectionItems('guide', language, { topOnly: true }),
                ...pageItems('buyers-guide-glossary', language),
                { to: '/articles', label: t('articles') },
            ],
        },
        {
            id: 'company',
            label: t('footer_company'),
            items: [
                { to: '/about', label: t('about') },
                ...sectionItems('about', language),
                { to: '/contact', label: t('contact') },
                { to: '/privacy', label: t('privacy_title') },
            ],
        },
    ].filter((g) => g.items.length);
}

/** Whether `routePath` is one of the group's pages or below one. */
export const groupIsActive = (group, routePath) =>
    group.items.some((i) => routePath === i.to || routePath.startsWith(`${i.to}/`));
