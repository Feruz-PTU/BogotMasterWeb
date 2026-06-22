import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import PriceModal from '../components/PriceModal';
import QuoteButton from '../components/QuoteButton';
import { ProductCardSkeleton } from '../components/Skeleton';
import { useLanguage } from '../context/LanguageContext';
import { useContent } from '../context/ContentContext';
import { useReveal } from '../hooks/useReveal';
import '../components/Gallery.css';
import './Products.css';

const Products = ({ addToast }) => {
    useReveal();
    const { t } = useLanguage();
    const { products, loading } = useContent();
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    return (
        <Layout>
            <SEO title={t('products_meta_title')} description={t('products_meta_desc')} />
            <div className="products-page">
                <div className="products-page-header reveal">
                    <h1>{t('our_products')}</h1>
                </div>

                <div className="products-grid">
                    {loading
                        ? Array(8).fill(0).map((_, i) => (
                            <ProductCardSkeleton key={i} />
                        ))
                        : products.map((product, index) => (
                            <div key={product.slug} className={`reveal reveal-delay-${(index % 4) + 1}`}>
                                <div className="gallery-card-item">
                                    <Link to={`/products/${product.slug}`} className="gallery-card-image">
                                        <img src={product.image} alt={product.title} loading="lazy" />
                                    </Link>
                                    <div className="gallery-card-content">
                                        <h3>
                                            <Link to={`/products/${product.slug}`}>{product.title}</Link>
                                        </h3>
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
                        ))
                    }
                </div>
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
