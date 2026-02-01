import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../context/LanguageContext';

const SEO = () => {
    const { t, language } = useLanguage();

    const title = t('meta_title');
    const description = t('meta_description');
    const keywords = t('meta_keywords');
    const ogTitle = t('og_title');
    const ogDescription = t('og_description');
    const siteUrl = 'https://bogotmaster.org'; // Default production domain
    const image = `${siteUrl}/Logo/B5-logo.png`; // Fallback/Default image

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{title}</title>
            <meta name='description' content={description} />
            <meta name='keywords' content={keywords} />
            <html lang={language} />

            {/* Open Graph tags */}
            <meta property='og:type' content='website' />
            <meta property='og:title' content={ogTitle} />
            <meta property='og:description' content={ogDescription} />
            <meta property='og:url' content={siteUrl} />
            <meta property='og:image' content={image} />

            {/* Twitter Card tags */}
            <meta name='twitter:card' content='summary_large_image' />
            <meta name='twitter:title' content={ogTitle} />
            <meta name='twitter:description' content={ogDescription} />
            <meta name='twitter:image' content={image} />

            <script type='application/ld+json'>
                {JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'Organization',
                    'name': 'Bogot Master Licorice Export',
                    'url': siteUrl,
                    'logo': image,
                    'description': t('schema_description'),
                    'address': {
                        '@type': 'PostalAddress',
                        'streetAddress': 'Bogot district',
                        'addressLocality': 'Khorezm region',
                        'addressCountry': 'UZ',
                        'postalCode': '220204'
                    },
                    'contactPoint': {
                        '@type': 'ContactPoint',
                        'telephone': '+998995052040',
                        'contactType': 'sales',
                        'areaServed': ['US', 'EU', 'CN', 'KR', 'JP', 'IN'],
                        'availableLanguage': ['English', 'Russian', 'Uzbek']
                    },
                    'sameAs': []
                })}
            </script>
        </Helmet>
    );
};

export default SEO;
