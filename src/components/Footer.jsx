import './Footer.css';
import { useContent } from '../context/ContentContext';
import { useLanguage } from '../context/LanguageContext';
import LocalLink from './LocalLink';
import { track, EVENTS } from '../analytics';
import { telHref, mailtoHref } from '../utils/links';
import { CONTACT_INFO } from '../config';

const Footer = () => {
    const { t } = useLanguage();
    const { settings } = useContent();

    const email = settings?.email || CONTACT_INFO.sales_email;
    const address = settings?.address || '';
    const phones = settings?.phone || [];

    return (
        <footer className="footer reveal">
            <div className="footer-content">
                <div className="footer-logo reveal reveal-delay-1">
                    <LocalLink to="/">
                        <img
                            src="/Logo/new-logo.png"
                            alt={t('nav_home_logo_alt')}
                            width="904"
                            height="904"
                            loading="lazy"
                            decoding="async"
                        />
                    </LocalLink>
                    <p>{t('footer_slogan')}</p>
                </div>
                <div className="footer-links reveal reveal-delay-2">
                    {/* h2, not h4: the outline jumped from h2 straight to h4. */}
                    <h2>{t('footer_quick_links')}</h2>
                    <ul role="list">
                        <li><LocalLink to="/">{t('home')}</LocalLink></li>
                        <li><LocalLink to="/about">{t('about')}</LocalLink></li>
                        <li><LocalLink to="/products">{t('products')}</LocalLink></li>
                        <li><LocalLink to="/logistics">{t('logistics_link')}</LocalLink></li>
                        <li><LocalLink to="/faq">{t('faq_link')}</LocalLink></li>
                        <li><LocalLink to="/articles">{t('articles')}</LocalLink></li>
                        <li><LocalLink to="/contact">{t('contact')}</LocalLink></li>
                        <li><LocalLink to="/privacy">{t('privacy_title')}</LocalLink></li>
                    </ul>
                </div>
                <div className="footer-contact reveal reveal-delay-3">
                    <h2>{t('footer_contact_us')}</h2>
                    <address className="footer-address">
                        <p>{address}</p>
                        {/* The footer carried no phone at all, and the email
                            was plain text rather than a link. */}
                        {phones.map((phone) => (
                            <p key={phone}>
                                <a href={telHref(phone)} onClick={() => track(EVENTS.CLICK_PHONE)}>
                                    {phone}
                                </a>
                            </p>
                        ))}
                        <p>
                            <a href={mailtoHref(email)} onClick={() => track(EVENTS.CLICK_EMAIL)}>
                                {email}
                            </a>
                        </p>
                        <p className="footer-contact-person">
                            {t('sales_contact_name')}
                            <br />
                            <span>{t('sales_contact_languages')}</span>
                            <br />
                            <span>{t('sales_contact_hours')}</span>
                        </p>
                    </address>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Bogot Master. {t('footer_rights')}</p>
                <p className="footer-legal">
                    {t('legal_name_label')}: {CONTACT_INFO.legal_name} ({t('legal_form_note')}) · {t('inn_label')}: {CONTACT_INFO.inn_display}
                </p>
            </div>
        </footer>
    );
};

export default Footer;
