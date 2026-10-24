import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import MarkdownBody from '../components/MarkdownBody';
import LocalLink, { useLocalPath } from '../components/LocalLink';
import NotFound from './NotFound';
import { useLanguage } from '../context/LanguageContext';
import { findArticle, articleLanguages } from '../content/articles';
import * as articleBodies from '../content/articles/bodies';
import { getLanguage, localizedPath } from '../i18n/languages';
import { formatDate } from '../utils/dates';
import './ArticlePage.css';

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
                    <MarkdownBody
                        key={`${slug}.${language}`}
                        bodies={articleBodies}
                        kind="article"
                        name={slug}
                        language={language}
                        className="article-body"
                        loadingText={t('article_loading')}
                    />

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
