import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import { InlineMarkdown } from '../components/Markdown';
import PlantPhoto from '../components/PlantPhoto';
import { useLanguage } from '../context/LanguageContext';
import { ARTICLES } from '../content/articles';
import { DEFAULT_LANGUAGE, getLanguage, localizedPath } from '../i18n/languages';
import { formatDate } from '../utils/dates';
import './ArticlesPage.css';

/**
 * /articles — general information about licorice root, then one card per
 * article. The articles themselves are listed in src/content/articles/.
 */

/** The version of an article to show a reader of `language`. */
function versionFor(article, language) {
    if (article.languages[language]) return language;
    if (article.languages[DEFAULT_LANGUAGE]) return DEFAULT_LANGUAGE;
    return Object.keys(article.languages)[0];
}

const ArticleCard = ({ article }) => {
    const { t, language } = useLanguage();
    const shown = versionFor(article, language);
    const { title, summary } = article.languages[shown];
    // An article not written in the reader's language links to the version
    // that exists, and says which language that is.
    const foreign = shown !== language;
    const textLang = foreign ? getLanguage(shown).htmlLang : undefined;
    const href = localizedPath(shown, `/articles/${article.slug}`);

    return (
        <li className="article-card">
            <h3 lang={textLang}>
                <Link to={href} hrefLang={textLang}>{title}</Link>
            </h3>
            <p className="article-card-meta">
                <time dateTime={article.published}>
                    {formatDate(article.published, language)}
                </time>
                {foreign && (
                    <span className="article-card-lang">{t('article_english_only')}</span>
                )}
            </p>
            <p className="article-card-summary" lang={textLang}>
                <InlineMarkdown text={summary} />
            </p>
            {/* The visually hidden title makes the link say where it goes;
                "Read" alone is the same text on every card. */}
            <Link to={href} hrefLang={textLang} className="btn-article-read">
                {t('article_read')}
                <span className="sr-only" lang={textLang}> — {title}</span>
            </Link>
        </li>
    );
};

const ArticlesPage = () => {
    const { t } = useLanguage();

    return (
        <Layout>
            <SEO
                kind="articles"
                routePath="/articles"
                title={t('articles_meta_title')}
                description={t('articles_meta_desc')}
            />
            <div className="articles-page">
                <header className="articles-intro">
                    <span className="section-label">{t('articles')}</span>
                    <h1>{t('articles_title')}</h1>
                    <PlantPhoto className="articles-intro-photo" loading="eager" />
                    <p><InlineMarkdown text={t('articles_intro_1')} /></p>
                    <p><InlineMarkdown text={t('articles_intro_2')} /></p>
                    <p><InlineMarkdown text={t('articles_intro_3')} /></p>
                </header>

                <section className="articles-list-section" aria-labelledby="articles-list-title">
                    <h2 id="articles-list-title">{t('articles_list_title')}</h2>
                    <ul className="articles-list" role="list">
                        {ARTICLES.map((article) => (
                            <ArticleCard key={article.slug} article={article} />
                        ))}
                    </ul>
                </section>
            </div>
        </Layout>
    );
};

export default ArticlesPage;
