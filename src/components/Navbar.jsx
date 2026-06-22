import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './Navbar.css';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const { language, languages, switchLanguage, t } = useLanguage();
    const langDropdownRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
                setLangDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const close = () => {
        setIsOpen(false);
        setLangDropdownOpen(false);
    };

    const currentLang = languages.find(l => l.code === language) || languages[0];

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${isOpen ? 'menu-open' : ''}`}>
            <div className="navbar-container">
                <div className="navbar-logo">
                    <Link to="/" onClick={close}>
                        <img src="/Logo/new-logo.png" alt="Bogot Master Logo" />
                    </Link>
                </div>

                <div className={`navbar-links ${isOpen ? 'active' : ''}`}>
                    <NavLink to="/" end onClick={close}>{t('home')}</NavLink>
                    <NavLink to="/products" onClick={close}>{t('products')}</NavLink>
                    <NavLink to="/about" onClick={close}>{t('about')}</NavLink>
                    <NavLink to="/contact" onClick={close}>{t('contact')}</NavLink>
                </div>

                <div className="navbar-cta-container">
                    <div className="lang-dropdown-container" ref={langDropdownRef}>
                        <button 
                            className={`lang-dropdown-btn ${langDropdownOpen ? 'active' : ''}`}
                            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                            aria-label="Select language"
                        >
                            <span className="lang-code-current">{currentLang?.code.toUpperCase()}</span>
                            <svg className={`chevron-icon ${langDropdownOpen ? 'rotate' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                        
                        {langDropdownOpen && (
                            <div className="lang-dropdown-menu">
                                {languages.map(lang => (
                                    <button
                                        key={lang.code}
                                        className={`lang-dropdown-item ${language === lang.code ? 'selected' : ''}`}
                                        onClick={() => {
                                            switchLanguage(lang.code);
                                            setLangDropdownOpen(false);
                                        }}
                                    >
                                        <span className="lang-label-full">{lang.label}</span>
                                        <span className="lang-code-short">{lang.code.toUpperCase()}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <Link to="/contact" className="btn-contact" onClick={close}>
                        {t('contactBtn')}
                    </Link>
                </div>
                <div
                    className={`navbar-toggle ${isOpen ? 'active' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
