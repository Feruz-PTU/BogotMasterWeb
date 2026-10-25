import { useState, useRef, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import QuoteButton from '../components/QuoteButton';
import MediaImage from '../components/MediaImage';
import LocalLink, { useLocalPath } from '../components/LocalLink';
import NotFound from './NotFound';
import { useLanguage } from '../context/LanguageContext';
import { useContent } from '../context/ContentContext';
import { useRequest } from '../context/RequestContext';
import { useReveal } from '../hooks/useReveal';
import {
    productTitle,
    productDescription,
    productBreadcrumb,
} from '../seo/productMeta';
import { isLicoriceRoot } from '../utils/productKind';
import { applicationLinks } from '../utils/productApplications';
import './ProductDetail.css';

// The trade-terms card, in order: each key has a `terms_<key>_label` and a
// `terms_<key>` string.
const TRADE_TERMS = ['moq', 'loads', 'incoterms', 'payment', 'lead_time', 'hs'];

const ProductDetail = () => {
    useReveal();
    const { slug } = useParams();
    const { t } = useLanguage();
    const { products } = useContent();
    const { openRequest } = useRequest();
    const localPath = useLocalPath();
    // The request form, as a price quote or a free-sample request for this
    // product. Reopening the same one keeps what was typed (RequestContext).
    const openModal = (kind) =>
        openRequest({ type: kind === 'sample' ? 'sample' : 'quote', products: [slug] });
    const [relatedProgress, setRelatedProgress] = useState(10);
    const relatedRef = useRef(null);

    const handleRelatedScroll = () => {
        const el = relatedRef.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        if (max <= 0) return;
        setRelatedProgress(10 + (el.scrollLeft / max) * 90);
    };

    const product = products.find((p) => p.slug === slug);

    // An unknown or hidden slug is a genuine 404. It used to silently
    // client-redirect to /products with an HTTP 200, so a dead product URL
    // looked alive to search engines and stayed in the index.
    if (!product) return <NotFound />;

    // The other members of this product's family, in family order: the build
    // fills `related` from the families set in the admin. `products` holds only
    // visible products, so hidden members drop out here. With none left, fall
    // back to the first three products of the catalogue.
    const picked = [...new Set(product.related || [])]
        .map((s) => products.find((p) => p.slug === s))
        .filter((p) => p && p.slug !== slug);
    const related = picked.length > 0
        ? picked
        : products.filter((p) => p.slug !== slug).slice(0, 3);
    const specs = product.activeSpecs || {};
    // Free samples and trade terms: licorice root only, not the partner's
    // extract and not the dried fruit.
    const licorice = isLicoriceRoot(product);
    const applications = applicationLinks(product);
    // Processing is stored as steps separated by ";" and shown as a numbered list.
    const processingSteps = String(specs.processing || '')
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);

    return (
        <Layout>
            <SEO
                kind="product"
                routePath={`/products/${product.slug}`}
                title={productTitle(product, t)}
                description={productDescription(product, t)}
                image={product.image}
                product={product}
                breadcrumb={productBreadcrumb(product, t, localPath)}
            />
            <div className="pd-section">
            <div className="product-detail-page">
                {/* Breadcrumb */}
                <nav className="pd-breadcrumb reveal" aria-label={t('breadcrumb')}>
                    <ol className="pd-breadcrumb-list">
                        <li><LocalLink to="/">{t('home')}</LocalLink></li>
                        <li><LocalLink to="/products">{t('products')}</LocalLink></li>
                        <li><span aria-current="page">{product.title}</span></li>
                    </ol>
                </nav>

                {/* Main content */}
                <div className="pd-main">
                    <div className="pd-image-wrap reveal reveal-delay-1">
                        {/* Above the fold and the LCP element on this page:
                            eager, high priority, and sized to stop layout shift.
                            The full width of the page up to 900 px, half above. */}
                        <MediaImage
                            src={product.image}
                            alt={product.title}
                            sizes="(max-width: 900px) 92vw, 600px"
                            width="1024"
                            height="1024"
                            fetchPriority="high"
                            decoding="async"
                        />
                    </div>

                    <div className="pd-info reveal reveal-delay-2">
                        <h1>{product.title}</h1>
                        <p className="pd-description">{product.description}</p>
                        {applications.length > 0 && (
                            <p className="pd-application-links">
                                {applications.map((a) => (
                                    <LocalLink key={a.path} to={a.path}>
                                        {t(a.labelKey)} →
                                    </LocalLink>
                                ))}
                            </p>
                        )}

                        <div className="pd-actions">
                            <button
                                className="btn-primary pd-cta"
                                onClick={() => openModal('price')}
                            >
                                {t('get_price')}
                            </button>
                            <LocalLink to="/contact" className="pd-contact-link">
                                {t('contactBtn')}
                            </LocalLink>
                        </div>

                        <div className="pd-quote">
                            <QuoteButton product={product} />
                        </div>

                        {licorice && (
                            <div className="pd-sample">
                                <h2 className="pd-sample-title">{t('sample_title')}</h2>
                                <p className="pd-sample-text">{t('sample_text')}</p>
                                <button
                                    type="button"
                                    className="pd-sample-btn"
                                    onClick={() => openModal('sample')}
                                >
                                    {t('sample_btn')}
                                </button>
                                <p className="pd-sample-faq">
                                    {t('sample_more')}{' '}
                                    <LocalLink to="/faq#samples">{t('faq_link')}</LocalLink>
                                    {' · '}
                                    <LocalLink to="/buyers-guide/samples-and-ordering#samples">{t('sample_guide_link')}</LocalLink>
                                </p>
                            </div>
                        )}

                        <div className="pd-badges">
                            <span>{t('about_benefit_1')}</span>
                            {/* No "Free samples and factory visits" badge: on licorice root
                                pages the block above says it in full, and the owner's sample
                                terms do not cover the partner's extract or the dried fruit. */}
                            <span>{t('about_benefit_4')}</span>
                        </div>
                    </div>
                </div>

                {/* Technical Specifications */}
                {Object.entries(specs).some(
                    ([k, v]) => k !== 'documents' && v != null && String(v).trim() !== ''
                ) && (
                    <div className="pd-specs reveal">
                        <div className="pd-specs-head">
                            <h2>{t('specifications')}</h2>
                            {/* Licorice root only: the chapter explains root specifications. */}
                            {licorice && (
                                <LocalLink to="/buyers-guide/reading-a-specification" className="pd-specs-guide">
                                    {t('spec_guide_link')}
                                </LocalLink>
                            )}
                        </div>
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
                            {(specs.form_cut_type || specs.cut_size || specs.diameter_grade || specs.packaging || specs.moq) && (
                                <div className="pd-spec-card">
                                    <h3 className="pd-spec-card-title">{t('spec_physical')}</h3>
                                    <dl className="pd-spec-list">
                                        {specs.form_cut_type && <><dt>{t('spec_form_cut_type')}</dt><dd>{specs.form_cut_type}</dd></>}
                                        {specs.cut_size && <><dt>{t('spec_cut_size')}</dt><dd>{specs.cut_size}</dd></>}
                                        {specs.diameter_grade && <><dt>{t('spec_diameter_grade')}</dt><dd>{specs.diameter_grade}</dd></>}
                                        {specs.packaging && <><dt>{t('spec_packaging')}</dt><dd>{specs.packaging}</dd></>}
                                        {/* On licorice root pages the trade-terms card gives the
                                            full rule (1 t under FCA, a full load otherwise);
                                            a bare "MOQ: 1 MT" beside it would read as a second rule. */}
                                        {specs.moq && !licorice && <><dt>{t('spec_moq')}</dt><dd>{specs.moq}</dd></>}
                                    </dl>
                                </div>
                            )}
                            {processingSteps.length > 0 && (
                                <div className="pd-spec-card">
                                    <h3 className="pd-spec-card-title">{t('spec_processing')}</h3>
                                    {processingSteps.length === 1 ? (
                                        <p className="pd-process-single">{processingSteps[0]}</p>
                                    ) : (
                                        <ol className="pd-process-steps">
                                            {processingSteps.map((step) => (
                                                <li key={step}>{step}</li>
                                            ))}
                                        </ol>
                                    )}
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
                            {licorice && (
                                <div className="pd-spec-card pd-terms-card">
                                    <h3 className="pd-spec-card-title">{t('terms_title')}</h3>
                                    <dl className="pd-spec-list pd-terms-list">
                                        {TRADE_TERMS.map((key) => (
                                            <Fragment key={key}>
                                                <dt>{t(`terms_${key}_label`)}</dt>
                                                <dd>
                                                    {t(`terms_${key}`)}
                                                    {/* The HS line leads to the guide's codes chapter. */}
                                                    {key === 'hs' && (
                                                        <>
                                                            {' · '}
                                                            <LocalLink to="/buyers-guide/import-and-hs-codes" className="pd-terms-inline-link">
                                                                {t('terms_hs_link')}
                                                            </LocalLink>
                                                        </>
                                                    )}
                                                </dd>
                                            </Fragment>
                                        ))}
                                    </dl>
                                    <LocalLink to="/logistics" className="pd-terms-link">
                                        {t('logistics_link')} →
                                    </LocalLink>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
                                <LocalLink key={p.slug} to={`/products/${p.slug}`} className={`pd-related-card reveal reveal-delay-${Math.min(index + 1, 4)}`}>
                                    <div className="pd-related-image">
                                        {/* A swipe row of 65% cards up to 768 px, 3 a row above. */}
                                        <MediaImage
                                            src={p.image}
                                            sizes="(max-width: 768px) 60vw, (max-width: 1300px) 28vw, 360px"
                                            width="1024"
                                            height="1024"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </div>
                                    <div className="pd-related-info">
                                        <h3>{p.title}</h3>
                                        <p>{p.description}</p>
                                        <span className="pd-related-link">
                                            {t('read_more')} →
                                        </span>
                                    </div>
                                </LocalLink>
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
        </Layout>
    );
};

export default ProductDetail;
