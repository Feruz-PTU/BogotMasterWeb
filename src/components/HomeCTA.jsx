import './HomeCTA.css';
import { useLanguage } from '../context/LanguageContext';
import LocalLink from './LocalLink';

const HomeCTA = () => {
    const { t } = useLanguage();

    return (
        <section className="home-cta-section">
            <div className="home-cta-container">
                <div className="home-cta-content">
                    {/* These two strings were hardcoded in the component with a
                        `language === 'ru' ? … : …` ternary, so an <h2> on two
                        pages sat outside the translation system entirely and
                        could not be edited in the admin panel. */}
                    <h2>{t('home_cta_title')}</h2>
                    <p>{t('home_cta_text')}</p>
                    <div className="home-cta-btns">
                        <LocalLink to="/contact" className="btn-primary">
                            {t('contactBtn')}
                        </LocalLink>
                        <LocalLink to="/about" className="btn-secondary-outline">
                            {t('read_more')}
                        </LocalLink>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HomeCTA;
