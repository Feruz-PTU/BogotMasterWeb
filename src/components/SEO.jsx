import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const SITE_URL = 'https://bogotmaster.org';

const SEO = ({
    title,
    description,
    keywords,
    image,
    noindex = false,
    structuredData,
}) => {
    const { t, language } = useLanguage();
    const { pathname } = useLocation();

    const pageTitle = title || t('meta_title');
    const pageDescription = description || t('meta_description');
    const pageKeywords = keywords || t('meta_keywords');
    const ogTitle = title || t('og_title');
    const ogDescription = description || t('og_description');
    const ogImage = image || `${SITE_URL}/Logo/new-logo.png`;
    const canonical = `${SITE_URL}${pathname === '/' ? '' : pathname}`;

    const orgSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'Bogot Master Licorice Export',
        'url': SITE_URL,
        'logo': `${SITE_URL}/Logo/new-logo.png`,
        'description': t('schema_description'),
        'address': {
            '@type': 'PostalAddress',
            'streetAddress': 'Bogot district',
            'addressLocality': 'Khorezm region',
            'addressCountry': 'UZ',
            'postalCode': '220204',
        },
        'contactPoint': {
            '@type': 'ContactPoint',
            'telephone': '+998995129826',
            'contactType': 'sales',
            'areaServed': ['US', 'EU', 'CN', 'KR', 'JP', 'IN'],
            'availableLanguage': ['English', 'Russian'],
        },
        'sameAs': [],
    };

    return (
        <Helmet>
            <html lang={language} />
            <title>{pageTitle}</title>
            <meta name='description' content={pageDescription} />
            <meta name='keywords' content={pageKeywords} />
            <link rel='canonical' href={canonical} />
            {noindex && <meta name='robots' content='noindex, follow' />}

            {/* Open Graph */}
            <meta property='og:type' content='website' />
            <meta property='og:title' content={ogTitle} />
            <meta property='og:description' content={ogDescription} />
            <meta property='og:url' content={canonical} />
            <meta property='og:image' content={ogImage} />

            {/* Twitter */}
            <meta name='twitter:card' content='summary_large_image' />
            <meta name='twitter:title' content={ogTitle} />
            <meta name='twitter:description' content={ogDescription} />
            <meta name='twitter:image' content={ogImage} />

            {/* Organization structured data (every page) */}
            <script type='application/ld+json'>{JSON.stringify(orgSchema)}</script>

            {/* Optional page-specific structured data (e.g. Product) */}
            {structuredData && (
                <script type='application/ld+json'>{JSON.stringify(structuredData)}</script>
            )}
        </Helmet>
    );
};

export default SEO;
