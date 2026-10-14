import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import Markdown from '../components/Markdown';
import LocalLink, { useLocalPath } from '../components/LocalLink';
import NotFound from './NotFound';
import { useLanguage } from '../context/LanguageContext';
import { findArticle, articleLanguages } from '../content/articles';
import { bodyNow, loadBody } from '../content/articles/bodies';
import { getLanguage, localizedPath } from '../i18n/languages';
import { formatDate } from '../utils/dates';
import './ArticlePage.css';

/** Texts already fetched in this visit, so going back to one is instant. */
const fetched = new Map();

/**
 * The article text.
 *
 * The browser bundle does not contain it (see content/articles/bodies.js).
 * That leaves two cases:
 *
 * - Opening the article's URL: the page arrives prerendered with the whole
 *   text in it. While hydrating, React leaves the children of an element that
 *   has dangerouslySetInnerHTML untouched, so the empty value below keeps the
 *   server's text on screen and nothing is downloaded.
 * - Arriving from another page of the site: there is no server HTML to keep,
 *   so the text is fetched and rendered.
 */
const ArticleBody = ({ slug, language }) => {
    const { t } = useLanguage();
    const key = `${slug}.${language}`;
    const [source, setSource] = useState(
        () => bodyNow(slug, language) ?? fetched.get(key) ?? null
    );
    const [keepServerHtml] = useState(
        () =>
            source === null &&
            typeof document !== 'undefined' &&
            document.querySelector(`[data-article-body="${key}"]`) !== null
    );

    useEffect(() => {
        if (source !== null || keepServerHtml) return undefined;
        let current = true;
        loadBody(slug, language)?.then((text) => {
            fetched.set(key, text);
            if (current) setSource(text);
        });
        return () => {
            current = false;
        };
    }, [key, slug, language, source, keepServerHtml]);

    if (keepServerHtml) {
        return (
            <div
                className="article-body"
                data-article-body={key}
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: '' }}
            />
        );
    }
    if (source === null) {
        return (
            <p className="article-loading" role="status">
                {t('article_loading')}
            </p>
        );
    }
    return (
        <div className="article-body" data-article-body={key}>
            <Markdown source={source} />
        </div>
    );
};

const ArticlePage = () => {
    const { slug } = useParams();
    const { t, language } = useLanguage();
    const localPath = useLocalPath();

    const article = findArticle(slug);
    const version = article?.languages[language];
    // No version in this language: a 404, never another language's text at
    // this URL (the same rule as for unknown language prefixes).
    if (!version) return <NotFound />;

    const routePath = `/articles/${slug}`;
    const original = version.translatedFrom && article.languages[version.translatedFrom];
    const originalLang = original && getLanguage(version.translatedFrom).htmlLang;

    return (
        <Layout>
            <SEO
                kind="article"
                routePath={routePath}
                title={`${version.shortTitle} | Bogot Master`}
                description={version.description}
                languages={articleLanguages(article)}
                article={{
                    headline: version.shortTitle,
                    alternativeHeadline: version.title,
                    datePublished: article.published,
                }}
                breadcrumb={[
                    { name: t('home'), path: localPath('/') },
                    { name: t('articles'), path: localPath('/articles') },
                    { name: version.shortTitle, path: localPath(routePath) },
                ]}
            />
            <div className="article-page">
                <article className="article-inner">
                    <nav className="article-breadcrumb" aria-label={t('breadcrumb')}>
                        <ol>
                            <li><LocalLink to="/">{t('home')}</LocalLink></li>
                            <li><LocalLink to="/articles">{t('articles')}</LocalLink></li>
                            <li><span aria-current="page">{version.shortTitle}</span></li>
                        </ol>
                    </nav>

                    <header className="article-header">
                        <h1>{version.title}</h1>
                        <p className="article-meta">
                            <time dateTime={article.published}>
                                {formatDate(article.published, language)}
                            </time>
                            <span aria-hidden="true"> · </span>
                            Bogot Master
                        </p>
                    </header>

                    {original && (
                        <aside className="article-translation-note">
                            <p>
                                {t(`article_translated_from_${version.translatedFrom}`)}{' '}
                                <Link
                                    to={localizedPath(version.translatedFrom, routePath)}
                                    hrefLang={originalLang}
                                    lang={originalLang}
                                >
                                    {original.title}
                                </Link>
                            </p>
                        </aside>
                    )}

                    {/* Keyed so that switching language (or article) gives a
                        fresh ArticleBody. Both language URLs render this same
                        component, so React would otherwise keep the old
                        instance, whose state still holds the previous text. */}
                    <ArticleBody key={`${slug}.${language}`} slug={slug} language={language} />

                    <footer className="article-footer">
                        <LocalLink to="/articles" className="btn-article-back">
                            ← {t('article_back')}
                        </LocalLink>
                    </footer>
                </article>
            </div>
        </Layout>
    );
};

export default ArticlePage;
