/**
 * Build step 3 of 3 — turn every route into a real HTML file.
 *
 * Reads the client build in dist/ (for the template with the hashed JS/CSS
 * links) and the server build in dist-ssr/ (for the render function), then
 * writes one index.html per route per language, plus 404.html, the admin
 * shell, sitemap.xml and llms.txt.
 *
 * After this runs, dist/ is a plain static site. Vercel serves each file
 * directly, which is what gives unknown URLs a real HTTP 404 instead of the
 * old catch-all 200.
 *
 * Run: node scripts/prerender.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    LIVE_LANGUAGES,
    DEFAULT_LANGUAGE,
    localizedPath,
} from '../src/i18n/languages.js';
import { ARTICLES, articleLanguages } from '../src/content/articles/index.js';
import { render } from '../dist-ssr/entry-server.js';
import {
    STATE_FILE,
    toW3CDate,
    pageFingerprint,
    loadPreviousState,
    resolveLastmod,
    buildSitemapXml,
} from './sitemap.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = join(ROOT, 'dist');
const SITE_URL = 'https://bogotmaster.org';

// Where the previous build left its sitemap state (see sitemap.mjs). The
// override exists so the carry-forward can be exercised against a local
// server instead of the live site.
const STATE_URL =
    process.env.SITEMAP_STATE_URL || `${SITE_URL}/${STATE_FILE}`;

const content = JSON.parse(
    readFileSync(join(ROOT, 'src/data/build-content.json'), 'utf8')
);

const template = readFileSync(join(DIST, 'index.html'), 'utf8');

if (!template.includes('<div id="root"></div>')) {
    console.error('✖ dist/index.html does not contain <div id="root"></div>.');
    process.exit(1);
}

/** Language-independent route paths that exist for every language. */
const STATIC_ROUTES = ['/', '/products', '/about', '/contact', '/privacy', '/articles'];

const productRoutes = content.products.map((p) => `/products/${p.slug}`);
const articleRoutes = ARTICLES.map((a) => `/articles/${a.slug}`);
const ALL_ROUTES = [...STATIC_ROUTES, ...productRoutes, ...articleRoutes];

/**
 * Whether `routePath` has a page in language `code`. Everything does except
 * an article, which exists only in the languages it was written in; building
 * the others would put English text at a Russian URL.
 */
const ARTICLE_LANGUAGES = new Map(
    ARTICLES.map((a) => [`/articles/${a.slug}`, articleLanguages(a)])
);
const existsIn = (routePath, code) =>
    ARTICLE_LANGUAGES.get(routePath)?.includes(code) ?? true;

function writeHtml(urlPath, html) {
    // '/'            -> dist/index.html
    // '/products'    -> dist/products/index.html
    // '/ru/products' -> dist/ru/products/index.html
    const rel = urlPath === '/' ? 'index.html' : join(urlPath.slice(1), 'index.html');
    const out = join(DIST, rel);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html, 'utf8');
    return rel;
}

/** Wrap one rendered route (the result of render()) in the HTML template. */
function buildPage({ html, htmlAttributes, head }) {
    return template
        .replace('<html lang="en">', `<html ${htmlAttributes}>`)
        // Drop the template's placeholder <title>, otherwise the page would
        // ship two of them and crawlers would read the generic one.
        .replace(/\n?\s*<title>[\s\S]*?<\/title>/i, '')
        .replace('</head>', `    ${head}\n  </head>`)
        .replace(
            '<div id="root"></div>',
            `<div id="root" data-prerendered>${html}</div>`
        );
}

console.log('→ Prerendering…');

let count = 0;
/** URL path -> content fingerprint, for the sitemap's lastmod. */
const fingerprints = {};

for (const lang of LIVE_LANGUAGES) {
    for (const routePath of ALL_ROUTES) {
        if (!existsIn(routePath, lang.code)) continue;
        const urlPath = localizedPath(lang.code, routePath);
        try {
            const rendered = render(urlPath);
            const rel = writeHtml(urlPath, buildPage(rendered));
            fingerprints[urlPath] = pageFingerprint(rendered);
            count++;
            if (process.env.VERBOSE) console.log(`   ${urlPath}  ->  ${rel}`);
        } catch (err) {
            console.error(`✖ Failed to prerender ${urlPath}`);
            console.error(err);
            process.exit(1);
        }
    }
}

console.log(`✓ ${count} pages prerendered`);

// ── 404 ──────────────────────────────────────────────────────────────────────
// Vercel serves dist/404.html with a real HTTP 404 for anything that does not
// match a file. Rendering a path that matches no route gives us the NotFound
// page with its noindex tag already in the HTML.
writeFileSync(
    join(DIST, '404.html'),
    buildPage(render('/__not_found__')),
    'utf8'
);
console.log('✓ 404.html');

// ── Admin shell ──────────────────────────────────────────────────────────────
// Deliberately NOT prerendered and with no data-prerendered flag, so React
// mounts normally. vercel.json rewrites /admin/* here and attaches
// X-Robots-Tag: noindex.
writeFileSync(join(DIST, 'admin.html'), template, 'utf8');
console.log('✓ admin.html (not prerendered, noindex via header)');

// ── sitemap.xml ──────────────────────────────────────────────────────────────
// Generated from the same route list and the same language list as the pages
// themselves, so it can no longer drift out of sync by hand. What goes into
// each entry, and why, is explained in sitemap.mjs.
const now = toW3CDate(new Date());
const previous = await loadPreviousState(STATE_URL);
const sitemapState = resolveLastmod(fingerprints, previous.pages, now);

const priorityFor = (routePath) => {
    if (routePath === '/') return '1.0';
    if (routePath === '/products') return '0.9';
    if (routePath.startsWith('/products/')) return '0.8';
    if (routePath === '/privacy') return '0.2';
    if (routePath === '/articles' || routePath.startsWith('/articles/')) return '0.6';
    return '0.7';
};

// Each page is followed by its other-language versions, which is easier to
// read than all of English and then all of Russian. Search engines do not
// care about the order.
const urlEntries = [];
for (const routePath of ALL_ROUTES) {
    for (const lang of LIVE_LANGUAGES) {
        if (!existsIn(routePath, lang.code)) continue;
        const urlPath = localizedPath(lang.code, routePath);
        urlEntries.push({
            loc: `${SITE_URL}${urlPath}`,
            lastmod: sitemapState[urlPath].lastmod,
            priority: priorityFor(routePath),
        });
    }
}

writeFileSync(join(DIST, 'sitemap.xml'), buildSitemapXml(urlEntries), 'utf8');

// The next build fetches this from the live site to learn which pages have
// changed since. It is noindexed by a header in vercel.json.
writeFileSync(
    join(DIST, STATE_FILE),
    JSON.stringify({ generatedAt: now, pages: sitemapState }, null, 2) + '\n',
    'utf8'
);

const changed = urlEntries.filter((e) => e.lastmod === now).length;
console.log(
    previous.reason
        ? `✓ sitemap.xml (${urlEntries.length} URLs, all dated now: no previous state, ${previous.reason})`
        : `✓ sitemap.xml (${urlEntries.length} URLs: ${changed} changed since the live build, ${urlEntries.length - changed} unchanged)`
);

// ── robots.txt ───────────────────────────────────────────────────────────────
writeFileSync(
    join(DIST, 'robots.txt'),
    [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /admin/',
        '',
        `Sitemap: ${SITE_URL}/sitemap.xml`,
        '',
    ].join('\n'),
    'utf8'
);
console.log('✓ robots.txt');

// ── llms.txt ─────────────────────────────────────────────────────────────────
// Plain-text summary for AI crawlers, generated from the live catalogue.
const t = content.translations[DEFAULT_LANGUAGE] || {};
const productLines = content.products
    .map(
        (p) =>
            `- [${p[`title_${DEFAULT_LANGUAGE}`] || p.slug}](${SITE_URL}/products/${p.slug})`
    )
    .join('\n');
const articleLines = ARTICLES.map((a) => {
    const code = a.languages[DEFAULT_LANGUAGE] ? DEFAULT_LANGUAGE : articleLanguages(a)[0];
    return `- [${a.languages[code].title}](${SITE_URL}${localizedPath(code, `/articles/${a.slug}`)})`;
}).join('\n');

writeFileSync(
    join(DIST, 'llms.txt'),
    `# Bogot Master\n\n` +
        `> ${t.meta_description || 'Wild licorice root (Glycyrrhiza glabra) harvester, processor and exporter based in Khorezm region, Uzbekistan. Bulk B2B supply.'}\n\n` +
        `Bogot Master is a family-owned company established in ${content.settings?.founded || 2014}, ` +
        `producing and exporting licorice root from Khorezm region, Uzbekistan. ` +
        `Pricing is by quotation only; there are no public prices on this site.\n\n` +
        `## Main pages (English)\n\n` +
        `- [Home](${SITE_URL}/)\n` +
        `- [Products](${SITE_URL}/products)\n` +
        `- [About](${SITE_URL}/about)\n` +
        `- [Articles](${SITE_URL}/articles)\n` +
        `- [Contact](${SITE_URL}/contact)\n` +
        `- [Privacy](${SITE_URL}/privacy)\n\n` +
        `## Main pages (Russian)\n\n` +
        `- [Главная](${SITE_URL}/ru)\n` +
        `- [Продукция](${SITE_URL}/ru/products)\n` +
        `- [О компании](${SITE_URL}/ru/about)\n` +
        `- [Статьи](${SITE_URL}/ru/articles)\n` +
        `- [Контакты](${SITE_URL}/ru/contact)\n\n` +
        `## Products\n\n${productLines}\n\n` +
        `## Articles\n\n${articleLines}\n\n` +
        `## Contact\n\n` +
        `- Email: ${content.settings?.email || 'feruz@bogotmaster.org'}\n` +
        `- Site: ${SITE_URL}\n`,
    'utf8'
);
console.log('✓ llms.txt');

console.log(`\n✓ Static site ready in dist/ — ${count + 1} HTML files\n`);
