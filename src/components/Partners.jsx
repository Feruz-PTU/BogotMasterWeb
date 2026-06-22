import './Partners.css';

import { useLanguage } from '../context/LanguageContext';

const Partners = () => {
    const { t } = useLanguage();
    const partners = [
        {
            id: 1,
            image: '/partner/ChatGPT_Image_Jan_23__2026__08_04_52_PM-removebg-preview.png'
        },
        {
            id: 2,
            image: '/partner/image_2026-01-23_11-26-02-removebg-preview.png'
        },
        {
            id: 3,
            image: '/partner/logo-BQHaJWnx.svg'
        }
    ];

    return (
        <section className="partners-section">
            <div className="section-header">
                <span className="section-label">{t('partners_label')}</span>
                <h2 className="section-title">{t('partners_title')}</h2>
            </div>
            <div className="partners-grid">
                {partners.map((partner, index) => (
                    <div key={partner.id} className="partner-logo">
                        <img src={partner.image} alt={`${t('partner_alt')} ${index + 1}`} />
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Partners;
