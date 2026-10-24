import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Markdown, { InlineMarkdown } from './Markdown';
import { useLanguage } from '../context/LanguageContext';
import { useContent } from '../context/ContentContext';
import { useRequest } from '../context/RequestContext';
import { localizedPath } from '../i18n/languages';
import { pageByPath, pageName } from '../content/pages';
import { FAQ_GROUPS } from '../utils/faq';
import { FAQ_EMBED_ID } from '../utils/faqData';
import { formatDate } from '../utils/dates';
import { SITE_URL, faqPageGraph, safeJsonLd } from '../seo/schema';
import './FaqList.css';

/** Case and accents do not matter: "Peeled" finds "peeled", "ё" finds "е". */
const fold = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** An answer's Markdown as plain words, for the search. */
const plainText = (md) => md.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`\\]/g, '');

/** The pages a "Read more" link may name without a label of its own. */
const STATIC_PAGE_KEYS = { '/request': 'request_h1', '/products': 'products', '/about': 'about', '/contact': 'contact', '/articles': 'articles' };

/**
 * The FAQ page's answers (the FAQ table, through src/data/build-faq.json):
 * every answer is in the prerendered HTML inside a <details>, grouped under
 * the five group headings, so the page reads without JavaScript. With it:
 * a search box and group chips (search terms are never stored or sent), an
 * anchor per answer that opens it (/faq#samples), a "Copy link" button, and
 * a "no answer" state that opens the request form with the question in it.
 *
 * `items`: the answers in this language (utils/faqData.js), or null while
 * they download.
 */
const FaqList = ({ items }) => {
    const { t, language } = useLanguage();
    const { products } = useContent();
    const { openRequest } = useRequest();
    const uid = useId();
    const [query, setQuery] = useState('');
    const [group, setGroup] = useState('all');
    const [copied, setCopied] = useState(null);
    const [flash, setFlash] = useState(null);
    const timers = useRef({});

    useEffect(() => {
        const pending = timers.current;
        return () => Object.values(pending).forEach(clearTimeout);
    }, []);
    // One timer per name: a new call restarts it.
    const later = useCallback((name, fn, ms) => {
        clearTimeout(timers.current[name]);
        timers.current[name] = setTimeout(fn, ms);
    }, []);

    // /faq#samples opens that answer, scrolls to it and marks it briefly;
    // /faq#group-quality scrolls to the group. Also when the anchor changes
    // later (a link inside the page, the back button).
    useEffect(() => {
        if (!items) return undefined;
        const openFromHash = () => {
            let id = '';
            try {
                id = decodeURIComponent(window.location.hash.slice(1));
            } catch {
                return;
            }
            const el = id && document.getElementById(id);
            if (!el) return;
            if (el.tagName === 'DETAILS') {
                el.open = true;
                setFlash(id);
                later('flash', () => setFlash(null), 2500);
            }
            // Directly (see MarkdownBody): the answers are already in the page.
            el.scrollIntoView({ block: 'start' });
        };
        openFromHash();
        window.addEventListener('hashchange', openFromHash);
        return () => window.removeEventListener('hashchange', openFromHash);
    }, [items, later]);

    const searchable = useMemo(
        () => new Map((items || []).map((i) => [i.slug, fold(`${i.q} ${plainText(i.a)}`)])),
        [items],
    );

    if (!items) {
        return <p className="faq-loading" role="status">{t('faq_loading')}</p>;
    }
    if (!items.length) {
        return <p className="faq-none">{t('faq_none')}</p>;
    }

    const canonical = `${SITE_URL}${localizedPath(language, '/faq')}`;
    const terms = fold(query).split(/\s+/).filter(Boolean);
    const matches = (i) =>
        (group === 'all' || i.group === group) && terms.every((term) => searchable.get(i.slug).includes(term));
    const visible = items.filter(matches);
    const filtering = terms.length > 0 || group !== 'all';
    const groups = FAQ_GROUPS.filter((g) => items.some((i) => i.group === g.id));
    const sections = groups
        .map((g) => ({ ...g, items: visible.filter((i) => i.group === g.id) }))
        .filter((s) => s.items.length);

    // "1 answer", "2 answers"; Russian has three forms (1 ответ, 2 ответа, 5 ответов).
    const plural = new Intl.PluralRules(language).select(visible.length);
    const countText = t(`faq_results_${plural}`).replace('{n}', visible.length);

    const linkLabel = ({ to, label }) => {
        if (label) return label;
        const path = to.split(/[?#]/)[0];
        const page = pageByPath(path);
        if (page) return pageName(page, language);
        const product = path.match(/^\/products\/([^/]+)$/);
        if (product) {
            const p = products.find((x) => x.slug === product[1]);
            if (p) return p.title;
        }
        return STATIC_PAGE_KEYS[path] ? t(STATIC_PAGE_KEYS[path]) : to;
    };

    // Plain links, not router links, so the browser goes to the #anchor.
    const linkHref = (to) => (to.startsWith('/') ? localizedPath(language, to) : to);

    const copyLink = (e, slug) => {
        const url = `${window.location.origin}${localizedPath(language, '/faq')}#${slug}`;
        // Without the clipboard (an old browser, a plain-http preview) the
        // link simply goes to the anchor, and the address bar holds the link.
        if (!navigator.clipboard?.writeText) return;
        e.preventDefault();
        navigator.clipboard.writeText(url).then(
            () => {
                window.history.replaceState(window.history.state, '', `#${slug}`);
                setCopied(slug);
                later('copied', () => setCopied(null), 2500);
            },
            () => {
                window.location.hash = slug;
            },
        );
    };

    return (
        <div className="faq">
            {/* The answers for the browser to read back (utils/faqData.js),
                and the questions as structured data. */}
            <script
                type="application/json"
                id={FAQ_EMBED_ID}
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: safeJsonLd({ language, items }) }}
            />
            <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: safeJsonLd(faqPageGraph({ canonical, items })) }}
            />

            <div className="faq-tools">
                <label className="faq-search-label" htmlFor={`${uid}-search`}>{t('faq_search_label')}</label>
                <input
                    id={`${uid}-search`}
                    className="faq-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('faq_search_placeholder')}
                    autoComplete="off"
                    spellCheck={false}
                />
                <div className="faq-chips" role="group" aria-label={t('faq_groups_label')}>
                    <button type="button" className="faq-chip" aria-pressed={group === 'all'} onClick={() => setGroup('all')}>
                        {t('faq_chip_all')}
                    </button>
                    {groups.map((g) => (
                        <button key={g.id} type="button" className="faq-chip" aria-pressed={group === g.id} onClick={() => setGroup(g.id)}>
                            {t(`faq_chip_${g.id}`)}
                        </button>
                    ))}
                </div>
                <p className="faq-count" role="status" aria-live="polite">
                    {filtering ? countText : ''}
                </p>
            </div>

            {sections.map((section) => (
                <section key={section.id} className="faq-group" aria-labelledby={`group-${section.id}`}>
                    <h2 id={`group-${section.id}`}>{t(`faq_group_${section.id}`)}</h2>
                    {section.items.map((item) => (
                        <details
                            key={item.slug}
                            id={item.slug}
                            className={`faq-item${flash === item.slug ? ' is-flash' : ''}`}
                            // A search opens what it finds; otherwise the
                            // visitor (or the anchor) opens and closes them.
                            open={terms.length ? true : undefined}
                        >
                            <summary>
                                <span className="faq-q"><InlineMarkdown text={item.q} /></span>
                            </summary>
                            <div className="faq-a">
                                <Markdown source={item.a} />
                                <div className="faq-foot">
                                    {item.links.length > 0 && (
                                        <p className="faq-more">
                                            {t('faq_read_more')}{' '}
                                            {item.links.map((link, n) => (
                                                <span key={link.to}>
                                                    {n > 0 && ' · '}
                                                    <a
                                                        href={linkHref(link.to)}
                                                        {...(link.to.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                                    >
                                                        {linkLabel(link)}
                                                    </a>
                                                </span>
                                            ))}
                                        </p>
                                    )}
                                    <p className="faq-meta">
                                        {item.updated && (
                                            <span>
                                                {t('content_updated')}{' '}
                                                <time dateTime={item.updated}>{formatDate(item.updated, language)}</time>
                                            </span>
                                        )}
                                        <a className="faq-copy" href={`#${item.slug}`} onClick={(e) => copyLink(e, item.slug)}>
                                            {copied === item.slug ? t('faq_link_copied') : t('faq_copy_link')}
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </details>
                    ))}
                </section>
            ))}

            {visible.length === 0 && (
                <div className="faq-empty">
                    <p>{terms.length ? t('faq_no_results').replace('{q}', query.trim()) : t('faq_no_results_group')}</p>
                    <button
                        type="button"
                        className="faq-ask"
                        onClick={() => openRequest({ type: 'other', message: query.trim() })}
                    >
                        {t('faq_ask_btn')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default FaqList;
