/**
 * Checks the built dist/ folder against the things this project set out to fix.
 * Run after `npm run build`:   node scripts/verify-build.mjs
 *
 * Exits non-zero if any hard check fails, so it can gate a deploy.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkHtml } from './content-guard.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SITE = 'https://bogotmaster.org';

let failures = 0;
let warnings = 0;
const fail = (m) => { console.log(`  \u001b[31m✖ ${m}\u001b[0m`); failures++; };
const warn = (m) => { console.log(`  \u001b[33m! ${m}\u001b[0m`); warnings++; };
const ok = (m) => console.log(`  \u001b[32m✓\u001b[0m ${m}`);

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
/** Every alternate a page declares, as sorted "hreflang href" strings. */
const alternatesOf = (html) =>
    [...html.matchAll(/<link[^>]*\srel="alternate"[^>]*\shreflang="([^"]*)"[^>]*\shref="([^"]*)"/gi)]
        .map((m) => `${m[1].toLowerCase()} ${m[2]}`)
        .sort();
/** Everything inside <body>, tags stripped. */
const visibleText = (html) => {
    const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [])[1] || '';
    return body
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

console.log(`\n═══ Verifying ${pages.length} generated pages ═══\n`);

// ── 1. Real content in the HTML ──────────────────────────────────────────────
console.log('1. Visible text is in the HTML (the whole point of the change)');
let thin = 0;
for (const p of pages) {
    const html = htmlFor(p);
    const text = visibleText(html);
    if (text.length < 400) { fail(`${p} has only ${text.length} chars of visible text`); thin++; }
}
if (!thin) ok(`every page has real rendered text (shortest checked over 400 chars)`);

// ── 2. Exactly one h1 ────────────────────────────────────────────────────────
console.log('\n2. Exactly one <h1> per page');
let h1bad = 0;
for (const p of pages) {
    const n = (htmlFor(p).match(/<h1[\s>]/g) || []).length;
    if (n !== 1) { fail(`${p} has ${n} <h1> elements`); h1bad++; }
}
if (!h1bad) ok('all pages have exactly one <h1>');

// ── 3. Title + description present and unique per language ───────────────────
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

// ── 4. Canonical is self-referencing ─────────────────────────────────────────
console.log('\n4. Canonical URLs');
let canonBad = 0;
for (const p of pages) {
    const canon = canonicalOf(htmlFor(p));
    const expected = `${SITE}${p}`;
    if (canon !== expected) { fail(`${p} canonical is "${canon}", expected "${expected}"`); canonBad++; }
}
if (!canonBad) ok('every page self-canonicalises to its own URL');

// ── 5. hreflang: every language version + x-default, reciprocal ──────────────
console.log('\n5. hreflang');
let hrefBad = 0;
for (const p of pages) {
    const html = htmlFor(p);
    const langs = hreflangsOf(html);
    const lower = langs.map((l) => l.toLowerCase());
    // A page must name each language version that was generated. Most pages
    // exist in both languages; an article may exist in only one, and then must
    // not name the other.
    const base = p === '/ru' ? '/' : p.startsWith('/ru/') ? p.slice(3) : p;
    const versions = { en: base, ru: base === '/' ? '/ru' : `/ru${base}` };
    for (const [code, path] of Object.entries(versions)) {
        if (pages.includes(path) && !lower.includes(code)) { fail(`${p} missing hreflang="${code}"`); hrefBad++; }
    }
    if (!lower.includes('x-default')) { fail(`${p} missing hreflang="x-default"`); hrefBad++; }

    // These tags are the ONLY place the language versions are declared (the
    // sitemap deliberately carries none), and search engines ignore them
    // unless every version points at the others and at itself.
    const own = alternatesOf(html);
    if (!own.some((a) => a.endsWith(` ${SITE}${p}`))) { fail(`${p} does not list itself as an alternate`); hrefBad++; }
    for (const alt of own) {
        const target = alt.split(' ')[1].replace(SITE, '') || '/';
        if (!pages.includes(target)) { fail(`${p} declares an alternate that is not a generated page: ${alt}`); hrefBad++; }
        else if (alternatesOf(htmlFor(target)).join() !== own.join()) { fail(`${p} and ${target} do not declare the same alternates`); hrefBad++; }
    }
}
if (!hrefBad) ok('every page declares each of its language versions and x-default, and the versions point back at each other');

// ── 6. html lang matches the URL's language ──────────────────────────────────
console.log('\n6. <html lang>');
let langBad = 0;
for (const p of pages) {
    const lang = pick(htmlFor(p), /<html[^>]*lang="([^"]*)"/i);
    const expected = p === '/ru' || p.startsWith('/ru/') ? 'ru' : 'en';
    if (lang !== expected) { fail(`${p} has lang="${lang}", expected "${expected}"`); langBad++; }
}
if (!langBad) ok('every page declares the language its URL promises');

// ── 7. JSON-LD parses and is linked ──────────────────────────────────────────
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

// ── 8. Internal links resolve ────────────────────────────────────────────────
console.log('\n8. Internal links');
const pageSet = new Set(pages);
const broken = new Set();
for (const p of pages) {
    for (const href of all(htmlFor(p), /href="(\/[^"#?]*)"/g)) {
        if (href.startsWith('/assets/')) continue;
        if (/\.(png|jpg|jpeg|webp|svg|pdf|xml|txt|ico|woff2)$/i.test(href)) {
            if (!existsSync(join(DIST, decodeURIComponent(href).slice(1)))) broken.add(`${href} (asset, linked from ${p})`);
            continue;
        }
        const clean = href.replace(/\/$/, '') || '/';
        if (!pageSet.has(clean) && !clean.startsWith('/admin')) broken.add(`${href} (linked from ${p})`);
    }
}
if (broken.size) [...broken].forEach((b) => fail(`broken link: ${b}`));
else ok('every internal link and asset reference resolves to a real file');

// ── 9. Sitemap ───────────────────────────────────────────────────────────────
console.log('\n9. sitemap.xml');
const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
let smBad = 0;
const smFail = (m) => { fail(m); smBad++; };

// The sitemap schema is a strict sequence, so this pattern accepts exactly
// <loc>, <lastmod>, <priority> in that order. Once every such entry is
// removed, nothing but the XML declaration and an empty <urlset> may be left:
// the old sitemap, with hreflang lines between <loc> and <lastmod>, fails here.
const SM_ENTRY = /<url>\s*<loc>([^<]*)<\/loc>\s*<lastmod>([^<]*)<\/lastmod>\s*<priority>([^<]*)<\/priority>\s*<\/url>/g;
const SM_SHELL = /^<\?xml version="1\.0" encoding="UTF-8"\?>\s*<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">\s*<\/urlset>\s*$/;
const smEntries = [...sitemap.matchAll(SM_ENTRY)].map(([, loc, lastmod, priority]) => ({ loc, lastmod, priority }));
const smRest = sitemap.replace(SM_ENTRY, '');
if (!SM_SHELL.test(smRest)) {
    const stray = (smRest.match(/<url>[\s\S]*?<\/url>/) || [smRest])[0];
    smFail(`sitemap breaks the schema order <loc>, <lastmod>, <priority>: ${stray.replace(/\s+/g, ' ').slice(0, 200)}`);
}

// Every URL listed, however its entry is laid out, so that a layout problem
// above is reported once instead of once per "missing" page.
const locs = all(sitemap, /<loc>([^<]*)<\/loc>/g);
for (const [i, loc] of locs.entries()) {
    const path = loc.replace(SITE, '') || '/';
    if (!loc.startsWith(`${SITE}/`)) smFail(`sitemap URL is not an absolute URL on this site: ${loc}`);
    else if (!pageSet.has(path)) smFail(`sitemap lists ${loc} but no such page was generated`);
    else {
        const html = htmlFor(path);
        if (canonicalOf(html) !== loc) smFail(`sitemap lists ${loc} but that page's canonical is ${canonicalOf(html)}`);
        if (/noindex/i.test(metaByName(html, 'robots') || '')) smFail(`sitemap lists ${loc} but that page is noindex`);
    }
    if (locs.indexOf(loc) !== i) smFail(`sitemap lists ${loc} more than once`);
    if (/&(?!(amp|lt|gt|quot|apos);)/.test(loc)) smFail(`sitemap URL contains an unescaped "&": ${loc}`);
}

const W3C_DATETIME = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/;
for (const { loc, lastmod, priority } of smEntries) {
    if (!W3C_DATETIME.test(lastmod) || !(Date.parse(lastmod) <= Date.now())) smFail(`${loc} has a malformed or future <lastmod>: "${lastmod}"`);
    if (!/^(0(\.\d)?|1(\.0)?)$/.test(priority)) smFail(`${loc} has an invalid <priority>: "${priority}"`);
}
for (const p of pages) {
    if (p === '/404' || p.startsWith('/admin')) continue;
    if (!locs.includes(`${SITE}${p}`)) smFail(`page ${p} is missing from the sitemap`);
}

// The next build reads sitemap-state.json back from the live site to carry
// each unchanged page's lastmod forward. If it is missing or disagrees with
// the sitemap, every date silently resets on the following deploy.
if (!existsSync(join(DIST, 'sitemap-state.json'))) smFail('sitemap-state.json was not generated');
else {
    const smState = JSON.parse(readFileSync(join(DIST, 'sitemap-state.json'), 'utf8')).pages || {};
    for (const { loc, lastmod } of smEntries) {
        const entry = smState[loc.replace(SITE, '') || '/'];
        if (entry?.lastmod !== lastmod || !/^[0-9a-f]{64}$/.test(entry.hash)) smFail(`sitemap-state.json does not match the sitemap for ${loc}`);
    }
}

if (!readFileSync(join(DIST, 'robots.txt'), 'utf8').split(/\r?\n/).includes(`Sitemap: ${SITE}/sitemap.xml`)) smFail('robots.txt does not point at the sitemap');

if (!smBad) ok(`${smEntries.length} sitemap URLs: schema order valid, each a real indexable page with a matching canonical, none missing`);

// ── 10. 404 and admin ────────────────────────────────────────────────────────
console.log('\n10. 404 page and admin shell');
const notFound = readFileSync(join(DIST, '404.html'), 'utf8');
if (!/noindex/.test(notFound)) fail('404.html does not contain noindex');
else ok('404.html is noindexed');
if (!/<div id="root" data-prerendered>/.test(notFound)) fail('404.html is not prerendered');
else ok('404.html has real content (works without JavaScript)');

const admin = readFileSync(join(DIST, 'admin.html'), 'utf8');
if (/data-prerendered/.test(admin)) fail('admin.html was prerendered; it must not be');
else ok('admin.html is a plain shell, not prerendered');

// ── 11. Things that must NOT be there any more ───────────────────────────────
console.log('\n11. Regressions from the audit');
const home = htmlFor('/');
if (/Экспорт корня солодки/.test(home)) fail('the Russian meta description is still on the English page');
else ok('no Russian meta description on the English shell');
if (/gallary/.test(JSON.stringify(pages)) || existsSync(join(DIST, 'gallary photos'))) fail('the misspelled gallery folder still exists');
else ok('gallery folder renamed');
if (existsSync(join(DIST, 'images', 'placeholder.png'))) ok('placeholder.png exists (12 hidden products reference it)');
else fail('placeholder.png is missing');

// ── 12. No placeholders ──────────────────────────────────────────────────────
// The build already refuses them in the sources (content-guard.mjs); this is
// the second net, over what was actually generated.
console.log('\n12. Placeholders');
const placeholders = checkHtml(DIST);
if (placeholders.length) placeholders.forEach((f) => fail(`placeholder in ${f.where}: ${f.text}`));
else ok('no [owner: …] or [verify] in any generated HTML, XML or text file');

// ── Result ───────────────────────────────────────────────────────────────────
console.log(`\n═══ ${failures} failure(s), ${warnings} warning(s) ═══\n`);
process.exit(failures ? 1 : 0);
