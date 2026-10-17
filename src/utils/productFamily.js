/**
 * Product families for the "Related products" block.
 *
 * Products in one family show each other on their pages. Every member stores
 * the whole family as `family`: the same ordered list of slugs, itself
 * included, so the family reads the same from each member. A product page
 * shows the other members in that order.
 *
 * Stored lists are read as links rather than trusted as they are. Products
 * saved before families existed have a one-way `related` list, and a list can
 * still name a product that was deleted since. Joining linked products into
 * groups gives clean, separate families from both.
 *
 * Plain JavaScript with no imports: scripts/fetch-content.mjs uses it too.
 */

const linksOf = (p) => {
    if (Array.isArray(p.family) && p.family.length > 0) {
        return p.family.includes(p.slug) ? p.family : [p.slug, ...p.family];
    }
    if (Array.isArray(p.related) && p.related.length > 0) return [p.slug, ...p.related];
    return [];
};

const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Map of slug → its family (ordered slugs, itself included), for every
 * product in a family of two or more. Pass products in catalogue order and
 * include hidden ones, so a hidden member does not split its family in two.
 */
export function resolveFamilies(products) {
    const known = new Set(products.map((p) => p.slug).filter(Boolean));
    const parent = new Map([...known].map((s) => [s, s]));
    const root = (s) => {
        while (parent.get(s) !== s) s = parent.get(s);
        return s;
    };

    const lists = products.map((p) => linksOf(p).filter((s) => known.has(s)));
    for (const list of lists) {
        for (const s of list.slice(1)) parent.set(root(s), root(list[0]));
    }

    // Each family takes its order from its members' lists, read in catalogue
    // order. When every member stores the same list, that list is the order.
    const byRoot = new Map();
    for (const list of lists) {
        for (const s of list) {
            const r = root(s);
            if (!byRoot.has(r)) byRoot.set(r, []);
            const family = byRoot.get(r);
            if (!family.includes(s)) family.push(s);
        }
    }

    const families = new Map();
    for (const family of byRoot.values()) {
        if (family.length > 1) for (const s of family) families.set(s, family);
    }
    return families;
}

/**
 * What saving product `slug` with `nextFamily` (ordered, `slug` included;
 * [] for none) does to the other products. A product is in one family at a
 * time, so a product that joins leaves its old family, which carries on
 * without it, and a product dropped from this family is left on its own.
 *
 * Returns a Map of slug → new family ([] for none) for each other product
 * whose stored family has to change.
 */
export function familyChanges(products, slug, nextFamily) {
    const before = resolveFamilies(products);
    const joining = new Set(nextFamily);
    const after = new Map();

    for (const s of before.get(slug) || []) {
        if (!joining.has(s)) after.set(s, []);
    }
    for (const s of nextFamily) {
        after.set(s, nextFamily);
        const old = before.get(s) || [];
        if (old.includes(slug)) continue;
        const rest = old.filter((m) => !joining.has(m));
        for (const m of rest) after.set(m, rest.length > 1 ? rest : []);
    }
    after.delete(slug);

    // Skip products that already store exactly this, with no older one-way list.
    for (const [s, family] of after) {
        const p = products.find((x) => x.slug === s);
        const stored = Array.isArray(p?.family) ? p.family : [];
        const legacy = Array.isArray(p?.related) && p.related.length > 0;
        if (!legacy && sameList(stored, family)) after.delete(s);
    }
    return after;
}
