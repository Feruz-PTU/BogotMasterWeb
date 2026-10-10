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
import { render } from '../dist-ssr/entry-server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = join(ROOT, 'dist');
const SITE_URL = 'https://bogotmaster.org';

const content = JSON.parse(
    readFileSync(join(ROOT, 'src/data/build-content.json'), 'utf8')
);

const template = readFileSync(join(DIST, 'index.html'), 'utf8');

if (!template.includes('<div id="root"></div>')) {
    console.error('✖ dist/index.html does not contain <div id="root"></div>.');
    process.exit(1);
}

/** Language-independent route paths that exist for every language. */
const STATIC_ROUTES = ['/', '/products', '/about', '/contact', '/privacy'];

const productRoutes = content.products.map((p) => `/products/${p.slug}`);
const ALL_ROUTES = [...STATIC_ROUTES, ...productRoutes];

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

function buildPage(urlPath) {
    const { html, htmlAttributes, head } = render(urlPath);

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
const written = [];

for (const lang of LIVE_LANGUAGES) {
    for (const routePath of ALL_ROUTES) {
        const urlPath = localizedPath(lang.code, routePath);
        try {
            const page = buildPage(urlPath);
            const rel = writeHtml(urlPath, page);
            written.push(urlPath);
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
    buildPage('/__not_found__'),
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
// themselves, so it can no longer drift out of sync by hand.
const lastmod = new Date().toISOString().slice(0, 10);

const priorityFor = (routePath) => {
    if (routePath === '/') return '1.0';
    if (routePath === '/products') return '0.9';
    if (routePath.startsWith('/products/')) return '0.8';
    if (routePath === '/privacy') return '0.2';
    return '0.7';
};

const urlEntries = [];
for (const lang of LIVE_LANGUAGES) {
    for (const routePath of ALL_ROUTES) {
        const loc = `${SITE_URL}${localizedPath(lang.code, routePath)}`;
        const alternates = [
            ...LIVE_LANGUAGES.map(
                (l) =>
                    `      <xhtml:link rel="alternate" hreflang="${l.htmlLang}" href="${SITE_URL}${localizedPath(l.code, routePath)}"/>`
            ),
            `      <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${localizedPath(DEFAULT_LANGUAGE, routePath)}"/>`,
        ].join('\n');

        urlEntries.push(
            `  <url>\n` +
                `    <loc>${loc}</loc>\n` +
                `${alternates}\n` +
                `    <lastmod>${lastmod}</lastmod>\n` +
                `    <priority>${priorityFor(routePath)}</priority>\n` +
                `  </url>`
        );
    }
}

writeFileSync(
    join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
        `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
        urlEntries.join('\n') +
        `\n</urlset>\n`,
    'utf8'
);
console.log(`✓ sitemap.xml (${urlEntries.length} URLs)`);

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

writeFileSync(
    join(DIST, 'llms.txt'),
    `# Bogot Master\n\n` +
        `> ${t.meta_description || 'Licorice root (Glycyrrhiza glabra) grower, processor and exporter based in Khorezm region, Uzbekistan. Bulk B2B supply.'}\n\n` +
        `Bogot Master is a family-owned company established in ${content.settings?.founded || 2014}, ` +
        `producing and exporting licorice root from Khorezm region, Uzbekistan. ` +
        `Pricing is by quotation only; there are no public prices on this site.\n\n` +
        `## Main pages (English)\n\n` +
        `- [Home](${SITE_URL}/)\n` +
        `- [Products](${SITE_URL}/products)\n` +
        `- [About](${SITE_URL}/about)\n` +
        `- [Contact](${SITE_URL}/contact)\n` +
        `- [Privacy](${SITE_URL}/privacy)\n\n` +
        `## Main pages (Russian)\n\n` +
        `- [Главная](${SITE_URL}/ru)\n` +
        `- [Продукция](${SITE_URL}/ru/products)\n` +
        `- [О компании](${SITE_URL}/ru/about)\n` +
        `- [Контакты](${SITE_URL}/ru/contact)\n\n` +
        `## Products\n\n${productLines}\n\n` +
        `## Contact\n\n` +
        `- Email: ${content.settings?.email || 'bogotmaster@gmail.com'}\n` +
        `- Site: ${SITE_URL}\n`,
    'utf8'
);
console.log('✓ llms.txt');

console.log(`\n✓ Static site ready in dist/ — ${count + 1} HTML files\n`);
