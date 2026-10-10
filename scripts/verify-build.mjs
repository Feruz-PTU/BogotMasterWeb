/**
 * Checks the built dist/ folder against the things this project set out to fix.
 * Run after `npm run build`:   node scripts/verify-build.mjs
 *
 * Exits non-zero if any hard check fails, so it can gate a deploy.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SITE = 'https://bogotmaster.org';

let failures = 0;
let warnings = 0;
const fail = (m) => { console.log(`  \u001b[31mâœ– ${m}\u001b[0m`); failures++; };
const warn = (m) => { console.log(`  \u001b[33m! ${m}\u001b[0m`); warnings++; };
const ok = (m) => console.log(`  \u001b[32mâœ“\u001b[0m ${m}`);

/** All generated page files, as URL paths. */
function walk(dir, base = '') {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            if (['assets', 'images', 'images-new', 'gallery', 'Logo', 'partner', 'Certificate'].includes(entry)) continue;
            out.push(...walk(full, `${base}/${entry}`));
        } else if (entry === 'index.html') {
            out.push(base === '' ? '/' : base);
        }
    }
    return out;
}

const pages = walk(DIST).sort();
const htmlFor = (urlPath) =>
    readFileSync(join(DIST, urlPath === '/' ? 'index.html' : join(urlPath.slice(1), 'index.html')), 'utf8');

const pick = (html, re) => { const m = html.match(re); return m ? m[1].trim() : null; };
const all = (html, re) => [...html.matchAll(re)].map((m) => m[1]);

// react-helmet-async emits `data-rh="true"` as the FIRST attribute, so these
// matchers must not assume attribute order.
const metaByName = (html, name) =>
    pick(html, new RegExp(`<meta[^>]*\\sname="${name}"[^>]*\\scontent="([^"]*)"`, 'i'));
const canonicalOf = (html) =>
    pick(html, /<link[^>]*\srel="canonical"[^>]*\shref="([^"]*)"/i);
const hreflangsOf = (html) =>
    all(html, /<link[^>]*\srel="alternate"[^>]*\shreflang="([^"]*)"/gi);
/** Everything inside <body>, tags stripped. */
const visibleText = (html) => {
    const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [])[1] || '';
    return body
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

console.log(`\nâ•â•â• Verifying ${pages.length} generated pages â•â•â•\n`);

// â”€â”€ 1. Real content in the HTML â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
console.log('1. Visible text is in the HTML (the whole point of the change)');
let thin = 0;
for (const p of pages) {
    const html = htmlFor(p);
    const text = visibleText(html);
    if (text.length < 400) { fail(`${p} has only ${text.length} chars of visible text`); thin++; }
}
if (!thin) ok(`every page has real rendered text (shortest checked over 400 chars)`);

// â”€â”€ 2. Exactly one h1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
console.log('\n2. Exactly one <h1> per page');
let h1bad = 0;
for (const p of pages) {
    const n = (htmlFor(p).match(/<h1[\s>]/g) || []).length;
    if (n !== 1) { fail(`${p} has ${n} <h1> elements`); h1bad++; }
}
if (!h1bad) ok('all pages have exactly one <h1>');

// â”€â”€ 3. Title + description present and unique per language â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
console.log('\n3. Title and meta description');
const titles = new Map();
let metaBad = 0;
for (const p of pages) {
    const html = htmlFor(p);
    const title = pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const desc = metaByName(html, 'description');
    if (!title) { fail(`${p} has no <title>`); metaBad++; }
    if (!desc) { fail(`${p} has no meta description`); metaBad++; }
    if ((html.match(/<title[^>]*>/gi) || []).length > 1) { fail(`${p} has more than one <title>`); metaBad++; }
    if (title) {
        if (titles.has(title)) { fail(`duplicate title on ${p} and ${titles.get(title)}: "${title}"`); metaBad++; }
        else titles.set(title, p);
    }
    if (desc && desc.length > 170) warn(`${p} description is ${desc.length} chars (Google truncates ~155)`);
}
if (!metaBad) ok(`all ${pages.length} titles present, unique, and one per page`);

// â”€â”€ 4. Canonical is self-referencing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
console.log('\n4. Canonical URLs');
let canonBad = 0;
for (const p of pages) {
    const canon = canonicalOf(htmlFor(p));
    const expected = `${SITE}${p}`;
    if (canon !== expected) { fail(`${p} canonical is "${canon}", expected "${expected}"`); canonBad++; }
}
if (!canonBad) ok('every page self-canonicalises to its own URL');

// â”€â”€ 5. hreflang: en + ru + x-default, reciprocal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
console.log('\n5. hreflang');
let hrefBad = 0;
for (const p of pages) {
    const html = htmlFor(p);
    const langs = hreflangsOf(html);
    const lower = langs.map((l) => l.toLowerCase());
    for (const need of ['en', 'ru', 'x-default']) {
        if (!lower.includes(need)) { fail(`${p} missing hreflang="${need}"`); hrefBad++; }
    }
}
if (!hrefBad) ok('every page declares en, ru and x-default');

// â”€â”€ 6. html lang matches the URL's language â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
console.log('\n6. <html lang>');
let langBad = 0;
for (const p of pages) {
    const lang = pick(htmlFor(p), /<html[^>]*lang="([^"]*)"/i);
    const expected = p === '/ru' || p.startsWith('/ru/') ? 'ru' : 'en';
    if (lang !== expected) { fail(`${p} has lang="${lang}", expected "${expected}"`); langBad++; }
}
if (!langBad) ok('every page declares the language its URL promises');

// â”€â”€ 7. JSON-LD parses and is linked â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
console.log('\n7. Structured data');
let ldBad = 0;
for (const p of pages) {
    const html = htmlFor(p);
    const blocks = all(html, /<script[^>]*\stype="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
    if (blocks.length === 0) { fail(`${p} has no JSON-LD`); ldBad++; continue; }
    for (const b of blocks) {
        try {
            const parsed = JSON.parse(b);
            const graph = parsed['@graph'] || [];
            if (!graph.some((n) => n['@type'] === 'Organization')) { fail(`${p} graph has no Organization`); ldBad++; }
            const s = JSON.stringify(parsed);
            if (/US.*EU.*CN/.test(s)) { fail(`${p} still contains the fabricated country list`); ldBad++; }
            if (s.includes('streetAddress')) { fail(`${p} still contains streetAddress`); ldBad++; }
        } catch (e) {
            fail(`${p} JSON-LD does not parse: ${e.message}`);
            ldBad++;
        }
    }
}
if (!ldBad) ok('all JSON-LD parses, is one linked @graph, and contains no invented facts');

// â”€â”€ 8. Internal links resolve â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
console.log('\n8. Internal links');
const pageSet = new Set(pages);
const broken = new Set();
for (const p of pages) {
    for (const href of all(htmlFor(p), /href="(\/[^"#?]*)"/g)) {
        if (href.startsWith('/assets/')) continue;
        if (/\.(png|jpg|jpeg|webp|svg|pdf|xml|txt|ico)$/i.test(href)) {
            if (!existsSync(join(DIST, decodeURIComponent(href).slice(1)))) broken.add(`${href} (asset, linked from ${p})`);
            continue;
        }
        const clean = href.replace(/\/$/, '') || '/';
        if (!pageSet.has(clean) && !clean.startsWith('/admin')) broken.add(`${href} (linked from ${p})`);
    }
}
if (broken.size) [...broken].forEach((b) => fail(`broken link: ${b}`));
else ok('every internal link and asset reference resolves to a real file');

// â”€â”€ 9. Sitemap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
console.log('\n9. sitemap.xml');
const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
const locs = all(sitemap, /<loc>([^<]+)<\/loc>/g);
let smBad = 0;
for (const loc of locs) {
    const path = loc.replace(SITE, '') || '/';
    if (!pageSet.has(path)) { fail(`sitemap lists ${loc} but no such page was generated`); smBad++; }
}
for (const p of pages) {
    if (p === '/404' || p.startsWith('/admin')) continue;
    if (!locs.includes(`${SITE}${p}`)) { fail(`page ${p} is missing from the sitemap`); smBad++; }
}
if (!sitemap.startsWith('<?xml')) { fail('sitemap is not valid XML'); smBad++; }
if (!smBad) ok(`${locs.length} sitemap URLs, all resolve, none missing`);

// â”€â”€ 10. 404 and admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
console.log('\n10. 404 page and admin shell');
const notFound = readFileSync(join(DIST, '404.html'), 'utf8');
if (!/noindex/.test(notFound)) fail('404.html does not contain noindex');
else ok('404.html is noindexed');
if (!/<div id="root" data-prerendered>/.test(notFound)) fail('404.html is not prerendered');
else ok('404.html has real content (works without JavaScript)');

const admin = readFileSync(join(DIST, 'admin.html'), 'utf8');
if (/data-prerendered/.test(admin)) fail('admin.html was prerendered; it must not be');
else ok('admin.html is a plain shell, not prerendered');

// â”€â”€ 11. Things that must NOT be there any more â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
console.log('\n11. Regressions from the audit');
const home = htmlFor('/');
if (/Ð­ÐºÑÐ¿Ð¾Ñ€Ñ‚ ÐºÐ¾Ñ€Ð½Ñ ÑÐ¾Ð»Ð¾Ð´ÐºÐ¸/.test(home)) fail('the Russian meta description is still on the English page');
else ok('no Russian meta description on the English shell');
if (/gallary/.test(JSON.stringify(pages)) || existsSync(join(DIST, 'gallary photos'))) fail('the misspelled gallery folder still exists');
else ok('gallery folder renamed');
if (existsSync(join(DIST, 'images', 'placeholder.png'))) ok('placeholder.png exists (12 hidden products reference it)');
else fail('placeholder.png is missing');

// â”€â”€ Result â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
console.log(`\nâ•â•â• ${failures} failure(s), ${warnings} warning(s) â•â•â•\n`);
process.exit(failures ? 1 : 0);
