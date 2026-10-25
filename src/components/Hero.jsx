import './Hero.css';
import { useLanguage } from '../context/LanguageContext';
import { useContent } from '../context/ContentContext';
import { useRequest } from '../context/RequestContext';
import { HERO_DESKTOP, HERO_MOBILE, HERO_MOBILE_MEDIA } from '../utils/siteImages';

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
                {/* One <picture>, so each screen downloads only its own image.
                    Phones used to download the 164 KB desktop image (hidden
                    with CSS, at high priority) beside their own, which was a
                    CSS background the browser found only after the stylesheet:
                    the home page's largest element on a phone, found late and
                    sharing the line with a file nobody saw (folder 27). */}
                <picture>
                    <source media={HERO_MOBILE_MEDIA} srcSet={HERO_MOBILE} width="612" height="408" />
                    <img
                        fetchPriority="high"
                        decoding="async"
                        alt={t('hero_image_alt')}
                        width="1080"
                        height="1080"
                        sizes={HERO_DESKTOP.sizes}
                        srcSet={HERO_DESKTOP.srcSet}
                        src={HERO_DESKTOP.src}
                    />
                </picture>
            </div>
        </section>
    );
};

export default Hero;
