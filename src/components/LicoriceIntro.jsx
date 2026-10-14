import { useLanguage } from '../context/LanguageContext';
import LocalLink from './LocalLink';
import { InlineMarkdown } from './Markdown';
import './LicoriceIntro.css';

/** Home page: what licorice root is, with a link to the articles page. */
const LicoriceIntro = () => {
    const { t } = useLanguage();

    return (
        <section className="licorice-intro reveal" aria-labelledby="licorice-intro-title">
            <div className="licorice-intro-inner">
                <span className="section-label">{t('home_licorice_label')}</span>
                <h2 id="licorice-intro-title" className="section-title">
                    {t('home_licorice_title')}
                </h2>
                <p><InlineMarkdown text={t('home_licorice_text')} /></p>
                <LocalLink to="/articles" className="btn-licorice-more">
                    {t('read_more')}
                    <span className="sr-only"> — {t('articles')}</span>
                </LocalLink>
            </div>
        </section>
    );
};

export default LicoriceIntro;
