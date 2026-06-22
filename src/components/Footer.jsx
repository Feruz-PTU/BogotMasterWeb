import { Link } from 'react-router-dom';
import './Footer.css';
import { useContent } from '../context/ContentContext';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
    const { t } = useLanguage();
    const { settings } = useContent();

    const email = settings?.email || 'bogotmaster@gmail.com';
    const address = settings?.address || '';

    return (
        <footer className="footer reveal">
            <div className="footer-content">
                <div className="footer-logo reveal reveal-delay-1">
                    <Link to="/">
                        <img src="/Logo/new-logo.png" alt="Bogot Master" />
                    </Link>
                    <p>{t('footer_slogan')}</p>
                </div>
                <div className="footer-links reveal reveal-delay-2">
                    <h4>{t('footer_quick_links')}</h4>
                    <ul>
                        <li><Link to="/">{t('home')}</Link></li>
                        <li><Link to="/about">{t('about')}</Link></li>
                        <li><Link to="/products">{t('products')}</Link></li>
                        <li><Link to="/contact">{t('contact')}</Link></li>
                    </ul>
                </div>
                <div className="footer-contact reveal reveal-delay-3">
                    <h4>{t('footer_contact_us')}</h4>
                    <p>{address}</p>
                    <p>{email}</p>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Bogot Master. {t('footer_rights')}</p>
            </div>
        </footer>
    );
};

export default Footer;
