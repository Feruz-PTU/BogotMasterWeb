import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '../components/Layout';
import LocalLink from '../components/LocalLink';
import SEO from '../components/SEO';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import Process from '../components/Process';
import HomeCTA from '../components/HomeCTA';
import PriceModal from '../components/PriceModal';
import Certificates from '../components/Certificates';
import Partners from '../components/Partners';
import FeaturedGallery from '../components/FeaturedGallery';
import { useLanguage } from '../context/LanguageContext';
import { useContent } from '../context/ContentContext';
import { useReveal } from '../hooks/useReveal';
import '../components/Gallery.css';
import './Home.css';

const CheckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="check-svg" style={{ color: 'var(--color-primary)', marginRight: '10px' }}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const Home = ({ addToast }) => {
    useReveal();
    const { t } = useLanguage();
    const { featuredProducts } = useContent();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const openProductModal = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    return (
        <Layout>
            <SEO kind="home" routePath="/" />

            {/* The hero image preload belongs to this page only. It used to sit
                in index.html, so /about, /contact and /admin each downloaded
                164 KB of hero image they never showed. */}
            <Helmet>
                <link
                    rel="preload"
                    as="image"
                    href="/images/hero-bg-new.webp"
                    fetchpriority="high"
                    media="(min-width: 641px)"
                />
            </Helmet>

            <Hero addToast={addToast} />
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
                                    <img
                                        src={product.image}
                                        alt=""
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
                    
                    <div className="home-about-images reveal reveal-delay-1">
                        <img src="/images/image16.png" alt={t('about_img_1')} width="435" height="324" loading="lazy" decoding="async" />
                        {/* image17 is rendered twice (desktop + mobile copies)
                            and only one is ever visible, so the hidden one
                            carries alt="" to avoid the same description being
                            announced twice. */}
                        <img src="/images/image17.png" alt={t('about_img_2')} className="desktop-only-about-img" width="227" height="265" loading="lazy" decoding="async" />
                    </div>
                    <div className="home-about-text reveal reveal-delay-2">
                        <div className="home-about-mobile-layout">
                            <div className="home-about-mobile-img">
                                <img src="/images/image17.png" alt="" width="227" height="265" loading="lazy" decoding="async" />
                            </div>
                            <div className="home-about-paragraphs">
                                <p>{t('about_p1')}</p>
                                <p>{t('about_p2')}</p>
                            </div>
                        </div>

                        <p className="desktop-about-p1">{t('about_p1')}</p>
                        <p className="desktop-about-p2">{t('about_p2')}</p>

                        <ul className="home-benefits">
                            <li><CheckIcon />{t('about_benefit_1')}</li>
                            <li><CheckIcon />{t('about_benefit_2')}</li>
                            <li><CheckIcon />{t('about_benefit_3')}</li>
                            <li><CheckIcon />{t('about_benefit_4')}</li>
                        </ul>
                        <LocalLink to="/about" className="btn-details">{t('read_more')}</LocalLink>
                    </div>
                </div>
            </section>

            <div className="reveal"><Certificates /></div>
            <div className="reveal"><Partners /></div>
            <div className="reveal"><FeaturedGallery /></div>

            <HomeCTA />

            <PriceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                productTitle={selectedProduct?.title || ''}
                addToast={addToast}
            />
        </Layout>
    );
};

export default Home;
