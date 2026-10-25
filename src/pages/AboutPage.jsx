import Layout from '../components/Layout';
import SEO from '../components/SEO';
import About from '../components/About';
import Certificates from '../components/Certificates';
import HomeCTA from '../components/HomeCTA';
import { useLanguage } from '../context/LanguageContext';
import { useReveal } from '../hooks/useReveal';

const AboutPage = () => {
    const { t } = useLanguage();
    useReveal();
    return (
        <Layout>
            <SEO
                kind="about"
                routePath="/about"
                title={t('about_meta_title')}
                description={t('about_meta_desc')}
            />
            <div style={{ paddingTop: '30px' }}>
                <div className="reveal"><About headingLevel="h1" /></div>

                {/* Mission Section */}
                <section className="about-extra-section reveal">
                    <div className="about-extra-container">
                        <div className="about-extra-grid">
                            <div className="about-extra-content">
                                {/* Was `{about_title} & {footer_slogan}`, which
                                    composed the nonsense heading "About Company
                                    & Excellence in every detail." */}
                                <h2>{t('about_mission_title')}</h2>
                                {/* Shown here only: <About> above stops at about_p2. */}
                                <p>{t('about_p3')}</p>
                                <p>{t('about_p4')}</p>
                            </div>
                            <div className="about-extra-stats">
                                <div className="extra-stat-card">
                                    <h3>500+</h3>
                                    <p>{t('about_extra_stat_tons')}</p>
                                </div>
                                <div className="extra-stat-card">
                                    <h3>20+</h3>
                                    <p>{t('about_extra_stat_staff')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* The legal name and INN under the documents, as on the contact page. */}
                <div className="reveal"><Certificates withLegal /></div>

                <HomeCTA />
            </div>
        </Layout>
    );
};

export default AboutPage;
