import { useLanguage } from '../context/LanguageContext';
import { useRequest } from '../context/RequestContext';
import './About.css';

const CheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="check-svg">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

/**
 * The top of the About page (the home page has its own short version).
 * `headingLevel` lets the About page render this as its <h1>; the page
 * previously had no <h1> at all.
 *
 * Only the first two paragraphs are here: about_p3 (capacity and staff) and
 * about_p4 (wild harvest, partnerships) are the "What we do and how we work"
 * section right below, and used to show twice (folder 26).
 */
const About = ({ headingLevel = 'h2' }) => {
    const { t } = useLanguage();
    const { openRequest } = useRequest();
    const Heading = headingLevel;

    // A price quote with no product chosen yet.
    const openModal = () => openRequest({ type: 'quote' });

    return (
        <section className="about-section reveal" id="about">
            <div className="about-container">
                <div className="about-header reveal">
                    <Heading>{t('about_title')}</Heading>
                </div>
                <div className="about-content">
                    <div className="about-logo reveal reveal-delay-1">
                        <img src="/Logo/new-logo.png" alt="Bogot Master" width="904" height="904" />
                    </div>
                    <div className="about-text reveal reveal-delay-2">
                        <div className="about-description">
                            <p>{t('about_p1')}</p>
                            <p>{t('about_p2')}</p>
                        </div>
                        <ul className="about-benefits">
                            <li>
                                <CheckIcon />
                                {t('about_benefit_1')}
                            </li>
                            <li>
                                <CheckIcon />
                                {t('about_benefit_2')}
                            </li>
                            <li>
                                <CheckIcon />
                                {t('about_benefit_3')}
                            </li>
                            <li>
                                <CheckIcon />
                                {t('about_benefit_4')}
                            </li>
                        </ul>
                        {/* `openModal` was defined but wired to nothing, so the
                            About page mounted a quote dialog that could never
                            be opened and had no working call to action. */}
                        <button
                            type="button"
                            className="btn-primary about-cta"
                            onClick={openModal}
                        >
                            {t('get_price')}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
