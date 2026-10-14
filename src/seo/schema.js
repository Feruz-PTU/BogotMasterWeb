/**
 * schema.org JSON-LD, emitted as ONE @graph per page with stable @id values.
 *
 * Why one graph: the site used to emit two unconnected Organization nodes with
 * two different names, plus an unlinked Brand. Search engines read that as
 * three separate companies. Everything below is linked by @id instead.
 *
 * Rules kept deliberately: no price, no offers, no sku, no rating, no review,
 * no certification, no street address and no country list. Those facts do not
 * exist in this project, and inventing them would be lying to Google.
 */

import { CONTACT_INFO, COMPANY_INFO } from '../config';
import { LIVE_LANGUAGES, localizedPath } from '../i18n/languages';

export const SITE_URL = 'https://bogotmaster.org';

/** Stated in the About copy: "established in 2014" / "основанная в 2014 году". */
export const FOUNDING_YEAR = 2014;

/** Calculated, never hardcoded — the old "10+" was frozen and is now wrong. */
export const yearsInBusiness = (now = new Date()) =>
    now.getFullYear() - FOUNDING_YEAR;

const ID = {
    org: `${SITE_URL}/#organization`,
    website: `${SITE_URL}/#website`,
    brand: `${SITE_URL}/#brand`,
};

const abs = (path) =>
    !path ? undefined : /^https?:\/\//i.test(path) ? path : `${SITE_URL}${path}`;

const toE164 = (phone) => '+' + String(phone).replace(/[^\d]/g, '');

/** Organization — the root entity every other node points at. */
function organizationNode(t) {
    return {
        '@type': 'Organization',
        '@id': ID.org,
        name: COMPANY_INFO.name,
        url: `${SITE_URL}/`,
        logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/Logo/new-logo.png`,
            width: 904,
            height: 904,
        },
        description: t('schema_description'),
        foundingDate: String(FOUNDING_YEAR),
        email: CONTACT_INFO.email,
        address: {
            '@type': 'PostalAddress',
            // No streetAddress: this project has no street address, and the
            // district is not one.
            addressLocality: 'Bogot district',
            addressRegion: 'Khorezm region',
            postalCode: '220204',
            addressCountry: 'UZ',
        },
        // The only market claim the project actually makes is "worldwide".
        areaServed: 'Worldwide',
        knowsLanguage: LIVE_LANGUAGES.map((l) => l.htmlLang),
        contactPoint: CONTACT_INFO.phone.map((phone) => ({
            '@type': 'ContactPoint',
            contactType: 'sales',
            telephone: toE164(phone),
            email: CONTACT_INFO.sales_email,
            areaServed: 'Worldwide',
            availableLanguage: LIVE_LANGUAGES.map((l) => l.name),
        })),
        // `sameAs` is omitted entirely rather than shipped as an empty array.
        // Add it once real company profile pages exist (LinkedIn, etc.).
    };
}

function websiteNode() {
    return {
        '@type': 'WebSite',
        '@id': ID.website,
        name: COMPANY_INFO.name,
        url: `${SITE_URL}/`,
        publisher: { '@id': ID.org },
        inLanguage: LIVE_LANGUAGES.map((l) => l.htmlLang),
        // No SearchAction: this site has no search feature, and declaring one
        // would point Google at a URL that does not exist.
    };
}

function webPageNode({ canonical, title, description, lang, type = 'WebPage' }) {
    return {
        '@type': type,
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        isPartOf: { '@id': ID.website },
        about: { '@id': ID.org },
        inLanguage: lang,
    };
}

function breadcrumbNode(canonical, trail) {
    if (!trail?.length) return null;
    return {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: trail.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: abs(item.path),
        })),
    };
}

/**
 * Product. Intentionally has no `offers`: there is no price anywhere in this
 * project and the whole site is request-a-quote. Google will note "missing
 * offers" in Search Console — that is expected and correct, not a bug. A fake
 * price would be worse than no rich result.
 */
function productNode({ product, canonical, lang }) {
    const specs = product.activeSpecs || {};
    const additionalProperty = Object.entries(specs)
        .filter(
            ([key, value]) =>
                key !== 'documents' &&
                value != null &&
                String(value).trim() !== ''
        )
        .map(([key, value]) => ({
            '@type': 'PropertyValue',
            name: key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase()),
            value: String(value).trim(),
        }));

    const node = {
        '@type': 'Product',
        '@id': `${canonical}#product`,
        url: canonical,
        name: product.title,
        description: product.description || undefined,
        image: abs(product.image),
        category: 'Licorice root',
        brand: { '@type': 'Brand', '@id': ID.brand, name: COMPANY_INFO.name },
        manufacturer: { '@id': ID.org },
        inLanguage: lang,
    };
    if (additionalProperty.length) node.additionalProperty = additionalProperty;
    if (specs.botanical_name) node.alternateName = specs.botanical_name;
    if (specs.origin) node.countryOfOrigin = specs.origin;
    return node;
}

function itemListNode({ canonical, products, lang }) {
    return {
        '@type': 'ItemList',
        '@id': `${canonical}#itemlist`,
        numberOfItems: products.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: products.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: p.title,
            url: abs(localizedPath(lang, `/products/${p.slug}`)),
        })),
    };
}

/**
 * An article page. The company is both author and publisher: the articles
 * are written for this site and carry no personal byline.
 */
function articleNode({ article, canonical, lang, description }) {
    return {
        '@type': 'Article',
        '@id': `${canonical}#article`,
        headline: article.headline,
        alternativeHeadline: article.alternativeHeadline,
        description,
        datePublished: article.datePublished,
        inLanguage: lang,
        mainEntityOfPage: { '@id': `${canonical}#webpage` },
        author: { '@id': ID.org },
        publisher: { '@id': ID.org },
    };
}

/**
 * Assemble the page graph.
 * `kind` is one of: home | products | product | about | contact | privacy |
 * articles | article
 */
export function buildGraph({
    kind,
    canonical,
    lang,
    title,
    description,
    t,
    product,
    products,
    article,
    breadcrumb,
}) {
    const graph = [organizationNode(t), websiteNode()];

    const pageType =
        kind === 'products' || kind === 'articles'
            ? 'CollectionPage'
            : kind === 'product'
              ? 'ItemPage'
              : kind === 'about'
                ? 'AboutPage'
                : kind === 'contact'
                  ? 'ContactPage'
                  : 'WebPage';

    graph.push(
        webPageNode({ canonical, title, description, lang, type: pageType })
    );

    const crumbs = breadcrumbNode(canonical, breadcrumb);
    if (crumbs) graph.push(crumbs);

    if (kind === 'product' && product) {
        graph.push(productNode({ product, canonical, lang }));
    }
    if (kind === 'products' && products?.length) {
        graph.push(itemListNode({ canonical, products, lang }));
    }
    if (kind === 'article' && article) {
        graph.push(articleNode({ article, canonical, lang, description }));
    }

    return { '@context': 'https://schema.org', '@graph': graph };
}

/**
 * JSON-LD is injected as raw text, so `<` must be escaped or a product title
 * containing "</script>" would break out of the tag. Product text is editable
 * in the admin panel, so this is a real path once the page is prerendered.
 */
export const safeJsonLd = (obj) =>
    JSON.stringify(obj)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
