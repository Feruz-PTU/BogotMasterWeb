import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './About.css';
import PriceModal from './PriceModal';

const About = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { t } = useLanguage();

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <section className="about-section" id="about">
            <div className="about-container">
                <div className="about-header">
                    <h2>{t('about_title')}</h2>
                </div>
                <div className="about-content">
                    <div className="about-images">
                        {/* Implied collage structure */}
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
                    <div className="about-text">
                        <div className="about-description">
                            <p>{t('about_p1')}</p>
                            <p>{t('about_p2')}</p>
                            <p>{t('about_p3')}</p>
                            <p>{t('about_p4')}</p>
                        </div>
                        <ul className="about-benefits">
                            <li>
                                <span className="check-icon">✓</span>
                                {t('about_benefit_1')}
                            </li>
                            <li>
                                <span className="check-icon">✓</span>
                                {t('about_benefit_2')}
                            </li>
                            <li>
                                <span className="check-icon">✓</span>
                                {t('about_benefit_3')}
                            </li>
                            <li>
                                <span className="check-icon">✓</span>
                                {t('about_benefit_4')}
                            </li>
                        </ul>
                        <button className="btn-details" onClick={openModal}>{t('read_more')}</button>
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
