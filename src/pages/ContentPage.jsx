import Layout from '../components/Layout';
import SEO from '../components/SEO';
import MarkdownBody from '../components/MarkdownBody';
import FaqList from '../components/FaqList';
import LocalLink, { useLocalPath } from '../components/LocalLink';
import NotFound from './NotFound';
import { useLanguage } from '../context/LanguageContext';
import { useContent } from '../context/ContentContext';
import { useRequest } from '../context/RequestContext';
import { pageAncestors, childPages, pageName, findPage, pageUnder, FIXED_PARENTS } from '../content/pages';
import { PAGE_PHOTOS } from '../content/pages/photos';
import PagePhotos from '../components/PagePhotos';
import * as pageBodies from '../content/pages/bodies';
import { localizedPath } from '../i18n/languages';
import { SITE_URL, definedTermsGraph, safeJsonLd } from '../seo/schema';
import { termsFromMarkdown } from '../utils/glossaryTerms';
import { formatDate } from '../utils/dates';
import { useFaq, latestFaqDate } from '../utils/faqData';
import { applicationSlugsFor } from '../utils/productApplications';
import GradeTable from '../components/GradeTable';
import { GRADE_FORMS } from '../utils/productGrades';

/**
 * What a page text's {{name}} lines show. {{grade-table}}: the slice and tablet
 * grades by root diameter, from the product data (folder 28); the guide
 * chapter's own heading names it, and the chapter is the guide link's target.
 * {{photos-<set>}}: a set of gallery photos from content/pages/photos.js.
 */
const WIDGETS = {
    'grade-table': <GradeTable forms={GRADE_FORMS} title={false} guideLink={false} />,
    ...Object.fromEntries(
        Object.entries(PAGE_PHOTOS).map(([name, photos]) => [`photos-${name}`, <PagePhotos key={name} photos={photos} />]),
    ),
};
import './ContentPage.css';

/**
 * What the page is about, as structured-data @ids (folder 22): the Product
 * nodes of the published products an applications page covers, or the
 * glossary term named by the registry's `aboutTerm`. Undefined leaves the
 * default, the company.
 */
function aboutIds(page, language, products) {
    // A page about a place (the origin page): the company and the place.
    if (page.place?.[language]) {
        return [`${SITE_URL}/#organization`, `${SITE_URL}${localizedPath(language, page.path)}#place`];
    }
    const published = new Set(products.map((p) => p.slug));
    const ids = applicationSlugsFor(page.path)
        .filter((slug) => published.has(slug))
        .map((slug) => `${SITE_URL}${localizedPath(language, `/products/${slug}`)}#product`);
    if (ids.length) return ids;
    const glossary = findPage('buyers-guide-glossary');
    if (page.aboutTerm && glossary?.languages.includes(language)) {
        return [`${SITE_URL}${localizedPath(language, glossary.path)}#${page.aboutTerm}`];
    }
    return undefined;
}

/**
 * A glossary's DefinedTerm list, as JSON-LD text. Only the prerender has the
 * page text at hand, so in the browser this is empty, and the element keeps
 * the server's JSON: React leaves the content of an element with
 * dangerouslySetInnerHTML alone while hydrating (as MarkdownBody does).
 */
function glossaryJson(page, language) {
    const source = pageBodies.bodyNow(page.id, language);
    if (!source) return '';
    const canonical = `${SITE_URL}${localizedPath(language, page.path)}`;
    return safeJsonLd(definedTermsGraph({ canonical, terms: termsFromMarkdown(source) }));
}

/**
 * One page from the registry in content/pages/index.js: breadcrumb, H1, the
 * Markdown text, the list of its own pages (for a hub), the answers (for the
 * FAQ), and a box at the end that opens the request form.
 */
const ContentPage = ({ page }) => {
    const { t, language } = useLanguage();
    const localPath = useLocalPath();
    const { openRequest } = useRequest();
    const { products } = useContent();
    const isFaq = page.schemaType === 'FAQPage';
    const faqItems = useFaq(isFaq && page.languages.includes(language) ? language : null);

    // Not written in this language: a 404, never another language's text here.
    if (!page.languages.includes(language)) return <NotFound />;

    // Ancestors that do not exist in this language are left out of the trail.
    // A page `under` a fixed page (the origin page, under /about) shows it first.
    const under = pageUnder(page);
    const trail = [
        ...(under ? [{ to: under, name: t(FIXED_PARENTS[under]) }] : []),
        ...[...pageAncestors(page), page]
            .filter((p) => p.languages.includes(language))
            .map((p) => ({ to: p.path, name: pageName(p, language) })),
    ];
    const breadcrumb = [
        { name: t('home'), path: localPath('/') },
        ...trail.map((p) => ({ name: p.name, path: localPath(p.to) })),
    ];
    const children = childPages(page).filter((c) => c.languages.includes(language));
    const h1 = page.h1[language];
    const isGlossary = page.schemaType === 'DefinedTermSet';
    // The FAQ is as new as its newest answer.
    const updated = isFaq ? latestFaqDate(page.updated, faqItems) : page.updated;

    return (
        <Layout>
            <SEO
                kind="content"
                routePath={page.path}
                title={page.title[language]}
                description={page.meta[language]}
                languages={page.languages}
                breadcrumb={breadcrumb}
                about={aboutIds(page, language, products)}
                contentPage={{
                    schemaType: page.schemaType,
                    name: h1,
                    updated,
                    children: children.map((c) => ({ name: pageName(c, language), path: localPath(c.path) })),
                    place: page.place?.[language],
                }}
            />
            <div className="content-page">
                <article className="content-inner">
                    <nav className="content-breadcrumb" aria-label={t('breadcrumb')}>
                        <ol>
                            {breadcrumb.map((item, i) => (
                                <li key={item.path}>
                                    {i < breadcrumb.length - 1 ? (
                                        <LocalLink to={i === 0 ? '/' : trail[i - 1].to}>{item.name}</LocalLink>
                                    ) : (
                                        <span aria-current="page">{item.name}</span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>

                    <header className="content-header">
                        <h1>{h1}</h1>
                        <p className="content-meta">
                            {t('content_updated')}{' '}
                            <time dateTime={updated}>{formatDate(updated, language)}</time>
                        </p>
                    </header>

                    <MarkdownBody
                        key={`${page.id}.${language}`}
                        bodies={pageBodies}
                        kind="page"
                        name={page.id}
                        language={language}
                        className="content-body"
                        loadingText={t('article_loading')}
                        headingLinks={isGlossary}
                        anchorLabel={t('glossary_term_link')}
                        widgets={WIDGETS}
                    />

                    {isFaq && <FaqList key={language} items={faqItems} />}

                    {isGlossary && (
                        <script
                            type="application/ld+json"
                            suppressHydrationWarning
                            dangerouslySetInnerHTML={{ __html: glossaryJson(page, language) }}
                        />
                    )}

                    {children.length > 0 && (
                        <nav className="content-children" aria-labelledby="content-children-title">
                            <h2 id="content-children-title">{t('content_children_title')}</h2>
                            <ul>
                                {children.map((c) => (
                                    <li key={c.id}>
                                        <LocalLink to={c.path}>{pageName(c, language)}</LocalLink>
                                        <p>{c.meta[language]}</p>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}

                    {page.requestType === 'quote' ? (
                        <aside className="content-cta">
                            <h2>{t('content_cta_quote_title')}</h2>
                            <p>{t('content_cta_quote_text')}</p>
                            <button type="button" className="content-cta-btn" onClick={() => openRequest({ type: 'quote' })}>
                                {t('content_cta_quote_btn')}
                            </button>
                        </aside>
                    ) : (
                        <aside className="content-cta">
                            <h2>{t(isFaq ? 'faq_cta_title' : 'content_cta_title')}</h2>
                            <p>{t('content_cta_text')}</p>
                            {/* A general question; the lead's page_url says which page it came from. */}
                            <button type="button" className="content-cta-btn" onClick={() => openRequest({ type: 'other' })}>
                                {t('content_cta_btn')}
                            </button>
                        </aside>
                    )}
                </article>
            </div>
        </Layout>
    );
};

export default ContentPage;
