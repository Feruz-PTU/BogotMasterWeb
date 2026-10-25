/**
 * The catalogue's groups by product form (folder 23), in the order /products
 * shows them. They follow the order the products already had (slices first);
 * "Other products" holds the dried fruit and stays last.
 *
 * Every product sits in exactly one group: its stored `group` when that is one
 * of these ids, otherwise the one its slug, English title or form points to,
 * otherwise "other". The admin stores the group on every save.
 *
 * Each id is also the heading's anchor on /products (/products#slices), the
 * same in every language. The heading is the string `products_group_<id>`.
 */
export const PRODUCT_GROUPS = ['slices', 'tablets', 'granules', 'sticks', 'industrial', 'custom', 'extract', 'other'];

// Tried in this order: "extraction grade" must reach `industrial` before
// `extract` sees it.
const GUESSES = [
    ['industrial', /industrial|extraction|fragment/],
    ['extract', /extract/],
    ['custom', /custom/],
    ['slices', /slice/],
    ['tablets', /tablet/],
    ['sticks', /stick|finger/],
    ['granules', /granul|crush|chip|fib(?:er|re)|powder/],
];

/** The group a product's own words point to, or null when nothing matches. */
export const guessGroup = (product) => {
    const en = product?.specs?.en || {};
    if (/fruit/i.test(String(en.part_used || ''))) return 'other';
    const words = [product?.slug, product?.title_en, en.form_cut_type].filter(Boolean).join(' ').toLowerCase();
    return GUESSES.find(([, pattern]) => pattern.test(words))?.[0] || null;
};

export const groupOf = (product) =>
    PRODUCT_GROUPS.includes(product?.group) ? product.group : guessGroup(product) || 'other';

/**
 * The groups that have products, each with its products in their existing
 * order: [{ id, products }].
 */
export const groupProducts = (products) =>
    PRODUCT_GROUPS.map((id) => ({ id, products: products.filter((p) => groupOf(p) === id) })).filter(
        (g) => g.products.length
    );
