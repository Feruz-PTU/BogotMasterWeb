/**
 * The application pages a product page links to, as one line under its
 * description ("For pharmaceutical use →"). One entry per application page;
 * a product may be listed under several. Later application pages (tobacco)
 * are added here when they are written, and the table on the
 * applications hub (content/pages/applications.*.md) follows these lists.
 */
export const APPLICATION_LINKS = [
    {
        path: '/applications/pharmaceutical',
        labelKey: 'app_pharma_link',
        // The forms pharmaceutical buyers take for teas and extraction: the
        // same list as "Forms we supply" on that page.
        slugs: [
            'selected-sticks',
            'standard-sticks',
            'peeled-sticks',
            'fingers',
            'fingers-peeled-mix',
            'tablet-a',
            'tablet-1.2',
            'tablet-mix',
            'granules',
            'peeled-granules',
            'crushed',
            'powder',
        ],
    },
    {
        path: '/applications/food-and-confectionery',
        labelKey: 'app_food_link',
        // Slices for cooking, root fibre for tea, granules, powder and the
        // partner's extract: the same list as "Forms for food use".
        slugs: [
            'slice-a',
            'slice-b',
            'slice-c',
            'slice-c1',
            'slice-d',
            'slice-l',
            'slice-s',
            'slice-mix',
            'chips',
            'granules',
            'peeled-granules',
            'powder',
            'extract',
        ],
    },
    {
        path: '/applications/extraction',
        labelKey: 'app_extraction_link',
        // The feedstock grades and the cut root extractors take: the grades
        // table and "Cut root for extraction" on that page. The extract is
        // linked there too, but it is the product of extraction, not feedstock.
        slugs: [
            'industrial-grade',
            'extraction-grade',
            'tablet-a',
            'tablet-1.2',
            'tablet-mix',
            'crushed',
        ],
    },
    {
        path: '/applications/cosmetics',
        labelKey: 'app_cosmetics_link',
        // Root powder and the cut root cosmetic extract makers take: the same
        // list as "Forms we supply" on that page, without the partner's
        // extract (its cosmetic use is not known).
        slugs: ['powder', 'granules', 'crushed', 'tablet-a', 'tablet-1.2', 'tablet-mix'],
    },
];

export const applicationLinks = (product) =>
    APPLICATION_LINKS.filter((a) => a.slugs.includes(product?.slug));

/**
 * The products an application page covers, in list order and each once: its
 * own list, or for the hub (/applications) the lists of all its sector pages.
 * The page's structured data names them as what the page is `about`.
 */
export const applicationSlugsFor = (path) => [
    ...new Set(
        APPLICATION_LINKS.filter((a) => a.path === path || a.path.startsWith(`${path}/`)).flatMap(
            (a) => a.slugs
        )
    ),
];
