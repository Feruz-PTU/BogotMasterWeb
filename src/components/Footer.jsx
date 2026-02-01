import React from 'react';
import './Footer.css';
import { CONTACT_INFO, COMPANY_INFO } from '../config';

import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
    const { t } = useLanguage();
    return (
        <footer className="footer" id="contact">
            <div className="footer-content">
                <div className="footer-logo">
                    <img src="/images/B5-logo.png" alt="Feruz" />
                    <p>{t('footer_slogan')}</p>
                </div>
                <div className="footer-links">
                    <h4>{t('footer_quick_links')}</h4>
                    <ul>
                        <li><a href="#home">{t('home')}</a></li>
                        <li><a href="#about">{t('about')}</a></li>
                        <li><a href="#products">{t('products')}</a></li>
                    </ul>
                </div>
                <div className="footer-contact">
                    <h4>{t('footer_contact_us')}</h4>
                    <p>{CONTACT_INFO.address}</p>
                    <p>{CONTACT_INFO.email}</p>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} {COMPANY_INFO.name}. {t('footer_rights')}</p>
            </div>
        </footer>
    );
};

export default Footer;
