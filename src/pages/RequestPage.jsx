import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import SEO from '../components/SEO';
import RequestForm from '../components/RequestForm';
import LocalLink, { useLocalPath } from '../components/LocalLink';
import { useLanguage } from '../context/LanguageContext';
import { REQUEST_TYPES } from '../utils/requestOptions';
import './RequestPage.css';

/**
 * /request: the request form on a page of its own. A link can choose the
 * type and the products: /request?type=sample&product=slice-a,powder.
 *
 * The query is read after hydration, because the prerendered HTML has none;
 * the form then starts again with those values (its `key` changes).
 */
const RequestPage = () => {
    const { t } = useLanguage();
    const localPath = useLocalPath();
    const [start, setStart] = useState(null);

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const type = REQUEST_TYPES.some((r) => r.value === query.get('type')) ? query.get('type') : undefined;
        const products = (query.get('product') || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 20);
        if (type || products.length) setStart({ type, products });
    }, []);

    const breadcrumb = [
        { name: t('home'), path: localPath('/') },
        { name: t('request_h1'), path: localPath('/request') },
    ];

    return (
        <Layout>
            <SEO
                routePath="/request"
                title={t('request_meta_title')}
                description={t('request_meta_desc')}
                breadcrumb={breadcrumb}
            />
            <div className="request-page">
                <div className="request-inner">
                    <nav className="request-breadcrumb" aria-label={t('breadcrumb')}>
                        <ol>
                            <li><LocalLink to="/">{t('home')}</LocalLink></li>
                            <li><span aria-current="page">{t('request_h1')}</span></li>
                        </ol>
                    </nav>
                    <h1>{t('request_h1')}</h1>
                    <p className="request-intro">{t('request_intro')}</p>
                    <div className="request-card">
                        <RequestForm
                            key={start ? `${start.type || ''}:${start.products.join(',')}` : 'default'}
                            initialType={start?.type}
                            initialProducts={start?.products}
                        />
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default RequestPage;
