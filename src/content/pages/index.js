/**
 * The site's content pages (logistics, buyer's guide, applications, quality,
 * origin…): one entry here plus one Markdown file per language, the same way
 * the articles work (see ../articles/index.js).
 *
 * The routes, the prerender, the sitemap, llms.txt, the breadcrumb and the
 * structured data are all generated from this list. To add a page:
 *   1. Write `<id>.en.md` (and `<id>.ru.md`) in this folder. Start at the first
 *      section: the page prints the H1 itself. `## Heading {#anchor}` sets a
 *      heading's link anchor; without it one is made from the heading text.
 *   2. Add an entry below, with a title, H1 and meta description for every
 *      language in `languages`.
 * A page is built only in the languages it lists: never an English page with
 * a Russian body, or the other way round.
 *
 * The build stops if a page or its text still contains "[owner:" or
 * "[verify]" (scripts/content-guard.mjs), and if an entry breaks one of the
 * rules in `pageProblems` below.
 *
 * Entry fields:
 *   id          the Markdown file name; for a nested path use a flat id
 *               ('buyers-guide-hs-codes' for /buyers-guide/import-and-hs-codes)
 *   path        the English path; the Russian page is /ru + path
 *   parent      the parent page's id, or null; it builds the breadcrumb, and
 *               a parent lists its children under its own text
 *   section     the menu group (folder 21 builds the menu from it)
 *   schemaType  'WebPage' | 'CollectionPage' (a hub: lists its children) |
 *               'TechArticle' (a guide chapter) | 'DefinedTermSet' (the glossary)
 *   languages   e.g. ['en', 'ru']
 *   title       { en, ru }: the <title>, 60 characters or fewer
 *   h1          { en, ru }
 *   meta        { en, ru }: the meta description, 155 characters or fewer
 *   navTitle    { en, ru }, optional: a shorter name for breadcrumbs and lists
 *   updated     'YYYY-MM-DD': shown on the page and used in the structured data
 *   priority    the sitemap priority, 0.1 to 1.0
 */
export const PAGES = [
    // Folder 08 adds the first page (/logistics). An entry looks like this:
    // {
    //     id: 'logistics',
    //     path: '/logistics',
    //     parent: null,
    //     section: 'logistics',
    //     schemaType: 'WebPage',
    //     languages: ['en', 'ru'],
    //     title: { en: 'Shipping and Incoterms | Bogot Master', ru: '…' },
    //     h1: { en: 'Shipping, loads and Incoterms', ru: '…' },
    //     meta: { en: '…', ru: '…' },
    //     updated: '2026-10-24',
    //     priority: 0.7,
    // },
];

export const SCHEMA_TYPES = ['WebPage', 'CollectionPage', 'TechArticle', 'DefinedTermSet'];

export const findPage = (id) => PAGES.find((p) => p.id === id);

export const pageByPath = (path) => PAGES.find((p) => p.path === path);

/** The short name of a page in a language: navTitle, else the H1. */
export const pageName = (page, code) => page.navTitle?.[code] || page.h1[code];

/** The page's ancestors, nearest last (for the breadcrumb). */
export function pageAncestors(page) {
    const chain = [];
    for (let p = findPage(page.parent); p; p = findPage(p.parent)) chain.unshift(p);
    return chain;
}

/** The pages whose parent is this page, in registry order. */
export const childPages = (page) => PAGES.filter((p) => p.parent === page.id);

/** First path segments of the registry pages ('logistics', 'buyers-guide'…). */
export const pageTopSegments = () => [...new Set(PAGES.map((p) => p.path.split('/')[1]))];

/**
 * Where the language switcher sends a reader of `routePath` who picks
 * language `code`: the same page if it exists in that language, else its
 * nearest ancestor that does, else the home page.
 */
export function pageRouteInLanguage(routePath, code) {
    const page = pageByPath(routePath);
    if (!page || page.languages.includes(code)) return routePath;
    const fallback = [...pageAncestors(page)].reverse().find((p) => p.languages.includes(code));
    return fallback ? fallback.path : '/';
}

/**
 * What is wrong with the registry, as a list of messages (empty when all is
 * well). The prerender stops the build on any of them. `bodyExists(id, code)`
 * is passed in by the caller, which can read the file system.
 */
export function pageProblems({ reservedPaths = [], liveLanguages = [], bodyExists } = {}) {
    const problems = [];
    const seen = { id: new Set(), path: new Set() };
    for (const page of PAGES) {
        const where = `page "${page.id || '?'}"`;
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(page.id || '')) problems.push(`${where}: id must be lowercase words joined by "-"`);
        if (!/^(\/[a-z0-9]+(-[a-z0-9]+)*)+$/.test(page.path || '')) problems.push(`${where}: path must look like /word or /word/word-word`);
        for (const key of ['id', 'path']) {
            if (seen[key].has(page[key])) problems.push(`${where}: ${key} "${page[key]}" is used twice`);
            seen[key].add(page[key]);
        }
        if (reservedPaths.some((r) => page.path === r || page.path.startsWith(`${r}/`))) {
            problems.push(`${where}: path ${page.path} clashes with an existing route`);
        }
        if (page.parent != null && !findPage(page.parent)) problems.push(`${where}: parent "${page.parent}" is not in the registry`);
        if (!SCHEMA_TYPES.includes(page.schemaType)) problems.push(`${where}: schemaType must be one of ${SCHEMA_TYPES.join(', ')}`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(page.updated || '')) problems.push(`${where}: updated must be YYYY-MM-DD`);
        if (!(page.priority >= 0.1 && page.priority <= 1)) problems.push(`${where}: priority must be between 0.1 and 1.0`);
        if (!page.languages?.length) problems.push(`${where}: no languages`);
        for (const code of page.languages || []) {
            if (liveLanguages.length && !liveLanguages.includes(code)) problems.push(`${where}: "${code}" is not a live language`);
            for (const field of ['title', 'h1', 'meta']) {
                if (!page[field]?.[code]) problems.push(`${where}: no ${field} in "${code}"`);
            }
            if (page.title?.[code]?.length > 60) problems.push(`${where}: the ${code} title is ${page.title[code].length} characters (60 at most)`);
            if (page.meta?.[code]?.length > 155) problems.push(`${where}: the ${code} meta description is ${page.meta[code].length} characters (155 at most)`);
            if (bodyExists && !bodyExists(page.id, code)) problems.push(`${where}: no text file ${page.id}.${code}.md`);
        }
    }
    return problems;
}
