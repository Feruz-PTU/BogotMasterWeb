import { useMemo, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import './FeaturedGallery.css';
import Skeleton from './Skeleton';
import { useLanguage } from '../context/LanguageContext';
import { useContent } from '../context/ContentContext';

const FeaturedGallery = () => {
    const { t } = useLanguage();
    const { gallery, loading } = useContent();
    const containerRef = useRef(null);
    const [progress, setProgress] = useState(10); // Start with at least 10% progress

    const [activeImage, setActiveImage] = useState(null);

    const shuffled = useMemo(() => {
        if (!gallery) return [];
        const arr = [...gallery];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }, [gallery]);

    // Handle Lightbox Navigation
    const handleNextImage = (e) => {
        if (e) e.stopPropagation();
        const idx = shuffled.indexOf(activeImage);
        if (idx !== -1) {
            setActiveImage(shuffled[(idx + 1) % shuffled.length]);
        }
    };

    const handlePrevImage = (e) => {
        if (e) e.stopPropagation();
        const idx = shuffled.indexOf(activeImage);
        if (idx !== -1) {
            setActiveImage(shuffled[(idx - 1 + shuffled.length) % shuffled.length]);
        }
    };

    // Body scroll locking and keyboard navigation
    useEffect(() => {
        if (activeImage) {
            document.body.style.overflow = 'hidden';

            const handleKeyDown = (e) => {
                if (e.key === 'Escape') setActiveImage(null);
                if (e.key === 'ArrowRight') handleNextImage();
                if (e.key === 'ArrowLeft') handlePrevImage();
            };

            window.addEventListener('keydown', handleKeyDown);
            return () => {
                document.body.style.overflow = '';
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [activeImage, shuffled]);

    // Track scroll position to update the progress bar

    // Track scroll position to update the progress bar
    const handleScroll = () => {
        const container = containerRef.current;
        if (!container) return;

        const scrollLeft = container.scrollLeft;
        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        if (maxScrollLeft <= 0) return;

        // Calculate progress percentage (from 10% to 100%)
        const currentProgress = 10 + (scrollLeft / maxScrollLeft) * 90;
        setProgress(currentProgress);
    };

    // Auto-sliding interval
    useEffect(() => {
        const container = containerRef.current;
        if (!container || shuffled.length === 0) return;

        let intervalId;
        let timeoutId;

        const startAutoSlide = () => {
            intervalId = setInterval(() => {
                if (window.innerWidth > 768) return; // Only on mobile slider

                const cards = container.querySelectorAll('.featured-gallery-card');
                if (cards.length === 0) return;

                const cardWidth = cards[0].offsetWidth + 16; // Width + gap (16px)
                const maxScrollLeft = container.scrollWidth - container.clientWidth;

                let nextScroll = container.scrollLeft + cardWidth;
                
                // Wrap around smoothly to 0 if at the end
                if (nextScroll >= maxScrollLeft + 5) {
                    nextScroll = 0;
                }

                container.scrollTo({
                    left: nextScroll,
                    behavior: 'smooth'
                });
            }, 3500); // Slide every 3.5 seconds
        };

        startAutoSlide();

        // Pause auto-sliding on touch or scroll interaction
        const handleInteraction = () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            // Resume auto-sliding after 6 seconds of inactivity
            timeoutId = setTimeout(startAutoSlide, 6000);
        };

        container.addEventListener('touchstart', handleInteraction, { passive: true });
        container.addEventListener('mousedown', handleInteraction, { passive: true });

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            if (container) {
                container.removeEventListener('touchstart', handleInteraction);
                container.removeEventListener('mousedown', handleInteraction);
            }
        };
    }, [shuffled.length]);

    if (loading) {
        return (
            <section id="gallery" className="featured-gallery-section">
                <div className="gallery-header">
                    <h2>{t('gallery_title')}</h2>
                </div>
                <div className="featured-gallery-grid">
                    {Array(8).fill(0).map((_, i) => (
                        <div key={i} className="featured-gallery-card">
                            <Skeleton type="rect" style={{ height: '100%', aspectRatio: '1', borderRadius: '12px' }} />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (!shuffled.length) return null;

    return (
        <section id="gallery" className="featured-gallery-section">
            <div className="gallery-header">
                <h2>{t('gallery_title')}</h2>
            </div>
            
            <div className="featured-gallery-slider-wrapper">
                <div 
                    className="featured-gallery-grid"
                    ref={containerRef}
                    onScroll={handleScroll}
                >
                    {shuffled.map((src, index) => (
                        <div 
                            key={index} 
                            className="featured-gallery-card"
                            onClick={() => setActiveImage(src)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="card-image">
                                <img src={src} alt={`${t('gallery_item_alt')} ${index + 1}`} loading="lazy" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Premium Progress Bar (mobile only) */}
            <div className="gallery-progress-container">
                <div 
                    className="gallery-progress-bar" 
                    style={{ width: `${Math.min(100, progress)}%` }}
                />
            </div>

            {/* Lightbox Modal */}
            {activeImage && createPortal(
                <div className="gallery-lightbox" onClick={() => setActiveImage(null)}>
                    <button className="lightbox-close" onClick={() => setActiveImage(null)} aria-label="Close">✕</button>
                    
                    <button className="lightbox-arrow prev" onClick={handlePrevImage} aria-label="Previous image">
                        ‹
                    </button>
                    
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img src={activeImage} alt="Gallery Zoomed View" />
                    </div>
                    
                    <button className="lightbox-arrow next" onClick={handleNextImage} aria-label="Next image">
                        ›
                    </button>
                </div>,
                document.body
            )}
        </section>
    );
};

export default FeaturedGallery;
