import React, { useState, useEffect } from 'react';
import './FeaturedGallery.css';

import { useLanguage } from '../context/LanguageContext';

const FeaturedGallery = () => {
    const { t } = useLanguage();
    const [images, setImages] = useState([]);

    useEffect(() => {
        // Create array of correct image paths from public folder
        const imagePaths = Array.from({ length: 14 }, (_, i) => `/gallary photos/${i}.jpg`);

        // Shuffle functionality
        const shuffleArray = (array) => {
            const newArray = [...array];
            for (let i = newArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
            }
            return newArray;
        };

        setImages(shuffleArray(imagePaths));
    }, []);

    return (
        <section id="gallery" className="featured-gallery-section">
            <div className="gallery-header">
                <h2>{t('gallery_title')}</h2>
            </div>
            <div className="featured-gallery-grid">
                {images.map((src, index) => (
                    <div key={index} className="featured-gallery-card">
                        <div className="card-image">
                            <img src={src} alt={`Gallery item ${index}`} loading="lazy" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FeaturedGallery;
