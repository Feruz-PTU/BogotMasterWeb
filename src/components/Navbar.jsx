import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import LocalLink, { LocalNavLink } from './LocalLink';
import { LIVE_LANGUAGES, localizedPath, parsePathname } from '../i18n/languages';
import { routeInLanguage } from '../content/routeInLanguage';
import { menuGroups, groupIsActive } from '../content/navigation';
import { LOGO } from '../utils/siteImages';
import './Navbar.css';

const Chevron = ({ open }) => (
    <svg className={`chevron-icon ${open ? 'rotate' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    // The open menu group (Applications, Resources…), or null.
    const [openGroup, setOpenGroup] = useState(null);
    const { language, t } = useLanguage();
    const { pathname } = useLocation();
    const langDropdownRef = useRef(null);
    const langButtonRef = useRef(null);
    const toggleRef = useRef(null);
    const linksRef = useRef(null);
    const groupButtons = useRef({});

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
            // A desktop dropdown closes on a click anywhere outside it.
            if (openGroup && !event.target.closest?.(`[data-nav-group="${openGroup}"]`)) {
                setOpenGroup(null);
            }
        };
        const handleKey = (event) => {
            if (event.key !== 'Escape') return;
            if (langDropdownOpen) {
                setLangDropdownOpen(false);
                langButtonRef.current?.focus();
            } else if (openGroup) {
                const button = groupButtons.current[openGroup];
                setOpenGroup(null);
                button?.focus();
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
    }, [langDropdownOpen, isOpen, openGroup]);

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const close = () => {
        setIsOpen(false);
        setLangDropdownOpen(false);
        setOpenGroup(null);
    };

    // The links of one open group, for the arrow keys.
    const groupLinks = (id) => [...(linksRef.current?.querySelectorAll(`#nav-group-${id} a`) || [])];

    const openAndFocus = (id, which) => {
        setOpenGroup(id);
        // The list renders on this update; focus it on the next tick.
        setTimeout(() => {
            const links = groupLinks(id);
            (which === 'last' ? links[links.length - 1] : links[0])?.focus();
        }, 0);
    };

    // Arrow keys on a group's button open it; inside the list they move
    // between its links. Escape is handled above.
    const onGroupKeyDown = (event, id) => {
        const links = groupLinks(id);
        const index = links.indexOf(document.activeElement);
        if (event.target === groupButtons.current[id]) {
            if (event.key === 'ArrowDown') { event.preventDefault(); openAndFocus(id, 'first'); }
            if (event.key === 'ArrowUp') { event.preventDefault(); openAndFocus(id, 'last'); }
            return;
        }
        if (index === -1) return;
        const move = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: links.length - 1 }[event.key];
        if (move === undefined) return;
        event.preventDefault();
        links[(move + links.length) % links.length].focus();
    };

    // Leaving a group with Tab closes it.
    const onGroupBlur = (event, id) => {
        if (openGroup === id && !event.currentTarget.contains(event.relatedTarget)) setOpenGroup(null);
    };

    const currentLang =
        LIVE_LANGUAGES.find((l) => l.code === language) || LIVE_LANGUAGES[0];

    // The same page in another language. Parsed from the real URL so the
    // switcher keeps you on the page you are reading instead of dumping you
    // on the home page.
    const parsed = parsePathname(pathname);
    const currentRoutePath = parsed?.routePath || '/';
    const groups = menuGroups(language, t);

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${isOpen ? 'menu-open' : ''}`}
             aria-label={t('nav_main')}>
            <div className="navbar-container">
                <div className="navbar-logo">
                    <LocalLink to="/" onClick={close}>
                        {/* 40-50 px tall: a 3-8 KB copy instead of the 26 KB
                            904 px PNG, which loaded at high priority beside
                            each page's main image (folder 27). */}
                        <img
                            alt={t('nav_home_logo_alt')}
                            width="904"
                            height="904"
                            sizes="50px"
                            srcSet={LOGO.srcSet}
                            src={LOGO.src}
                        />
                    </LocalLink>
                </div>

                {/* Built from the pages registry (content/navigation.js): a
                    group with one page is a link, with more a dropdown that
                    opens on click or with the keyboard; on phones the same
                    groups open as an accordion. */}
                <div id="primary-navigation" ref={linksRef} className={`navbar-links ${isOpen ? 'active' : ''}`}>
                    {groups.map((g) => {
                        if (g.items.length === 1) {
                            return (
                                <LocalNavLink key={g.id} to={g.items[0].to} onClick={close}>
                                    {g.label}
                                </LocalNavLink>
                            );
                        }
                        const open = openGroup === g.id;
                        return (
                            <div
                                key={g.id}
                                className={`nav-group ${open ? 'open' : ''}`}
                                data-nav-group={g.id}
                                onKeyDown={(e) => onGroupKeyDown(e, g.id)}
                                onBlur={(e) => onGroupBlur(e, g.id)}
                            >
                                <button
                                    type="button"
                                    ref={(el) => { groupButtons.current[g.id] = el; }}
                                    className={`nav-group-btn ${groupIsActive(g, currentRoutePath) ? 'active' : ''}`}
                                    aria-expanded={open}
                                    aria-controls={`nav-group-${g.id}`}
                                    onClick={() => setOpenGroup(open ? null : g.id)}
                                >
                                    {g.label}
                                    <Chevron open={open} />
                                </button>
                                <ul id={`nav-group-${g.id}`} className="nav-group-menu" hidden={!open}>
                                    {g.items.map((i) => (
                                        <li key={i.to}>
                                            <LocalNavLink to={i.to} onClick={close}>{i.label}</LocalNavLink>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                    {/* The Contact button is hidden on phones; the menu has it there. */}
                    <LocalNavLink to="/contact" onClick={close} className="nav-mobile-only">{t('contact')}</LocalNavLink>
                </div>

                <div className="navbar-cta-container">
                    <div className="lang-dropdown-container" ref={langDropdownRef}>
                        <button
                            ref={langButtonRef}
                            type="button"
                            className={`lang-dropdown-btn ${langDropdownOpen ? 'active' : ''}`}
                            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                            aria-expanded={langDropdownOpen}
                            aria-controls="lang-menu"
                            aria-haspopup="true"
                        >
                            {/* Visually-hidden text rather than aria-label: an
                                aria-label of "Select language" REPLACED the
                                visible "EN", so voice-control users saying
                                "click EN" could not activate it. This way the
                                accessible name contains the visible text. */}
                            <span className="sr-only">{t('nav_select_language')}</span>
                            <span className="lang-code-current">
                                {currentLang.label}
                            </span>
                            <Chevron open={langDropdownOpen} />
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
                                        to={localizedPath(lang.code, routeInLanguage(currentRoutePath, lang.code))}
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
