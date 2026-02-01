import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { language, switchLanguage, t } = useLanguage();

    const toggleLanguage = () => {
        switchLanguage(language === 'ru' ? 'en' : 'ru');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-logo">
                    <img src="/images/B5-logo.png" alt="Feruz Logo" />
                </div>
                <div className={`navbar-links ${isOpen ? 'active' : ''}`}>
                    <a href="#home" onClick={() => setIsOpen(false)}>{t('home')}</a>
                    <a href="#products" onClick={() => setIsOpen(false)}>{t('products')}</a>
                    <a href="#about" onClick={() => setIsOpen(false)}>{t('about')}</a>
                    <a href="#contact" onClick={() => setIsOpen(false)}>{t('contact')}</a>
                    <button className="lang-btn-mobile" onClick={toggleLanguage}>
                        {t('langBtn')}
                    </button>
                </div>
                <div className="navbar-cta-container">
                    <button className="lang-btn" onClick={toggleLanguage}>
                        {t('langBtn')}
                    </button>
                    <a href="#contact" className="btn-contact">{t('contactBtn')}</a>
                </div>
                <div className={`navbar-toggle ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
