import { useState } from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import MarkdownBody from '../components/MarkdownBody';
import LocalLink, { useLocalPath } from '../components/LocalLink';
import PriceModal from '../components/PriceModal';
import NotFound from './NotFound';
import { useLanguage } from '../context/LanguageContext';
import { pageAncestors, childPages, pageName } from '../content/pages';
import * as pageBodies from '../content/pages/bodies';
import { formatDate } from '../utils/dates';
import './ContentPage.css';

/**
 * One page from the registry in content/pages/index.js: breadcrumb, H1, the
 * Markdown text, the list of its own pages (for a hub), and a box at the end
 * that opens the request form.
 */
const ContentPage = ({ page }) => {
    const { t, language } = useLanguage();
    const localPath = useLocalPath();
    const [askOpen, setAskOpen] = useState(false);

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
                    updated: page.updated,
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
                            <time dateTime={page.updated}>{formatDate(page.updated, language)}</time>
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
                    />

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

                    <aside className="content-cta">
                        <h2>{t('content_cta_title')}</h2>
                        <p>{t('content_cta_text')}</p>
                        <button type="button" className="content-cta-btn" onClick={() => setAskOpen(true)}>
                            {t('content_cta_btn')}
                        </button>
                    </aside>
                </article>
            </div>

            {/* A general question, so no quantity; the page's H1 tells the
                owner where it came from. */}
            <PriceModal
                isOpen={askOpen}
                onClose={() => setAskOpen(false)}
                productTitle={h1}
                title={t('modal_info_title')}
                requireQuantity={false}
            />
        </Layout>
    );
};

export default ContentPage;
