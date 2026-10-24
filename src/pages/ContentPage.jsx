import Layout from '../components/Layout';
import SEO from '../components/SEO';
import MarkdownBody from '../components/MarkdownBody';
import FaqList from '../components/FaqList';
import LocalLink, { useLocalPath } from '../components/LocalLink';
import NotFound from './NotFound';
import { useLanguage } from '../context/LanguageContext';
import { useRequest } from '../context/RequestContext';
import { pageAncestors, childPages, pageName } from '../content/pages';
import * as pageBodies from '../content/pages/bodies';
import { localizedPath } from '../i18n/languages';
import { SITE_URL, definedTermsGraph, safeJsonLd } from '../seo/schema';
import { termsFromMarkdown } from '../utils/glossaryTerms';
import { formatDate } from '../utils/dates';
import { useFaq, latestFaqDate } from '../utils/faqData';
import './ContentPage.css';

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
    const isFaq = page.schemaType === 'FAQPage';
    const faqItems = useFaq(isFaq && page.languages.includes(language) ? language : null);

    // Not written in this language: a 404, never another language's text here.
    if (!page.languages.includes(language)) return <NotFound />;

    // Ancestors that do not exist in this language are left out of the trail.
    const trail = [...pageAncestors(page), page].filter((p) => p.languages.includes(language));
    const breadcrumb = [
        { name: t('home'), path: localPath('/') },
        ...trail.map((p) => ({ name: pageName(p, language), path: localPath(p.path) })),
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
                contentPage={{
                    schemaType: page.schemaType,
                    name: h1,
                    updated,
                    children: children.map((c) => ({ name: pageName(c, language), path: localPath(c.path) })),
                }}
            />
            <div className="content-page">
                <article className="content-inner">
                    <nav className="content-breadcrumb" aria-label={t('breadcrumb')}>
                        <ol>
                            {breadcrumb.map((item, i) => (
                                <li key={item.path}>
                                    {i < breadcrumb.length - 1 ? (
                                        <LocalLink to={i === 0 ? '/' : trail[i - 1].path}>{item.name}</LocalLink>
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
