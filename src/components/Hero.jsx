import './Hero.css';
import { useLanguage } from '../context/LanguageContext';
import { useContent } from '../context/ContentContext';
import { useRequest } from '../context/RequestContext';

const Hero = () => {
    const { t } = useLanguage();
    const { settings } = useContent();
    const { openRequest } = useRequest();

    const title = settings?.hero_title || t('hero_title');
    const subtitle = settings?.hero_subtitle || t('hero_subtitle');
    const cta = settings?.hero_cta || t('hero_cta');

    return (
        <section className="hero" id="home">
            <div className="hero-content">
                <h1>{title}</h1>
                <p>{subtitle}</p>
                {/* A price quote with no product chosen yet. */}
                <button className="btn-primary" onClick={() => openRequest({ type: 'quote' })}>
                    {cta}
                </button>
            </div>
            <div className="hero-image">
                <img src="/images/hero-bg-new.webp" alt={t('hero_image_alt')} fetchPriority="high" decoding="async" />
            </div>
        </section>
    );
};

export default Hero;
