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
    {
        // Facts: the owner's trade terms (22–23 Oct 2026) and the sales rep's
        // logistics answers (24 Oct 2026); see _dev/tasks/08-logistics-page.
        id: 'logistics',
        path: '/logistics',
        parent: null,
        section: 'logistics',
        schemaType: 'WebPage',
        languages: ['en', 'ru'],
        title: {
            en: 'Licorice Root Shipping, Incoterms & Documents | Bogot Master',
            ru: 'Доставка корня солодки, Incoterms, документы | Bogot Master',
        },
        h1: {
            en: 'Shipping, Incoterms and documents',
            ru: 'Доставка, Incoterms и документы',
        },
        meta: {
            en: 'How licorice root ships from Khorezm, Uzbekistan: the Incoterms we quote, packing, loads per container or truck, routes and shipping documents.',
            ru: 'Как корень солодки отправляется из Хорезма: условия Incoterms, упаковка, загрузка контейнера и фуры, маршруты и отгрузочные документы.',
        },
        updated: '2026-10-24',
        priority: 0.7,
    },
    {
        // The guide's hub: it lists its chapters as they are published.
        id: 'buyers-guide',
        path: '/buyers-guide',
        parent: null,
        section: 'guide',
        schemaType: 'CollectionPage',
        languages: ['en', 'ru'],
        title: {
            en: "Licorice Root Buyer's Guide | Bogot Master",
            ru: 'Руководство покупателя корня солодки | Bogot Master',
        },
        h1: {
            en: "Licorice root buyer's guide",
            ru: 'Руководство покупателя корня солодки',
        },
        navTitle: { en: "Buyer's guide", ru: 'Руководство покупателя' },
        meta: {
            en: 'Practical answers for importers of licorice root: customs codes and import rules, with chapters on grades, documents and ordering as they are written.',
            ru: 'Практические ответы для импортёров корня солодки: коды ТН ВЭД и правила импорта, а по мере написания — главы о фракциях, документах и заказе.',
        },
        updated: '2026-10-24',
        priority: 0.6,
    },
    {
        // Chapter 5 (Appendix B §B3). Sources are listed on the page.
        id: 'buyers-guide-hs-codes',
        path: '/buyers-guide/import-and-hs-codes',
        parent: 'buyers-guide',
        section: 'guide',
        schemaType: 'TechArticle',
        languages: ['en', 'ru'],
        title: {
            en: 'Licorice Root HS Codes and Import Rules | Bogot Master',
            ru: 'Коды ТН ВЭД и правила импорта корня солодки | Bogot Master',
        },
        h1: {
            en: 'Import rules and HS codes for licorice root',
            ru: 'Коды ТН ВЭД и правила импорта корня солодки',
        },
        navTitle: { en: 'Import rules and HS codes', ru: 'Коды ТН ВЭД и импорт' },
        meta: {
            en: 'HS codes for licorice root and extract (1211.90, 1302.12), the EAEU and Uzbek national lines, and the EU, US and UK import rules buyers ask about.',
            ru: 'Коды ТН ВЭД и ГС для корня и экстракта солодки (1211 90 860 1, 1211.90, 1302.12) и правила импорта в ЕС, США и Великобританию.',
        },
        updated: '2026-10-24',
        priority: 0.6,
    },
    {
        // 60 terms, each a ### heading with its own anchor (the same in EN
        // and RU); their DefinedTerm data is read from the Markdown.
        id: 'buyers-guide-glossary',
        path: '/buyers-guide/glossary',
        parent: 'buyers-guide',
        section: 'guide',
        schemaType: 'DefinedTermSet',
        languages: ['en', 'ru'],
        title: {
            en: 'Licorice Root Trade Glossary | Bogot Master',
            ru: 'Глоссарий торговли корнем солодки | Bogot Master',
        },
        h1: {
            en: 'Glossary of licorice root trade terms',
            ru: 'Глоссарий терминов торговли корнем солодки',
        },
        navTitle: { en: 'Glossary', ru: 'Глоссарий' },
        meta: {
            en: 'Short definitions of 60 terms in licorice root trade: the plant and its chemistry, quality tests, Incoterms, payment, documents and product forms.',
            ru: 'Краткие определения 60 терминов торговли корнем солодки: растение и химия, анализы качества, Incoterms, оплата, документы и формы продукции.',
        },
        updated: '2026-10-24',
        priority: 0.5,
    },
    {
        // Pharmacopoeia figures are cited on the page. No health claims, no
        // "pharmaceutical grade" or GMP. The parent becomes the applications
        // hub once folder 14 adds it.
        id: 'applications-pharmaceutical',
        path: '/applications/pharmaceutical',
        parent: null,
        section: 'applications',
        schemaType: 'WebPage',
        languages: ['en', 'ru'],
        title: {
            en: 'Liquorice Root for Pharmaceutical Use | Bogot Master',
            ru: 'Корень солодки для фармацевтики | Bogot Master',
        },
        h1: {
            en: 'Licorice root for pharmaceutical manufacturing',
            ru: 'Корень солодки для фармацевтического производства',
        },
        navTitle: { en: 'Pharmaceutical use', ru: 'Для фармацевтики' },
        meta: {
            en: 'Liquorice root as a herbal substance: Ph. Eur. 0277, the EMA monograph, the Russian pharmacopoeia and the documents pharma buyers ask for.',
            ru: 'Корень солодки как лекарственное растительное сырьё: Ph. Eur. 0277, монография EMA, ФС.2.5.0040.15 и документы для фармацевтических закупок.',
        },
        updated: '2026-10-24',
        priority: 0.6,
    },
    {
        // Root first, then the partner's extract (never shown as ours). The
        // EU and US figures were read on EUR-Lex and GovInfo on 24 Oct 2026.
        // No health or nutrition claims. Parent: the hub, from folder 14.
        id: 'applications-food',
        path: '/applications/food-and-confectionery',
        parent: null,
        section: 'applications',
        schemaType: 'WebPage',
        languages: ['en', 'ru'],
        title: {
            en: 'Licorice for Food, Drinks & Confectionery | Bogot Master',
            ru: 'Солодка для пищевой и кондитерской отрасли | Bogot Master',
        },
        h1: {
            en: 'Licorice root and extract for food, drinks and confectionery',
            ru: 'Корень и экстракт солодки для продуктов питания, напитков и кондитерских изделий',
        },
        navTitle: { en: 'Food and confectionery', ru: 'Пищевая отрасль' },
        meta: {
            en: 'Licorice root and extract for sweets, drinks and tea: the forms, EU labelling and ochratoxin A limits, US limits and the documents food buyers ask for.',
            ru: 'Корень и экстракт солодки для кондитерских изделий, напитков и чая: формы поставки, маркировка и охратоксин A в ЕС, нормы США, документы.',
        },
        updated: '2026-10-24',
        priority: 0.6,
    },
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
