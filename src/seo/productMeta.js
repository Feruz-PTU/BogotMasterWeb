/**
 * Unique page titles and meta descriptions for product pages.
 *
 * Every value here is read from the product's own data in Supabase. Nothing
 * is invented: if a spec is missing it is simply left out of the sentence.
 *
 * Why this exists: product descriptions in the database are 32-81 characters
 * and several are near-identical ("cut into sticks of standard calibre",
 * "cut into sticks selected by size"). Used directly as meta descriptions,
 * search engines read a dozen near-duplicate thin pages. Folding the real
 * specifications in makes each one distinct and genuinely informative.
 */

const MAX_DESCRIPTION = 155;

const isLicorice = (specs) =>
    /glycyrrhiza/i.test(String(specs?.botanical_name || ''));

/**
 * "Slice A — Licorice Root Supplier | Bogot Master"
 * Falls back to a neutral suffix for the non-licorice items in the catalogue
 * (dried apricot, dried cherry), which must not be labelled licorice.
 */
export function productTitle(product, t) {
    const specs = product.activeSpecs || {};
    const suffix = isLicorice(specs)
        ? t('seo_suffix_licorice')
        : t('seo_suffix_generic');
    return `${product.title} — ${suffix}`;
}

/**
 * Builds the longest description that fits the ~155 character budget, adding
 * specs in order of how much a buyer cares about them, and stopping cleanly
 * rather than mid-word.
 */
export function productDescription(product, t) {
    const specs = product.activeSpecs || {};

    const base = String(product.description || '').trim();
    const parts = [];

    const add = (labelKey, value) => {
        if (value == null || String(value).trim() === '') return;
        parts.push(`${t(labelKey)}: ${String(value).trim()}`);
    };

    // Ordered by buyer relevance.
    add('spec_cut_size', specs.cut_size);
    add('spec_glycyrrhizin', specs.glycyrrhizin);
    add('spec_moisture', specs.moisture);
    add('spec_packaging', specs.packaging);
    add('spec_moq', specs.moq);
    add('spec_origin', specs.origin);

    let out = base;
    for (const part of parts) {
        const next = out ? `${out} ${part}.` : `${part}.`;
        if (next.length > MAX_DESCRIPTION) break;
        out = next;
    }

    if (!out) out = product.title;

    if (out.length > MAX_DESCRIPTION) {
        out = out.slice(0, MAX_DESCRIPTION - 1).replace(/[\s,;.]+\S*$/, '') + '…';
    }
    return out;
}

/** Breadcrumb trail for a product page, in the active language. */
export function productBreadcrumb(product, t, localPath) {
    return [
        { name: t('home'), path: localPath('/') },
        { name: t('products'), path: localPath('/products') },
        { name: product.title, path: localPath(`/products/${product.slug}`) },
    ];
}
