import React from 'react';
import './Partners.css';

import { useLanguage } from '../context/LanguageContext';

const Partners = () => {
    const { t } = useLanguage();
    const partners = [
        {
            id: 1,
            image: '/partner/ChatGPT_Image_Jan_23__2026__08_04_52_PM-removebg-preview.png',
            alt: 'Partner 1'
        },
        {
            id: 2,
            image: '/partner/image_2026-01-23_11-26-02-removebg-preview.png',
            alt: 'Partner 2'
        },
        {
            id: 3,
            image: '/partner/logo-BQHaJWnx.svg',
            alt: 'Partner 3'
        }
    ];

    return (
        <section className="partners-section">
            <h2 className="partners-title">{t('partners_title')}</h2>
            <div className="partners-grid">
                {partners.map((partner) => (
                    <div key={partner.id} className="partner-logo">
                        <img src={partner.image} alt={partner.alt} />
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Partners;
