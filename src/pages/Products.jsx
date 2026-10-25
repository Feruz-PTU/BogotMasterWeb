import Layout from '../components/Layout';
import SEO from '../components/SEO';
import QuoteButton from '../components/QuoteButton';
import LocalLink from '../components/LocalLink';
import MediaImage from '../components/MediaImage';
import GradeTable from '../components/GradeTable';
import { GRADE_FORMS } from '../utils/productGrades';
import { useLanguage } from '../context/LanguageContext';
import { useContent } from '../context/ContentContext';
import { useRequest } from '../context/RequestContext';
import { useReveal } from '../hooks/useReveal';
import { groupProducts } from '../utils/productGroups';
import '../components/Gallery.css';
import './Products.css';

const Products = () => {
    useReveal();
    const { t } = useLanguage();
    const { products } = useContent();
    const { openRequest } = useRequest();

    const openModal = (product) => openRequest({ type: 'quote', products: [product.slug] });

    // Grouped by form, so a buyer looking for powder does not scroll past every
    // slice grade. The structured data lists the products in the same order.
    const groups = groupProducts(products);
    const ordered = groups.flatMap((g) => g.products);

    return (
        <Layout>
            <SEO
                kind="products"
                routePath="/products"
                title={t('products_meta_title')}
                description={t('products_meta_desc')}
                products={ordered}
            />
            <div className="products-page">
                <div className="products-page-header reveal">
                    <h1>{t('our_products')}</h1>
                    <p className="products-page-intro">{t('products_intro')}</p>
                </div>

                {/* Plain fragment links: they work before the scripts load, and
                    the browser scrolls to the heading itself. */}
                <nav className="products-jump" aria-label={t('products_groups_nav')}>
                    <ul>
                        {groups.map((g) => (
                            <li key={g.id}>
                                <a href={`#${g.id}`}>
                                    {t(`products_group_${g.id}`)}
                                    <span className="products-jump-count">{g.products.length}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Content is baked into the page at build time, so there is no
                    loading state here: the groups are in the HTML. */}
                {groups.map((g) => (
                    <section key={g.id} className="products-group" aria-labelledby={g.id}>
                        <h2 id={g.id} className="products-group-title">
                            {t(`products_group_${g.id}`)}
                        </h2>
                        <div className="products-grid">
                            {g.products.map((product, i) => {
                                const index = ordered.indexOf(product);
                                return (
                                    <div key={product.slug} className={`reveal reveal-delay-${(i % 4) + 1}`}>
                                        <div className="gallery-card-item">
                                            <LocalLink
                                                to={`/products/${product.slug}`}
                                                className="gallery-card-image"
                                                tabIndex={-1}
                                                aria-hidden="true"
                                            >
                                                {/* 2 cards a row up to 768 px, 3 to 992, 4 to 1200, then 5. */}
                                                <MediaImage
                                                    src={product.image}
                                                    sizes="(max-width: 768px) 40vw, (max-width: 992px) 29vw, (max-width: 1200px) 22vw, 260px"
                                                    width="1024"
                                                    height="1024"
                                                    loading={index < 4 ? 'eager' : 'lazy'}
                                                    decoding="async"
                                                />
                                            </LocalLink>
                                            <div className="gallery-card-content">
                                                {/* h3 under the group's h2. */}
                                                <h3 className="gallery-card-title">
                                                    <LocalLink to={`/products/${product.slug}`}>
                                                        {product.title}
                                                    </LocalLink>
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
                                );
                            })}
                        </div>
                        {/* Slices and tablets: their grades by root diameter,
                            from the product data (folder 28). */}
                        {GRADE_FORMS.includes(g.id) && <GradeTable form={g.id} className="products-grades" />}
                    </section>
                ))}

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
        </Layout>
    );
};

export default Products;
