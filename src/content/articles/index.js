/**
 * The articles published under /articles.
 *
 * Each article's text is a Markdown file next to this one, named
 * `<slug>.<language>.md`, and is rendered by components/Markdown.jsx. This
 * file holds only what the list pages need, so it stays small and plain:
 * scripts/prerender.mjs imports it in Node to know which article pages to
 * build and to list them in the sitemap.
 *
 * To publish an article:
 *   1. Add `<slug>.en.md` here (and `<slug>.ru.md` if there is a Russian
 *      version). Start the file at the first section; the page prints the
 *      title itself.
 *   2. Add an entry below with a title and summary for every language it
 *      exists in. A translated version also gets `translatedFrom: '<code>'`,
 *      and its page opens with a note linking to the original.
 *
 * An article only gets a page in the languages listed under `languages`. A
 * Russian visitor to /ru/articles still sees an English-only article in the
 * list, linked to its English page and marked as being in English; there is
 * deliberately no /ru/articles/<slug> page showing English text.
 *
 * Newest first: the list pages show articles in this order.
 */
export const ARTICLES = [
    {
        // Folders 34–35: drafted as a Claude Doc, reviewed by three agents
        // (facts, claims, clarity) on 26 Oct 2026. UN Comtrade figures pulled
        // on 26 Oct 2026; the charts are SVGs drawn by
        // scripts/article-charts/extract-trade.mjs. Re-pull before a revision:
        // 2024 and 2025 are still incomplete.
        slug: 'licorice-extract-world-trade',
        published: '2026-10-26',
        languages: {
            en: {
                title: 'Licorice Extract in World Trade, 2000–2025: Exporters, Importers and Prices',
                shortTitle: 'Licorice Extract in World Trade, 2000–2025',
                summary:
                    "What UN Comtrade data on licorice extract (HS 1302.12) show for 2000–2025: who exports and imports it, prices per tonne, Uzbekistan's exports, and where the statistics fall short.",
                description:
                    "UN Comtrade data on licorice extract (HS 1302.12), 2000–2025: exporters, importers, prices per tonne, Uzbekistan's exports and the gaps in the statistics.",
            },
            ru: {
                title: 'Экстракт солодки в мировой торговле, 2000–2025: экспортёры, импортёры и цены',
                shortTitle: 'Экстракт солодки в мировой торговле, 2000–2025',
                summary:
                    'Что данные UN Comtrade об экстракте солодки (ГС 1302.12) показывают за 2000–2025 годы: кто его экспортирует и импортирует, цены за тонну, экспорт Узбекистана и пробелы в статистике.',
                description:
                    'Данные UN Comtrade об экстракте солодки (ГС 1302.12) за 2000–2025 годы: экспортёры, импортёры, цены за тонну, экспорт Узбекистана и пробелы в статистике.',
                translatedFrom: 'en',
            },
        },
    },
    {
        slug: 'licorice-botany-distribution-ecology',
        published: '2026-10-14',
        languages: {
            en: {
                title:
                    'Licorice (Glycyrrhiza): Botany, Distribution and Ecology, with a Regional Account of Uzbekistan and the Lower Amu Darya',
                // Used in the <title> tag, where the full title is far too long.
                shortTitle: 'Licorice: Botany, Distribution and Ecology',
                // Inline Markdown is allowed: *italic*, **bold**.
                summary:
                    'A review of the three licorice species, *G. glabra*, *G. uralensis* and *G. inflata*: how they are told apart, where they grow, the conditions they need and the state of wild stands, with a closer look at Khorezm and the lower Amu Darya in Uzbekistan.',
                // Plain text for the meta description (no Markdown).
                description:
                    'A cited review of the three licorice species: taxonomy, range, ecology and wild resources, with a regional account of Khorezm and the lower Amu Darya in Uzbekistan.',
            },
            ru: {
                title:
                    'Солодка (Glycyrrhiza): ботаника, распространение и экология, с региональным обзором по Узбекистану и низовьям Амударьи',
                shortTitle: 'Солодка: ботаника, распространение и экология',
                summary:
                    'Обзор трёх видов солодки — *G. glabra*, *G. uralensis* и *G. inflata*: как их различают, где они растут, какие условия им нужны и в каком состоянии природные заросли, с подробным разделом о Хорезме и низовьях Амударьи в Узбекистане.',
                description:
                    'Обзор трёх видов солодки с источниками: систематика, ареал, экология и дикие ресурсы, с региональным разделом о Хорезме и низовьях Амударьи.',
                // A translation names the language of its original; the page
                // then says so at the top and links to it.
                translatedFrom: 'en',
            },
        },
    },
];

export const findArticle = (slug) => ARTICLES.find((a) => a.slug === slug);

/** Language codes an article has been written in. */
export const articleLanguages = (article) => Object.keys(article.languages);

/**
 * Where the language switcher sends a reader of `routePath` who picks
 * language `code`: the same page, except for an article with no version in
 * that language, whose readers go to the article list instead of a 404.
 */
export function routeInLanguage(routePath, code) {
    const slug = routePath.match(/^\/articles\/([^/]+)$/)?.[1];
    if (!slug) return routePath;
    return findArticle(slug)?.languages[code] ? routePath : '/articles';
}
