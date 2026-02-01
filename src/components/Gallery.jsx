import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Gallery.css';
import PriceModal from './PriceModal';

// Product IDs for translation lookup
const productIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16];

const galleryImages = productIds.map(id => ({
    id: id,
    src: id === 16 ? `/images-new/product-${id}.png` : `/images-new/product-${id}.jpg`,
    translationKey: `product_${id}`
}));

const Gallery = () => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { t } = useLanguage();

    const handlePriceClick = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedProduct(null), 300);
    };

    return (
        <section id="products" className="gallery-section">
            <div className="gallery-header">
                <h2>{t('our_products')}</h2>
            </div>
            <div className="gallery-grid">
                {galleryImages.map((item) => (
                    <div key={item.id} className="gallery-card-item">
                        <div className="gallery-card-image">
                            <img src={item.src} alt={t(`${item.translationKey}_title`)} loading="lazy" />
                        </div>
                        <div className="gallery-card-content">
                            <h3>{t(`${item.translationKey}_title`)}</h3>
                            <p>{t(`${item.translationKey}_desc`)}</p>
                            <button
                                className="btn-price"
                                onClick={() => handlePriceClick({
                                    ...item,
                                    title: t(`${item.translationKey}_title`)
                                })}
                            >
                                {t('get_price')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <PriceModal
                isOpen={isModalOpen}
                onClose={closeModal}
                productTitle={selectedProduct?.title || ''}
            />
        </section>
    );
};

export default Gallery;
