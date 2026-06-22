import { useState } from 'react';
import './Hero.css';
import PriceModal from './PriceModal';
import { useLanguage } from '../context/LanguageContext';
import { useContent } from '../context/ContentContext';

const Hero = ({ addToast }) => {
    const { t } = useLanguage();
    const { settings } = useContent();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const title = settings?.hero_title || t('hero_title');
    const subtitle = settings?.hero_subtitle || t('hero_subtitle');
    const cta = settings?.hero_cta || t('hero_cta');

    return (
        <section className="hero" id="home">
            <div className="hero-content">
                <h1>{title}</h1>
                <p>{subtitle}</p>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    {cta}
                </button>
            </div>
            <div className="hero-image">
                <img src="/images/hero-bg-new.webp" alt={t('hero_image_alt')} fetchPriority="high" decoding="async" />
            </div>

            <PriceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                productTitle={t('hero_modal_title')}
                addToast={addToast}
            />
        </section>
    );
};

export default Hero;
