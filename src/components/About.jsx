import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './About.css';
import PriceModal from './PriceModal';

const CheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="check-svg">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const About = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { t } = useLanguage();

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <section className="about-section reveal" id="about">
            <div className="about-container">
                <div className="about-header reveal">
                    <h2>{t('about_title')}</h2>
                </div>
                <div className="about-content">
                    <div className="about-images reveal reveal-delay-1">
                        <div className="image-main">
                            <img src="/images/image16.png" alt={t('about_img_1')} loading="lazy" />
                        </div>
                        <div className="image-secondary">
                            <img src="/images/image17.png" alt={t('about_img_2')} loading="lazy" />
                        </div>
                        <div className="image-tertiary">
                            <img src="/images/image18.png" alt={t('about_img_3')} loading="lazy" />
                        </div>
                    </div>
                    <div className="about-text reveal reveal-delay-2">
                        <div className="about-description">
                            <p>{t('about_p1')}</p>
                            <p>{t('about_p2')}</p>
                            <p>{t('about_p3')}</p>
                            <p>{t('about_p4')}</p>
                        </div>
                        <ul className="about-benefits">
                            <li>
                                <CheckIcon />
                                {t('about_benefit_1')}
                            </li>
                            <li>
                                <CheckIcon />
                                {t('about_benefit_2')}
                            </li>
                            <li>
                                <CheckIcon />
                                {t('about_benefit_3')}
                            </li>
                            <li>
                                <CheckIcon />
                                {t('about_benefit_4')}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <PriceModal
                isOpen={isModalOpen}
                onClose={closeModal}
                productTitle={t('consultation_title')}
            />
        </section>
    );
};

export default About;
