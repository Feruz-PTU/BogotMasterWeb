/**
 * Build step 1 of 3 — fetch the live content from Supabase.
 *
 * Writes `src/data/build-content.json`, which is the single snapshot that BOTH
 * the server render and the browser use. Because both read the exact same
 * bytes, the prerendered HTML and the first browser render are identical:
 * no loading flash, no hydration mismatch.
 *
 * If the fetch fails this script exits non-zero and the whole build fails.
 * That is deliberate: Vercel keeps the previous deployment live, which is far
 * better than publishing a site with empty or stale product pages.
 *
 * Run: node scripts/fetch-content.mjs
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGUAGE_CODES, DEFAULT_LANGUAGE } from '../src/i18n/languages.js';
import { resolveFamilies } from '../src/utils/productFamily.js';
import { sortFaq } from '../src/utils/faq.js';
import { faqProblems } from '../src/utils/faqChecks.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_FILE = resolve(ROOT, 'src/data/build-content.json');
// The published FAQ answers, in their own file so they stay out of the main
// bundle: only the FAQ page imports it.
const FAQ_FILE = resolve(ROOT, 'src/data/build-faq.json');

/**
 * Load .env for local runs.
 *
 * Vite loads .env automatically, but this is a plain Node script, so it does
 * not. On Vercel there is no .env file — the variables are already in the
 * environment — hence "if it exists", and real environment variables always
 * win over the file.
 */
function loadDotEnv() {
    const file = resolve(ROOT, '.env');
    if (!existsSync(file)) return;
    // Strip a UTF-8 BOM: an editor (or PowerShell's Set-Content) can add one,
    // and it silently corrupts the first variable NAME, so the value looks
    // missing for no visible reason.
    const raw = readFileSync(file, 'utf8').replace(/^﻿/, '');
    for (const line of raw.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (!match) continue;
        const [, key, rawValue] = match;
        if (process.env[key]) continue;
        process.env[key] = rawValue.replace(/^(['"])(.*)\1$/, '$2');
    }
}
loadDotEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

function fail(message) {
    console.error('\n\u001b[31m✖ BUILD FAILED — ' + message + '\u001b[0m');
    console.error(
        '  The site was NOT rebuilt. Your current live site is untouched.\n'
    );
    process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
    fail(
        'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing.\n' +
            '  Locally: copy .env.example to .env and fill them in.\n' +
            '  On Vercel: Settings → Environment Variables.'
    );
}

async function get(path) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
        },
    });
    if (!res.ok) {
        fail(
            `Supabase returned HTTP ${res.status} for "${path}".\n` +
                `  ${(await res.text()).slice(0, 300)}`
        );
    }
    return res.json();
}

/** Slugs must be lowercase: Vercel URLs are case-sensitive. */
const normalizeSlug = (s) => String(s || '').trim().toLowerCase();

/**
 * Folders that were renamed in the repo but whose old paths may still be
 * stored in the database.
 *
 * The gallery folder was "gallary photos" — misspelled, and with a space that
 * had to be %20-encoded in every URL. Renaming it on disk is not enough: the
 * image paths live in the `settings` row, so until the SQL migration is run
 * the database still points at a folder that no longer exists, and every
 * gallery photo 404s.
 *
 * Rewriting the paths here makes the build correct either way, instead of
 * depending on a manual step having happened first.
 */
const LEGACY_PATHS = [
    [/\/gallary(%20| )photos\//g, '/gallery/'],
];

const normalizePath = (value) => {
    if (typeof value !== 'string') return value;
    let out = value;
    for (const [from, to] of LEGACY_PATHS) out = out.replace(from, to);
    return out;
};

/** Walk any structure and rewrite every legacy asset path inside it. */
function normalizeAssetPaths(node) {
    if (typeof node === 'string') return normalizePath(node);
    if (Array.isArray(node)) return node.map(normalizeAssetPaths);
    if (node && typeof node === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(node)) out[k] = normalizeAssetPaths(v);
        return out;
    }
    return node;
}

console.log('→ Fetching live content from Supabase…');

const [productRows, settingRows] = await Promise.all([
    get('products?select=*'),
    get('settings?select=*'),
]);

if (!Array.isArray(productRows) || productRows.length === 0) {
    fail('Supabase returned zero products. Refusing to build an empty catalogue.');
}

const settingsById = Object.fromEntries(
    settingRows.map((r) => [r.id, r.data || {}])
);
const rawSettings = settingsById.main;
const rawTranslations = settingsById.translations || {};

if (!rawSettings) {
    fail('The settings row with id="main" is missing from Supabase.');
}

// ── Translations ─────────────────────────────────────────────────────────────
// Keep ONLY the live languages. The database may contain extra language blocks
// (kh, kr, uz …) that are not ready to publish; shipping them would create
// half-translated pages. languages.js is the only switch that makes one live.
const translations = {};
for (const code of LANGUAGE_CODES) {
    if (!rawTranslations[code]) {
        fail(
            `No translation block for the live language "${code}" in Supabase ` +
                `(settings → translations). Either add it, or remove "${code}" ` +
                `from src/i18n/languages.js.`
        );
    }
    translations[code] = rawTranslations[code];
}

const droppedLanguages = Object.keys(rawTranslations)
    .filter((k) => k !== 'languages' && !LANGUAGE_CODES.includes(k));

// ── Products ─────────────────────────────────────────────────────────────────
const warnings = [];
const skipped = [];
const seenSlugs = new Map();

// Related-products families are stored by slug, so their slugs get the same
// lowercasing or they would stop matching.
const normalizeSlugs = (list) => (Array.isArray(list) ? list.map(normalizeSlug).filter(Boolean) : undefined);
const allProducts = productRows
    .map((row) => ({
        ...(row.data || {}),
        slug: normalizeSlug(row.data?.slug || row.slug),
        family: normalizeSlugs(row.data?.family),
        related: normalizeSlugs(row.data?.related),
    }))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

// Worked out before hidden products are dropped, so a hidden member does not
// split its family. Each page gets the other members as `related`, in family
// order; the page leaves out any that are hidden.
const families = resolveFamilies(allProducts);

const products = allProducts
    .map((p) => ({
        ...p,
        family: undefined,
        related: (families.get(p.slug) || []).filter((s) => s !== p.slug),
    }))
    .filter((p) => {
        if (p.hidden === true) return false; // hidden in admin → no page, no sitemap entry
        if (!p.slug) {
            skipped.push({ slug: '(empty)', reason: 'product has no slug' });
            return false;
        }
        // A product with no title in the default language cannot have a usable
        // page or a meaningful <title>. We will not invent one.
        const title = p[`title_${DEFAULT_LANGUAGE}`] || p.title_en || p.title_ru;
        if (!title || !String(title).trim()) {
            skipped.push({
                slug: p.slug,
                reason: `no title in any language — fill title_${DEFAULT_LANGUAGE} in the admin panel`,
            });
            return false;
        }
        return true;
    })
    .map((p) => {
        const original = String(p.slug);
        if (seenSlugs.has(p.slug)) {
            warnings.push(`duplicate slug after lowercasing: "${p.slug}"`);
        }
        seenSlugs.set(p.slug, original);

        for (const code of LANGUAGE_CODES) {
            if (!p[`title_${code}`] || !String(p[`title_${code}`]).trim()) {
                warnings.push(`"${p.slug}" has no title_${code}`);
            }
            if (!p[`desc_${code}`] || !String(p[`desc_${code}`]).trim()) {
                warnings.push(`"${p.slug}" has no desc_${code}`);
            }
        }
        return p;
    })
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

if (products.length === 0) {
    fail('Every product was filtered out (hidden or untitled). Nothing to build.');
}

// Mixed-case slugs still in the database need a permanent redirect so old
// links keep working. Report them so vercel.json / the SQL file stay in sync.
const mixedCase = productRows
    .filter((r) => {
        const s = r.data?.slug || r.slug;
        return s && s !== String(s).toLowerCase() && r.data?.hidden !== true;
    })
    .map((r) => r.data?.slug || r.slug);

const snapshot = normalizeAssetPaths({
    generatedAt: new Date().toISOString(),
    languages: LANGUAGE_CODES,
    defaultLanguage: DEFAULT_LANGUAGE,
    products,
    settings: rawSettings,
    translations,
});

const rewritten =
    JSON.stringify(snapshot).match(/\/gallery\//g)?.length ?? 0;

/**
 * Every local file the database points at must actually exist.
 *
 * This check exists because of a real failure: the gallery folder was renamed
 * in the repo, the database still pointed at the old name, and the site
 * deployed with fourteen broken images that nothing caught. Remote URLs
 * (Supabase Storage) are skipped — only paths this repo is responsible for
 * are checked.
 */
const referenced = new Set(
    (JSON.stringify(snapshot).match(/"(\/[^"]+\.(?:jpg|jpeg|png|webp|svg|pdf))"/gi) || [])
        .map((s) => s.slice(1, -1))
);

const missing = [...referenced].filter(
    (p) => !existsSync(resolve(ROOT, 'public', decodeURIComponent(p).replace(/^\//, '')))
);

if (missing.length) {
    fail(
        `the database references ${missing.length} file(s) that do not exist in public/:\n` +
            missing.map((m) => `    ${m}`).join('\n') +
            `\n\n  Either restore the file, fix the path in the admin panel, or add a\n` +
            `  rewrite rule to LEGACY_PATHS in this script.`
    );
}

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 2), 'utf8');

// ── FAQ ──────────────────────────────────────────────────────────────────────
// Published answers only. The anon key cannot read any other row
// (supabase/faq.sql), and the query and the filter below say so again.
// Before that SQL has been run the table does not exist: the build then goes
// on with no answers rather than failing. Any other error fails it as usual.
async function fetchPublishedFaq() {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/faq?select=slug,order,status,data,updated_at&status=eq.published&order=order.asc`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const text = await res.text();
    if (res.status === 404 && /PGRST205|42P01/.test(text)) return null;
    if (!res.ok) fail(`Supabase returned HTTP ${res.status} for the FAQ.\n  ${text.slice(0, 300)}`);
    return JSON.parse(text);
}

const faqRows = await fetchPublishedFaq();
const faqSkipped = [];
const faqWarnings = [];
const visibleSlugs = products.map((p) => p.slug);
const faqItems = sortFaq(
    (faqRows || [])
        .filter((r) => r.status === 'published')
        .map((r) => ({
            ...(r.data || {}),
            slug: r.slug,
            order: r.order,
            // The date shown as "Last updated": set in the admin, or the
            // date the row last changed.
            updated: r.data?.updated || String(r.updated_at || '').slice(0, 10),
        }))
).filter((item) => {
    const { errors, warnings } = faqProblems(item, { codes: LANGUAGE_CODES, productSlugs: visibleSlugs });
    // An answer the page cannot place or show is left out. One that still
    // has an "[owner: …]" mark is kept, so the placeholder guard stops the
    // build and names it (the database should never let one be published).
    const blocking = errors.filter((e) => e.code !== 'marks');
    if (blocking.length) {
        faqSkipped.push(`${item.slug} — ${blocking.map((e) => e.message).join(' ')}`);
        return false;
    }
    // Length is a writing guideline, not a build note.
    faqWarnings.push(...warnings.filter((w) => !/ words \(aim/.test(w)).map((w) => `faq "${item.slug}": ${w}`));
    return true;
});

writeFileSync(
    FAQ_FILE,
    JSON.stringify({ generatedAt: snapshot.generatedAt, items: faqItems }, null, 2),
    'utf8'
);

// ── Report ───────────────────────────────────────────────────────────────────
console.log(`✓ ${products.length} visible products, ${LANGUAGE_CODES.length} languages`);
console.log(`✓ wrote ${OUT_FILE.replace(process.cwd(), '.')}`);
console.log(
    faqRows === null
        ? '  note: no FAQ table yet (run supabase/faq.sql); wrote an empty FAQ'
        : `✓ ${faqItems.length} published FAQ answer(s) → ${FAQ_FILE.replace(process.cwd(), '.')}`
);
if (faqSkipped.length) {
    console.log('\n  FAQ answers SKIPPED (published, but cannot be shown):');
    for (const s of faqSkipped) console.log(`   • ${s}`);
}
warnings.push(...faqWarnings);

if (droppedLanguages.length) {
    console.log(
        `  note: ignored non-live language blocks in the database: ${droppedLanguages.join(', ')}\n` +
            `        (add one to src/i18n/languages.js to publish it)`
    );
}
if (mixedCase.length) {
    console.log(
        `  note: these slugs contain capital letters and were lowercased for URLs: ${mixedCase.join(', ')}\n` +
            `        run supabase/phase2-migration.sql to fix them at the source`
    );
}
if (skipped.length) {
    console.log('\n  SKIPPED (no page generated):');
    for (const s of skipped) console.log(`   • ${s.slug} — ${s.reason}`);
}
if (warnings.length) {
    console.log(`\n  ${warnings.length} content warning(s):`);
    for (const w of warnings.slice(0, 40)) console.log(`   • ${w}`);
    if (warnings.length > 40) console.log(`   … and ${warnings.length - 40} more`);
}
console.log('');
