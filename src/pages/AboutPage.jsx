import Layout from '../components/Layout';
import SEO from '../components/SEO';
import About from '../components/About';
import Certificates from '../components/Certificates';
import HomeCTA from '../components/HomeCTA';
import { useLanguage } from '../context/LanguageContext';
import { useReveal } from '../hooks/useReveal';

const AboutPage = () => {
    const { t, language } = useLanguage();
    useReveal();
    return (
        <Layout>
            <SEO title={t('about_meta_title')} description={t('about_meta_desc')} />
            <div style={{ paddingTop: '30px' }}>
                <div className="reveal"><About /></div>
                
                {/* Mission Section */}
                <section className="about-extra-section reveal">
                    <div className="about-extra-container">
                        <div className="about-extra-grid">
                            <div className="about-extra-content">
                                <h2>{t('about_title')} & {t('footer_slogan')}</h2>
                                <p>{t('about_p3')}</p>
                                <p>{t('about_p4')}</p>
                            </div>
                            <div className="about-extra-stats">
                                <div className="extra-stat-card">
                                    <h3>1500+</h3>
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

                <div className="reveal"><Certificates /></div>
                
                <HomeCTA />
            </div>
        </Layout>
    );
};

export default AboutPage;
