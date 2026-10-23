/**
 * Licorice root products: the botanical name is Glycyrrhiza and the part used
 * is the root. This leaves out the extract (a partner's product, see the
 * owner's facts) and the dried fruit, which get neither the free-sample block
 * nor the trade-terms card. The English spec block is used because its values
 * are the same words in every product.
 */
export const isLicoriceRoot = (product) => {
    const en = product?.specs?.en || {};
    return (
        /glycyrrhiza/i.test(String(en.botanical_name || '')) &&
        String(en.part_used || '').trim().toLowerCase() === 'root'
    );
};
