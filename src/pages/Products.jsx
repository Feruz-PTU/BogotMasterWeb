import { useState } from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import PriceModal from '../components/PriceModal';
import QuoteButton from '../components/QuoteButton';
import LocalLink from '../components/LocalLink';
import { useLanguage } from '../context/LanguageContext';
import { useContent } from '../context/ContentContext';
import { useReveal } from '../hooks/useReveal';
import '../components/Gallery.css';
import './Products.css';

const Products = ({ addToast }) => {
    useReveal();
    const { t } = useLanguage();
    const { products } = useContent();
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    return (
        <Layout>
            <SEO
                kind="products"
                routePath="/products"
                title={t('products_meta_title')}
                description={t('products_meta_desc')}
                products={products}
            />
            <div className="products-page">
                <div className="products-page-header reveal">
                    <h1>{t('our_products')}</h1>
                    <p className="products-page-intro">{t('products_intro')}</p>
                </div>

                <div className="products-grid">
                    {/* Content is baked into the page at build time, so there is
                        no loading state here any more — the grid is in the HTML. */}
                    {products.map((product, index) => (
                        <div key={product.slug} className={`reveal reveal-delay-${(index % 4) + 1}`}>
                            <div className="gallery-card-item">
                                <LocalLink
                                    to={`/products/${product.slug}`}
                                    className="gallery-card-image"
                                    tabIndex={-1}
                                    aria-hidden="true"
                                >
                                    <img
                                        src={product.image}
                                        alt=""
                                        width="1024"
                                        height="1024"
                                        loading={index < 4 ? 'eager' : 'lazy'}
                                        decoding="async"
                                    />
                                </LocalLink>
                                <div className="gallery-card-content">
                                    {/* h2, not h3: the page goes h1 -> h2 with no
                                        skipped level. */}
                                    <h2 className="gallery-card-title">
                                        <LocalLink to={`/products/${product.slug}`}>
                                            {product.title}
                                        </LocalLink>
                                    </h2>
                                    <p>{product.description}</p>
                                    <button
                                        className="btn-price"
                                        onClick={() => openModal(product)}
                                    >
                                        {t('get_price')}
                                    </button>
                                    <QuoteButton product={product} variant="compact" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* The catalogue used to end abruptly after the last card with
                    no way to act on it. */}
                <section className="products-page-cta reveal">
                    <h2>{t('products_cta_title')}</h2>
                    <p>{t('products_cta_text')}</p>
                    <LocalLink to="/contact" className="btn-primary">
                        {t('contactBtn')}
                    </LocalLink>
                </section>
            </div>

            <PriceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                productTitle={selectedProduct?.title || ''}
                addToast={addToast}
            />
        </Layout>
    );
};

export default Products;
