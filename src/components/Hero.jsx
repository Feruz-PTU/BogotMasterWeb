import React, { useState } from 'react';
import './Hero.css';
import PriceModal from './PriceModal';

import { useLanguage } from '../context/LanguageContext';

const Hero = () => {
    const { t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <section className="hero" id="home">
            <div className="hero-content">
                <h1>{t('hero_title')}</h1>
                <p>{t('hero_subtitle')}</p>
                <button className="btn-primary" onClick={openModal}>{t('hero_cta')}</button>
            </div>
            <div className="hero-image">
                <img src="/images/hero-bg-new.webp" alt={t('hero_image_alt')} />
            </div>

            <PriceModal
                isOpen={isModalOpen}
                onClose={closeModal}
                productTitle={t('hero_modal_title')}
            />
        </section>
    );
};

export default Hero;
