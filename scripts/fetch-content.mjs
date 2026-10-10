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

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_FILE = resolve(ROOT, 'src/data/build-content.json');

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

const products = productRows
    .map((row) => ({ ...(row.data || {}), slug: normalizeSlug(row.data?.slug || row.slug) }))
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

const snapshot = {
    generatedAt: new Date().toISOString(),
    languages: LANGUAGE_CODES,
    defaultLanguage: DEFAULT_LANGUAGE,
    products,
    settings: rawSettings,
    translations,
};

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 2), 'utf8');

// ── Report ───────────────────────────────────────────────────────────────────
console.log(`✓ ${products.length} visible products, ${LANGUAGE_CODES.length} languages`);
console.log(`✓ wrote ${OUT_FILE.replace(process.cwd(), '.')}`);

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
