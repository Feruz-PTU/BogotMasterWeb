/**
 * The application pages a product page links to, as one line under its
 * description ("For pharmaceutical use →"). One entry per application page;
 * a product may be listed under several. The food and tobacco pages are added
 * here when they are written.
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
];

export const applicationLinks = (product) =>
    APPLICATION_LINKS.filter((a) => a.slugs.includes(product?.slug));
