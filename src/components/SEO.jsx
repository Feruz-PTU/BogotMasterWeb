import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../context/LanguageContext';
import {
    LIVE_LANGUAGES,
    DEFAULT_LANGUAGE,
    localizedPath,
    getLanguage,
} from '../i18n/languages';
import { buildGraph, safeJsonLd, SITE_URL } from '../seo/schema';

/**
 * Head tags for one page.
 *
 * `routePath` is the language-independent path ('/', '/products',
 * '/products/granules'). Every language URL for the page is derived from it,
 * which is what makes the canonical and the hreflang set agree by
 * construction rather than by hand.
 *
 * `languages` lists the language codes the page exists in. It defaults to
 * every live language; an article written only in English passes ['en'], so
 * no alternate points at a page that was never built.
 */
const SEO = ({
    routePath = '/',
    kind = 'page',
    title,
    description,
    image,
    imageWidth,
    imageHeight,
    noindex = false,
    product,
    products,
    article,
    contentPage,
    breadcrumb,
    languages,
    about,
}) => {
    const { t, language } = useLanguage();
    const langMeta = getLanguage(language);
    const versions = languages
        ? LIVE_LANGUAGES.filter((l) => languages.includes(l.code))
        : LIVE_LANGUAGES;
    const xDefault = versions.some((l) => l.code === DEFAULT_LANGUAGE)
        ? DEFAULT_LANGUAGE
        : versions[0].code;

    const pageTitle = title || t('meta_title');
    const pageDescription = description || t('meta_description');

    // Self-canonical for this language. Always absolute, always lowercase,
    // never with a trailing slash (except the root) and never with a query
    // string, so /Products, /products/ and /products?utm= all point here.
    const canonicalPath = localizedPath(language, routePath);
    const canonical = `${SITE_URL}${canonicalPath === '/' ? '/' : canonicalPath}`;

    const ogImage = image
        ? image.startsWith('http')
            ? image
            : `${SITE_URL}${image}`
        : `${SITE_URL}/images/og-default.jpg`;
    const ogW = image ? imageWidth : 1200;
    const ogH = image ? imageHeight : 630;

    const graph = buildGraph({
        kind,
        canonical,
        lang: langMeta.htmlLang,
        title: pageTitle,
        description: pageDescription,
        t,
        product,
        products,
        article,
        contentPage,
        breadcrumb,
        about,
    });

    return (
        <Helmet>
            <html lang={langMeta.htmlLang} />
            <title>{pageTitle}</title>
            <meta name="description" content={pageDescription} />
            <link rel="canonical" href={canonical} />
            {noindex && <meta name="robots" content="noindex, follow" />}

            {/* One alternate per language the page exists in, plus x-default
                pointing at the default language. Generated from languages.js,
                so adding a language adds its hreflang automatically. */}
            {versions.map((l) => (
                <link
                    key={l.code}
                    rel="alternate"
                    hrefLang={l.htmlLang}
                    href={`${SITE_URL}${localizedPath(l.code, routePath)}`}
                />
            ))}
            <link
                rel="alternate"
                hrefLang="x-default"
                href={`${SITE_URL}${localizedPath(xDefault, routePath)}`}
            />

            {/* Open Graph */}
            <meta
                property="og:type"
                content={kind === 'product' ? 'product' : kind === 'article' ? 'article' : 'website'}
            />
            <meta property="og:site_name" content="Bogot Master" />
            <meta property="og:locale" content={langMeta.ogLocale} />
            {versions.filter((l) => l.code !== language).map((l) => (
                <meta key={l.code} property="og:locale:alternate" content={l.ogLocale} />
            ))}
            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={pageDescription} />
            <meta property="og:url" content={canonical} />
            <meta property="og:image" content={ogImage} />
            {ogW && <meta property="og:image:width" content={String(ogW)} />}
            {ogH && <meta property="og:image:height" content={String(ogH)} />}
            <meta property="og:image:alt" content={pageTitle} />

            {/* Twitter / X */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={pageDescription} />
            <meta name="twitter:image" content={ogImage} />

            {/* One linked graph instead of several disconnected blocks. */}
            <script type="application/ld+json">{safeJsonLd(graph)}</script>
        </Helmet>
    );
};

export default SEO;
