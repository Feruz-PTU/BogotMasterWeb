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

const EVERY_DAY = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    .map((day) => `https://schema.org/${day}`);

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
        // As on the tax registration certificate (see config.js).
        legalName: CONTACT_INFO.legal_name,
        taxID: CONTACT_INFO.inn,
        foundingDate: String(FOUNDING_YEAR),
        // "Over 20 specialists" (the owner; about_p3): a floor, not a count.
        numberOfEmployees: { '@type': 'QuantitativeValue', minValue: 20 },
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
        // The sales rep answers both numbers and the sales email, in English,
        // Russian and Uzbek, 07:00 to midnight every day, Uzbekistan time.
        contactPoint: CONTACT_INFO.phone.map((phone) => ({
            '@type': 'ContactPoint',
            contactType: 'sales',
            telephone: toE164(phone),
            email: CONTACT_INFO.sales_email,
            areaServed: 'Worldwide',
            availableLanguage: CONTACT_INFO.sales_contact.languages,
            hoursAvailable: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: EVERY_DAY,
                opens: CONTACT_INFO.sales_contact.hours.opens,
                closes: CONTACT_INFO.sales_contact.hours.closes,
            },
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

/**
 * `about`: the @ids the page is about. By default the company; a page about
 * products or a subject passes their @ids instead (see buildGraph).
 */
function webPageNode({ canonical, title, description, lang, type = 'WebPage', dateModified, about }) {
    const node = {
        '@type': type,
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        isPartOf: { '@id': ID.website },
        about: about?.length
            ? about.length === 1
                ? { '@id': about[0] }
                : about.map((id) => ({ '@id': id }))
            : { '@id': ID.org },
        inLanguage: lang,
    };
    if (dateModified) node.dateModified = dateModified;
    return node;
}

/**
 * The extra node of a content page (content/pages/index.js), by its
 * schemaType: a hub lists its pages, a guide chapter is a TechArticle, the
 * glossary is a DefinedTermSet (folder 11 adds the terms). A plain WebPage
 * needs nothing more. The FAQ page's node is the WebPage itself, typed
 * FAQPage; its questions are added by faqPageGraph. No HowTo or Offer.
 */
function contentPageNode({ contentPage, canonical, lang, description }) {
    const { schemaType, name, updated, children = [], place } = contentPage;
    if (place?.length) return placeNode(place, `${canonical}#place`);
    if (schemaType === 'CollectionPage') {
        if (!children.length) return null;
        return {
            '@type': 'ItemList',
            '@id': `${canonical}#itemlist`,
            numberOfItems: children.length,
            itemListElement: children.map((c, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: c.name,
                url: abs(c.path),
            })),
        };
    }
    if (schemaType === 'TechArticle') {
        return {
            '@type': 'TechArticle',
            '@id': `${canonical}#article`,
            headline: name,
            description,
            dateModified: updated,
            inLanguage: lang,
            mainEntityOfPage: { '@id': `${canonical}#webpage` },
            author: { '@id': ID.org },
            publisher: { '@id': ID.org },
        };
    }
    if (schemaType === 'DefinedTermSet') {
        return {
            '@type': 'DefinedTermSet',
            '@id': `${canonical}#terms`,
            name,
            description,
            inLanguage: lang,
            url: canonical,
        };
    }
    return null;
}

/**
 * The place a page is about (the registry's `place`, smallest first): a Place,
 * each inside the next, the last a Country. Names only: no address or
 * coordinates, which this project does not have.
 */
function placeNode(chain, id) {
    const [first, ...rest] = chain;
    const { name, alternateName } = typeof first === 'string' ? { name: first } : first;
    const node = { '@type': rest.length ? 'Place' : 'Country', name };
    if (id) node['@id'] = id;
    if (alternateName?.length) node.alternateName = alternateName;
    if (rest.length) node.containedInPlace = placeNode(rest);
    return node;
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
function productNode({ product, canonical, t }) {
    const specs = product.activeSpecs || {};
    // Each property is named as in the page's specification table
    // ("Glycyrrhizic acid", "Глицирризиновая кислота"); a spec with no label
    // string keeps its key, made readable.
    const label = (key) => {
        const text = t ? t(`spec_${key}`) : '';
        return text && text !== `spec_${key}`
            ? text
            : key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    };
    const additionalProperty = Object.entries(specs)
        .filter(
            ([key, value]) =>
                key !== 'documents' &&
                value != null &&
                String(value).trim() !== ''
        )
        .map(([key, value]) => ({
            '@type': 'PropertyValue',
            name: label(key),
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
        // No inLanguage: Product does not have it (the validator warns); the
        // page's WebPage node carries the language.
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
 * articles | article | content (a registry page, with `contentPage`)
 * `about`: optional @ids the page is about, in place of the company (an
 * applications page lists its products' Product nodes; see ContentPage).
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
    contentPage,
    breadcrumb,
    about,
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
                  : kind === 'content' && contentPage?.schemaType === 'CollectionPage'
                    ? 'CollectionPage'
                    : kind === 'content' && contentPage?.schemaType === 'FAQPage'
                      ? 'FAQPage'
                      : kind === 'content' && contentPage?.schemaType === 'AboutPage'
                        ? 'AboutPage'
                        : 'WebPage';

    graph.push(
        webPageNode({
            canonical,
            title,
            description,
            lang,
            type: pageType,
            dateModified: kind === 'content' ? contentPage?.updated : undefined,
            about,
        })
    );

    const crumbs = breadcrumbNode(canonical, breadcrumb);
    if (crumbs) graph.push(crumbs);

    if (kind === 'product' && product) {
        graph.push(productNode({ product, canonical, t }));
    }
    if (kind === 'products' && products?.length) {
        graph.push(itemListNode({ canonical, products, lang }));
    }
    if (kind === 'article' && article) {
        graph.push(articleNode({ article, canonical, lang, description }));
    }
    if (kind === 'content' && contentPage) {
        const node = contentPageNode({ contentPage, canonical, lang, description });
        if (node) graph.push(node);
    }

    return { '@context': 'https://schema.org', '@graph': graph };
}

/**
 * The terms of a glossary page as DefinedTerm nodes, attached by @id to the
 * DefinedTermSet node of the page's main graph (see contentPageNode). It is a
 * second JSON-LD block because only the prerender has the page text at hand;
 * ContentPage writes it into the page body.
 */
export function definedTermsGraph({ canonical, terms }) {
    const setId = `${canonical}#terms`;
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'DefinedTermSet',
                '@id': setId,
                hasDefinedTerm: terms.map((term) => ({
                    '@type': 'DefinedTerm',
                    '@id': `${canonical}#${term.id}`,
                    name: term.name,
                    description: term.description,
                    url: `${canonical}#${term.id}`,
                    inDefinedTermSet: { '@id': setId },
                })),
            },
        ],
    };
}

/**
 * The FAQ page's questions, attached by @id to its FAQPage node (the page's
 * WebPage node, typed FAQPage by buildGraph). A second block for the same
 * reason as definedTermsGraph: the answers are not in the main bundle, so
 * FaqList writes it next to the list. Built from the visible text, so it
 * cannot drift from it. `items`: { slug, q, a } with a as Markdown.
 */
export function faqPageGraph({ canonical, items }) {
    const plain = (md) =>
        md
            .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
            .replace(/\*\*|\*|`/g, '')
            .replace(/^\s*(?:-|\d+\.)\s+/gm, '')
            .replace(/\s+/g, ' ')
            .trim();
    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'FAQPage',
                '@id': `${canonical}#webpage`,
                mainEntity: items.map((item) => ({
                    '@type': 'Question',
                    '@id': `${canonical}#${item.slug}`,
                    name: plain(item.q),
                    url: `${canonical}#${item.slug}`,
                    acceptedAnswer: { '@type': 'Answer', text: plain(item.a) },
                })),
            },
        ],
    };
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
