import './Footer.css';
import { useContent } from '../context/ContentContext';
import { useLanguage } from '../context/LanguageContext';
import LocalLink from './LocalLink';
import { track, EVENTS } from '../analytics';
import { telHref, mailtoHref } from '../utils/links';
import { CONTACT_INFO } from '../config';
import { footerGroups } from '../content/navigation';

const Footer = () => {
    const { t, language } = useLanguage();
    const { settings } = useContent();

    const email = settings?.email || CONTACT_INFO.sales_email;
    const address = settings?.address || '';
    const phones = settings?.phone || [];
    // Products, Applications, Quality and shipping, Resources, Company: built
    // from the pages registry (content/navigation.js), so new pages appear here.
    const groups = footerGroups(language, t);

    return (
        <footer className="footer reveal">
            {/* Contact first, its heading level with the link columns; the
                logo sits centred above the legal lines at the bottom. The
                slogan ("Excellence in every detail") was dropped when the
                footer was reorganised on 25 Oct 2026: it told a buyer nothing. */}
            <div className="footer-content">
                <div className="footer-contact reveal reveal-delay-1">
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
                <nav className="footer-nav reveal reveal-delay-2" aria-label={t('footer_nav_label')}>
                    {groups.map((g) => (
                        <div key={g.id} className="footer-links">
                            {/* h2, not h4: the outline jumped from h2 straight to h4. */}
                            <h2>{g.label}</h2>
                            <ul role="list">
                                {g.items.map((i) => (
                                    <li key={i.to}><LocalLink to={i.to}>{i.label}</LocalLink></li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>
            </div>
            <div className="footer-bottom">
                <LocalLink to="/" className="footer-logo">
                    <img
                        src="/Logo/new-logo.png"
                        alt={t('nav_home_logo_alt')}
                        width="904"
                        height="904"
                        loading="lazy"
                        decoding="async"
                    />
                </LocalLink>
                <p>&copy; {new Date().getFullYear()} Bogot Master. {t('footer_rights')}</p>
                <p className="footer-legal">
                    {t('legal_name_label')}: {CONTACT_INFO.legal_name} ({t('legal_form_note')}) · {t('inn_label')}: {CONTACT_INFO.inn_display}
                </p>
            </div>
        </footer>
    );
};

export default Footer;
