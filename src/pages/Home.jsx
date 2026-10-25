import { Helmet } from 'react-helmet-async';
import Layout from '../components/Layout';
import LocalLink from '../components/LocalLink';
import SEO from '../components/SEO';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import Process from '../components/Process';
import HomeCTA from '../components/HomeCTA';
import Certificates from '../components/Certificates';
import Partners from '../components/Partners';
import FeaturedGallery from '../components/FeaturedGallery';
import LicoriceIntro from '../components/LicoriceIntro';
import MediaImage from '../components/MediaImage';
import { HERO_DESKTOP, HERO_MOBILE, HERO_MOBILE_MEDIA, LOGO } from '../utils/siteImages';
import { useLanguage } from '../context/LanguageContext';
import { useContent } from '../context/ContentContext';
import { useRequest } from '../context/RequestContext';
import { useReveal } from '../hooks/useReveal';
import '../components/Gallery.css';
import './Home.css';

const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="check-svg" style={{ color: 'var(--color-primary)', marginRight: '10px' }}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const Home = () => {
    useReveal();
    const { t } = useLanguage();
    const { featuredProducts } = useContent();
    const { openRequest } = useRequest();

    const openProductModal = (product) => openRequest({ type: 'quote', products: [product.slug] });

    return (
        <Layout>
            <SEO kind="home" routePath="/" />

            {/* The hero image preload belongs to this page only. It used to sit
                in index.html, so /about, /contact and /admin each downloaded
                164 KB of hero image they never showed. */}
            <Helmet>
                {/* Two preloads, one per breakpoint. Below 641px the hero <img>
                    is display:none and the visible hero is a CSS background,
                    which the browser cannot discover until it has parsed the
                    stylesheet — that background is the LCP element on mobile
                    and was never preloaded. The old setup preloaded the
                    DESKTOP image on every device, so phones spent high-priority
                    bandwidth on a file they never showed.
                    Since folder 27 the hero is a <picture> (Hero.jsx); each
                    preload names exactly what its <img> or <source> picks, the
                    desktop one with the same srcset and sizes, so the browser
                    reuses the preloaded file instead of fetching a second. */}
                <link
                    rel="preload"
                    as="image"
                    href={HERO_DESKTOP.src}
                    imageSrcSet={HERO_DESKTOP.srcSet}
                    imageSizes={HERO_DESKTOP.sizes}
                    fetchPriority="high"
                    media="(min-width: 641px)"
                />
                <link
                    rel="preload"
                    as="image"
                    href={HERO_MOBILE}
                    fetchPriority="high"
                    media={HERO_MOBILE_MEDIA}
                />
            </Helmet>

            <Hero />
            <Stats />

            <section className="home-products-section reveal">
                <div className="section-header">
                    <span className="section-label">{t('products')}</span>
                    <h2 className="section-title">{t('our_products')}</h2>
                </div>
                <div className="home-products-grid">
                    {(featuredProducts || []).slice(0, 4).map((product, index) => (
                        <div key={product.slug} className={`reveal reveal-delay-${(index % 4) + 1}`}>
                            <div className="home-product-card">
                                {/* alt="" and removed from the tab order: the
                                    product name right below is already a link
                                    to the same page, so this was a duplicate
                                    link with duplicate text for a screen
                                    reader. */}
                                <LocalLink
                                    to={`/products/${product.slug}`}
                                    className="home-product-image"
                                    tabIndex={-1}
                                    aria-hidden="true"
                                >
                                    {/* Two cards a row up to 1200 px, four above. */}
                                    <MediaImage
                                        src={product.image}
                                        sizes="(max-width: 1200px) 40vw, 270px"
                                        width="1024"
                                        height="1024"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </LocalLink>
                                <div className="home-product-content">
                                    <h3>
                                        <LocalLink to={`/products/${product.slug}`}>
                                            {product.title}
                                        </LocalLink>
                                    </h3>
                                    <p>{product.description}</p>
                                    <button
                                        className="btn-price"
                                        onClick={() => openProductModal(product)}
                                    >
                                        {t('get_price')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="home-products-footer">
                    <LocalLink to="/products" className="btn-view-all-bottom">{t('view_all_products')}</LocalLink>
                </div>
            </section>

            <Process />

            <section className="home-about-snippet reveal">
                <div className="home-about-inner">
                    <h2 className="section-title" style={{ gridColumn: '1 / span 2', marginBottom: '40px' }}>{t('about_title')}</h2>
                    
                    <div className="home-about-logo reveal reveal-delay-1">
                        <img
                            alt="Bogot Master"
                            width="904"
                            height="904"
                            loading="lazy"
                            decoding="async"
                            sizes="(max-width: 900px) 200px, 320px"
                            srcSet={LOGO.srcSet}
                            src={LOGO.src}
                        />
                    </div>
                    <div className="home-about-text reveal reveal-delay-2">
                        <p>{t('about_p1')}</p>
                        <p>{t('about_p2')}</p>

                        <ul className="home-benefits">
                            <li><CheckIcon />{t('about_benefit_1')}</li>
                            <li><CheckIcon />{t('about_benefit_2')}</li>
                            <li><CheckIcon />{t('about_benefit_3')}</li>
                            <li><CheckIcon />{t('about_benefit_4')}</li>
                        </ul>
                        {/* "Read More" on its own is a generic link label.
                            The extra words are visually hidden, so the button
                            looks identical but the link now says what it
                            leads to — for screen readers and for search. */}
                        <LocalLink to="/about" className="btn-details">
                            {t('read_more')}
                            <span className="sr-only"> — {t('about_title')}</span>
                        </LocalLink>
                    </div>
                </div>
            </section>

            <LicoriceIntro />

            <div className="reveal"><Certificates /></div>
            <div className="reveal"><Partners /></div>
            <div className="reveal"><FeaturedGallery /></div>

            <HomeCTA />
        </Layout>
    );
};

export default Home;
