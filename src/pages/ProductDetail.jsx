import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import PriceModal from '../components/PriceModal';
import QuoteButton from '../components/QuoteButton';
import { ProductDetailSkeleton } from '../components/Skeleton';
import { useLanguage } from '../context/LanguageContext';
import { useContent } from '../context/ContentContext';
import { useReveal } from '../hooks/useReveal';
import './ProductDetail.css';

const ProductDetail = ({ addToast }) => {
    useReveal();
    const { slug } = useParams();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { products, loading } = useContent();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [relatedProgress, setRelatedProgress] = useState(10);
    const relatedRef = useRef(null);

    const handleRelatedScroll = () => {
        const el = relatedRef.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        if (max <= 0) return;
        setRelatedProgress(10 + (el.scrollLeft / max) * 90);
    };

    const product = products.find(p => p.slug === slug);
    const related = products.filter(p => p.slug !== slug).slice(0, 3);

    useEffect(() => {
        if (!loading && !product) {
            navigate('/products', { replace: true });
        }
    }, [loading, product, navigate]);

    if (loading || !product) {
        return (
            <Layout>
                <div className="pd-section">
                    <ProductDetailSkeleton />
                </div>
            </Layout>
        );
    }

    const siteUrl = 'https://bogotmaster.org';
    const productImage = product.image?.startsWith('http')
        ? product.image
        : `${siteUrl}${product.image}`;
    const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': product.title,
        'description': product.description,
        'image': productImage,
        'category': 'Licorice Root',
        'brand': { '@type': 'Brand', 'name': 'Bogot Master' },
        'manufacturer': { '@type': 'Organization', 'name': 'Bogot Master' },
    };

    return (
        <Layout>
            <SEO
                title={`${product.title} | Bogot Master`}
                description={product.description}
                image={productImage}
                structuredData={productSchema}
            />
            <div className="pd-section">
            <div className="product-detail-page">
                {/* Breadcrumb */}
                <nav className="pd-breadcrumb reveal">
                    <Link to="/">{t('home')}</Link>
                    <span>/</span>
                    <Link to="/products">{t('products')}</Link>
                    <span>/</span>
                    <span>{product.title}</span>
                </nav>

                {/* Main content */}
                <div className="pd-main">
                    <div className="pd-image-wrap reveal reveal-delay-1">
                        <img src={product.image} alt={product.title} />
                    </div>

                    <div className="pd-info reveal reveal-delay-2">
                        <h1>{product.title}</h1>
                        <p className="pd-description">{product.description}</p>

                        <div className="pd-actions">
                            <button
                                className="btn-primary pd-cta"
                                onClick={() => setIsModalOpen(true)}
                            >
                                {t('get_price')}
                            </button>
                            <Link to="/contact" className="pd-contact-link">
                                {t('contactBtn')}
                            </Link>
                        </div>

                        <div className="pd-quote">
                            <QuoteButton product={product} />
                        </div>

                        <div className="pd-badges">
                            <span>{t('about_benefit_1')}</span>
                            <span>{t('about_benefit_3')}</span>
                            <span>{t('about_benefit_4')}</span>
                        </div>
                    </div>
                </div>

                {/* Technical Specifications */}
                {product.specs && Object.values(product.specs).some(v => v) && (() => {
                    const rawSpecs = product.specs;
                    const isNested = rawSpecs?.en || rawSpecs?.ru;
                    const langSpecs = isNested
                        ? (rawSpecs[language] || rawSpecs.en || rawSpecs.ru || {})
                        : rawSpecs;
                    const docs = langSpecs.documents?.length > 0
                        ? langSpecs.documents
                        : (rawSpecs?.en?.documents || rawSpecs?.ru?.documents || []);
                    const specs = { ...langSpecs, documents: docs };
                    return (
                    <div className="pd-specs reveal">
                        <h2>{t('specifications')}</h2>
                        <div className="pd-specs-grid">
                            {(specs.botanical_name || specs.origin || specs.part_used || specs.cultivation) && (
                                <div className="pd-spec-card">
                                    <h3 className="pd-spec-card-title">{t('spec_identity')}</h3>
                                    <dl className="pd-spec-list">
                                        {specs.botanical_name && <><dt>{t('spec_botanical_name')}</dt><dd><em>{specs.botanical_name}</em></dd></>}
                                        {specs.origin && <><dt>{t('spec_origin')}</dt><dd>{specs.origin}</dd></>}
                                        {specs.part_used && <><dt>{t('spec_part_used')}</dt><dd>{specs.part_used}</dd></>}
                                        {specs.cultivation && <><dt>{t('spec_cultivation')}</dt><dd>{specs.cultivation}</dd></>}
                                    </dl>
                                </div>
                            )}
                            {(specs.form_cut_type || specs.cut_size || specs.diameter_grade || specs.processing || specs.packaging || specs.moq) && (
                                <div className="pd-spec-card">
                                    <h3 className="pd-spec-card-title">{t('spec_physical')}</h3>
                                    <dl className="pd-spec-list">
                                        {specs.form_cut_type && <><dt>{t('spec_form_cut_type')}</dt><dd>{specs.form_cut_type}</dd></>}
                                        {specs.cut_size && <><dt>{t('spec_cut_size')}</dt><dd>{specs.cut_size}</dd></>}
                                        {specs.diameter_grade && <><dt>{t('spec_diameter_grade')}</dt><dd>{specs.diameter_grade}</dd></>}
                                        {specs.processing && <><dt>{t('spec_processing')}</dt><dd>{specs.processing}</dd></>}
                                        {specs.packaging && <><dt>{t('spec_packaging')}</dt><dd>{specs.packaging}</dd></>}
                                        {specs.moq && <><dt>{t('spec_moq')}</dt><dd>{specs.moq}</dd></>}
                                    </dl>
                                </div>
                            )}
                            {(specs.moisture || specs.ash || specs.glycyrrhizin || specs.foreign_matter || specs.heavy_metals || specs.pesticide_residues) && (
                                <div className="pd-spec-card">
                                    <h3 className="pd-spec-card-title">{t('spec_quality')}</h3>
                                    <dl className="pd-spec-list">
                                        {specs.moisture && <><dt>{t('spec_moisture')}</dt><dd>{specs.moisture}</dd></>}
                                        {specs.ash && <><dt>{t('spec_ash')}</dt><dd>{specs.ash}</dd></>}
                                        {specs.glycyrrhizin && <><dt>{t('spec_glycyrrhizin')}</dt><dd>{specs.glycyrrhizin}</dd></>}
                                        {specs.foreign_matter && <><dt>{t('spec_foreign_matter')}</dt><dd>{specs.foreign_matter}</dd></>}
                                        {specs.heavy_metals && <><dt>{t('spec_heavy_metals')}</dt><dd>{specs.heavy_metals}</dd></>}
                                        {specs.pesticide_residues && <><dt>{t('spec_pesticide_residues')}</dt><dd>{specs.pesticide_residues}</dd></>}
                                    </dl>
                                </div>
                            )}
                            {(specs.tpc || specs.yeast_mould || specs.e_coli || specs.salmonella) && (
                                <div className="pd-spec-card">
                                    <h3 className="pd-spec-card-title">{t('spec_microbiology')}</h3>
                                    <dl className="pd-spec-list">
                                        {specs.tpc && <><dt>{t('spec_tpc')}</dt><dd>{specs.tpc}</dd></>}
                                        {specs.yeast_mould && <><dt>{t('spec_yeast_mould')}</dt><dd>{specs.yeast_mould}</dd></>}
                                        {specs.e_coli && <><dt>{t('spec_e_coli')}</dt><dd>{specs.e_coli}</dd></>}
                                        {specs.salmonella && <><dt>{t('spec_salmonella')}</dt><dd>{specs.salmonella}</dd></>}
                                    </dl>
                                </div>
                            )}
                            {(specs.shelf_life || specs.storage) && (
                                <div className="pd-spec-card">
                                    <h3 className="pd-spec-card-title">{t('spec_storage_shelf')}</h3>
                                    <dl className="pd-spec-list">
                                        {specs.shelf_life && <><dt>{t('spec_shelf_life')}</dt><dd>{specs.shelf_life}</dd></>}
                                        {specs.storage && <><dt>{t('spec_storage')}</dt><dd>{specs.storage}</dd></>}
                                    </dl>
                                </div>
                            )}
                            {specs.documents?.length > 0 && (
                                <div className="pd-spec-card">
                                    <h3 className="pd-spec-card-title">{t('spec_accompanying_docs')}</h3>
                                    <ul className="pd-doc-list">
                                        {specs.documents.map(doc => (
                                            <li key={doc}>{doc}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                    );
                })()}

                {/* Related products */}
                {related.length > 0 && (
                    <div className="pd-related reveal">
                        <h2>{t('related_products')}</h2>
                        <div
                            className="pd-related-grid"
                            ref={relatedRef}
                            onScroll={handleRelatedScroll}
                        >
                            {related.map((p, index) => (
                                <Link key={p.slug} to={`/products/${p.slug}`} className={`pd-related-card reveal reveal-delay-${index + 1}`}>
                                    <div className="pd-related-image">
                                        <img src={p.image} alt={p.title} loading="lazy" />
                                    </div>
                                    <div className="pd-related-info">
                                        <h3>{p.title}</h3>
                                        <p>{p.description}</p>
                                        <span className="pd-related-link">
                                            {t('read_more')} →
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        {/* Progress bar — visible on mobile only */}
                        <div className="pd-related-progress-container">
                            <div
                                className="pd-related-progress-bar"
                                style={{ width: `${Math.min(100, relatedProgress)}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
            </div>

            <PriceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                productTitle={product.title}
                addToast={addToast}
            />
        </Layout>
    );
};

export default ProductDetail;
