/**
 * The application pages a product page links to, as one line under its
 * description ("For pharmaceutical use →"). One entry per application page;
 * a product may be listed under several. Later application pages (extraction,
 * tobacco, cosmetics) are added here when they are written.
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
];

export const applicationLinks = (product) =>
    APPLICATION_LINKS.filter((a) => a.slugs.includes(product?.slug));
