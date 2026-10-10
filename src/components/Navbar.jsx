import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import LocalLink, { LocalNavLink } from './LocalLink';
import { LIVE_LANGUAGES, localizedPath, parsePathname } from '../i18n/languages';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const { language, t } = useLanguage();
    const { pathname } = useLocation();
    const langDropdownRef = useRef(null);
    const langButtonRef = useRef(null);
    const toggleRef = useRef(null);

    useEffect(() => {
        // passive: the handler only reads scrollY, so the browser never has to
        // wait on it before compositing a scroll frame.
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                langDropdownRef.current &&
                !langDropdownRef.current.contains(event.target)
            ) {
                setLangDropdownOpen(false);
            }
        };
        const handleKey = (event) => {
            if (event.key !== 'Escape') return;
            if (langDropdownOpen) {
                setLangDropdownOpen(false);
                langButtonRef.current?.focus();
            } else if (isOpen) {
                setIsOpen(false);
                toggleRef.current?.focus();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, [langDropdownOpen, isOpen]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const close = () => {
        setIsOpen(false);
        setLangDropdownOpen(false);
    };

    const currentLang =
        LIVE_LANGUAGES.find((l) => l.code === language) || LIVE_LANGUAGES[0];

    // The same page in another language. Parsed from the real URL so the
    // switcher keeps you on the page you are reading instead of dumping you
    // on the home page.
    const parsed = parsePathname(pathname);
    const currentRoutePath = parsed?.routePath || '/';

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${isOpen ? 'menu-open' : ''}`}
             aria-label={t('nav_main')}>
            <div className="navbar-container">
                <div className="navbar-logo">
                    <LocalLink to="/" onClick={close}>
                        <img
                            src="/Logo/new-logo.png"
                            alt={t('nav_home_logo_alt')}
                            width="904"
                            height="904"
                        />
                    </LocalLink>
                </div>

                <div id="primary-navigation" className={`navbar-links ${isOpen ? 'active' : ''}`}>
                    <LocalNavLink to="/" onClick={close}>{t('home')}</LocalNavLink>
                    <LocalNavLink to="/products" onClick={close}>{t('products')}</LocalNavLink>
                    <LocalNavLink to="/about" onClick={close}>{t('about')}</LocalNavLink>
                    <LocalNavLink to="/contact" onClick={close}>{t('contact')}</LocalNavLink>
                </div>

                <div className="navbar-cta-container">
                    <div className="lang-dropdown-container" ref={langDropdownRef}>
                        <button
                            ref={langButtonRef}
                            type="button"
                            className={`lang-dropdown-btn ${langDropdownOpen ? 'active' : ''}`}
                            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                            aria-label={t('nav_select_language')}
                            aria-expanded={langDropdownOpen}
                            aria-controls="lang-menu"
                            aria-haspopup="true"
                        >
                            <span className="lang-code-current">
                                {currentLang.label}
                            </span>
                            <svg className={`chevron-icon ${langDropdownOpen ? 'rotate' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>

                        {langDropdownOpen && (
                            <div className="lang-dropdown-menu" id="lang-menu">
                                {/* Real links, not buttons. The language used to
                                    be a click handler that changed state but not
                                    the URL, so there was no English page for a
                                    search engine to find or for anyone to share. */}
                                {LIVE_LANGUAGES.map((lang) => (
                                    <Link
                                        key={lang.code}
                                        to={localizedPath(lang.code, currentRoutePath)}
                                        hrefLang={lang.htmlLang}
                                        lang={lang.htmlLang}
                                        className={`lang-dropdown-item ${language === lang.code ? 'selected' : ''}`}
                                        aria-current={language === lang.code ? 'true' : undefined}
                                        onClick={close}
                                    >
                                        <span className="lang-label-full">{lang.name}</span>
                                        <span className="lang-code-short">{lang.label}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                    <LocalLink to="/contact" className="btn-contact" onClick={close}>
                        {t('contactBtn')}
                    </LocalLink>
                </div>

                {/* Was a <div onClick>: no role, no tabindex, no keyboard
                    handler and no accessible name, which made the entire
                    mobile navigation unreachable without a mouse. */}
                <button
                    ref={toggleRef}
                    type="button"
                    className={`navbar-toggle ${isOpen ? 'active' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label={isOpen ? t('nav_close_menu') : t('nav_open_menu')}
                    aria-expanded={isOpen}
                    aria-controls="primary-navigation"
                >
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
