// ─────────────────────────────────────────────────────────────────────────────
// THE SINGLE SOURCE OF TRUTH FOR LANGUAGES
//
// To add a new language later (e.g. Uzbek), you change THIS FILE ONLY:
//   1. Add an entry to LIVE_LANGUAGES below.
//   2. Make sure the translation strings for that code exist in Supabase
//      (Admin panel -> Languages / Translations tab).
//   3. Make sure products have title_<code> / desc_<code> filled in.
// Everything else — routes, <html lang>, hreflang tags, the sitemap, the
// language switcher and the 404 behaviour — is generated from this list.
//
// A language that is NOT in this list returns a real 404 at its URL prefix.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Live, publicly reachable languages, in display order.
 *
 * `code`     - language code used in the URL prefix and in the data fields
 *              (title_<code>, desc_<code>) and in <html lang="...">.
 * `label`    - short label shown in the language switcher.
 * `name`     - full endonym, used for the switcher's title attribute.
 * `htmlLang` - the BCP-47 tag for <html lang> and hreflang.
 * `ogLocale` - Open Graph locale.
 * `isDefault`- exactly ONE language must be the default. The default language
 *              lives on the bare URLs (/, /products). Every other language
 *              lives under its own prefix (/ru/, /ru/products).
 */
export const LIVE_LANGUAGES = [
    {
        code: 'en',
        label: 'EN',
        name: 'English',
        htmlLang: 'en',
        ogLocale: 'en_US',
        isDefault: true,
    },
    {
        code: 'ru',
        label: 'RU',
        name: 'Русский',
        htmlLang: 'ru',
        ogLocale: 'ru_RU',
        isDefault: false,
    },
    // To go live with Uzbek later, uncomment and fill the translations:
    // { code: 'uz', label: 'UZ', name: "O'zbek", htmlLang: 'uz', ogLocale: 'uz_UZ', isDefault: false },
];

export const DEFAULT_LANGUAGE =
    LIVE_LANGUAGES.find((l) => l.isDefault)?.code || LIVE_LANGUAGES[0].code;

export const LANGUAGE_CODES = LIVE_LANGUAGES.map((l) => l.code);

/** Codes that appear as a URL prefix (everything except the default). */
export const PREFIXED_LANGUAGE_CODES = LIVE_LANGUAGES.filter(
    (l) => !l.isDefault
).map((l) => l.code);

export const isLiveLanguage = (code) => LANGUAGE_CODES.includes(code);

export const getLanguage = (code) =>
    LIVE_LANGUAGES.find((l) => l.code === code) ||
    LIVE_LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE);

/**
 * Build a URL path for a given language.
 *   localizedPath('en', '/products')  -> '/products'
 *   localizedPath('ru', '/products')  -> '/ru/products'
 *   localizedPath('ru', '/')          -> '/ru'
 * `routePath` is always the canonical, language-independent path with a
 * leading slash and no trailing slash (except the root, which is '/').
 */
export function localizedPath(code, routePath = '/') {
    const clean = routePath === '/' ? '' : routePath.replace(/\/+$/, '');
    if (code === DEFAULT_LANGUAGE) return clean === '' ? '/' : clean;
    return `/${code}${clean}`;
}

/**
 * Inverse of localizedPath: split a real pathname into { lang, routePath }.
 * Returns `null` when the first segment looks like a language prefix but is
 * NOT a live language — the caller must then render a 404, never fall back.
 */
export function parsePathname(pathname) {
    const segments = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);

    if (segments.length === 0) {
        return { lang: DEFAULT_LANGUAGE, routePath: '/' };
    }

    const first = segments[0].toLowerCase();

    // The default language must NOT be reachable under its own prefix,
    // otherwise /en/products and /products would be duplicates.
    if (first === DEFAULT_LANGUAGE) return null;

    if (isLiveLanguage(first)) {
        const rest = segments.slice(1);
        return {
            lang: first,
            routePath: rest.length ? `/${rest.join('/')}` : '/',
        };
    }

    // Looks like a 2-letter language prefix but is not live -> 404, never
    // fall back to English or Russian content.
    if (/^[a-z]{2}(-[a-z]{2})?$/i.test(first) && !KNOWN_TOP_LEVEL_ROUTES.includes(first)) {
        return null;
    }

    return { lang: DEFAULT_LANGUAGE, routePath: `/${segments.join('/')}` };
}

/**
 * Top-level route segments that are NOT languages. Kept here so a future
 * two-letter route (e.g. /qa) is never mistaken for a language prefix.
 */
export const KNOWN_TOP_LEVEL_ROUTES = [
    'products',
    'about',
    'contact',
    'privacy',
    'articles',
    'admin',
];
