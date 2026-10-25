/**
 * Build step 2 — the site's own copies of the photos the database points at.
 *
 * Product and gallery photos are uploaded in the admin to Supabase Storage.
 * Served from there, a page that shows one makes the browser open a second
 * connection (to supabase.co) before the photo can start loading — the
 * product photo is the largest thing on a product page, so that delay was
 * most of the page's load time on a phone. And each photo existed in one
 * width only (600 px), so a phone showing it in a 150 px card downloaded the
 * whole file.
 *
 * This step downloads each photo once per build and writes WebP copies in
 * several widths to public/media/ (git-ignored; Vite copies it into dist/).
 * It adds a `media` map to src/data/build-content.json:
 *     original URL → { src, srcset, w, h }
 * components/MediaImage.jsx looks photos up there by their original URL, so
 * nothing in the database changes and a new upload gets its copies on the
 * next build (saving in the admin starts one).
 *
 * File names are a hash of the photo's bytes: a replaced photo gets a new
 * name, so the copies can be cached for a year (vercel.json).
 *
 * Never fails the build. A photo that cannot be downloaded or read keeps its
 * original address: the page still shows it, only without the smaller copies.
 *
 * Run: node scripts/build-media.mjs   (part of `npm run content`)
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_FILE = resolve(ROOT, 'src/data/build-content.json');
const OUT_DIR = resolve(ROOT, 'public/media');
const URL_BASE = '/media';

// The widths made of each photo, up to its own width. 1200 is the cap: no
// place on the site shows a photo wider than 600 CSS px.
const WIDTHS = [300, 450, 600, 900, 1200];
const QUALITY = 80;
// The full-width copy is the original file unless re-saving it makes it at
// least this much smaller (it halves the heaviest gallery photos; the light
// product photos come out larger, so they stay as they are).
const RESAVE_GAIN = 0.15;

const warn = (m) => console.log(`  \u001b[33m! ${m}\u001b[0m`);

if (!existsSync(CONTENT_FILE)) {
    console.error('✖ build-media: src/data/build-content.json is missing (run scripts/fetch-content.mjs first)');
    process.exit(1);
}

let sharp;
try {
    sharp = (await import('sharp')).default;
} catch (e) {
    warn(`build-media: sharp could not be loaded (${e.message}); photos keep their original addresses`);
    process.exit(0);
}

const snapshot = JSON.parse(readFileSync(CONTENT_FILE, 'utf8'));

// Every photo address the public pages show: products and the gallery.
const isRemote = (u) => typeof u === 'string' && /^https?:\/\//.test(u);
const urls = [...new Set([
    ...(snapshot.products || []).map((p) => p.image),
    ...(snapshot.settings?.gallery || []),
].filter(isRemote))];

// Start clean, so copies of photos no longer used do not pile up.
// OUT_DIR is always <repo>/public/media.
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const kib = (n) => `${Math.round(n / 1024)} KiB`;

async function download(url) {
    let last;
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return Buffer.from(await res.arrayBuffer());
        } catch (e) {
            last = e;
        }
    }
    throw last;
}

async function copiesOf(url) {
    const original = await download(url);
    const meta = await sharp(original).metadata();
    if (!meta.width || !meta.height) throw new Error('not an image');
    // A phone photo can be stored on its side with an orientation flag;
    // rotate() turns it upright, so its width is the other side.
    const sideways = (meta.orientation || 1) >= 5;
    const width = sideways ? meta.height : meta.width;
    const height = sideways ? meta.width : meta.height;

    const top = Math.min(width, WIDTHS.at(-1));
    const widths = [...WIDTHS.filter((w) => w < top), top];
    const hash = createHash('sha256').update(original).digest('hex').slice(0, 12);

    let bytes = 0;
    for (const w of widths) {
        let out = await sharp(original)
            .rotate()
            .resize({ width: w, withoutEnlargement: true })
            .webp({ quality: QUALITY, effort: 5 })
            .toBuffer();
        if (w === width && meta.format === 'webp' && !sideways && out.length > original.length * (1 - RESAVE_GAIN)) {
            out = original;
        }
        writeFileSync(join(OUT_DIR, `${hash}-${w}.webp`), out);
        if (w === widths[0]) bytes = out.length;
    }

    return {
        entry: {
            src: `${URL_BASE}/${hash}-${top}.webp`,
            srcset: widths.map((w) => `${URL_BASE}/${hash}-${w}.webp ${w}w`).join(', '),
            w: top,
            h: Math.round((height * top) / width),
        },
        before: original.length,
        smallest: bytes,
    };
}

console.log(`→ Making the site's copies of ${urls.length} photos…`);
const media = {};
const failed = [];
let before = 0;
let smallest = 0;

// A few at a time: quick, without a burst of 50 requests at once.
for (let i = 0; i < urls.length; i += 6) {
    const batch = urls.slice(i, i + 6);
    const results = await Promise.allSettled(batch.map(copiesOf));
    results.forEach((r, j) => {
        if (r.status === 'fulfilled') {
            media[batch[j]] = r.value.entry;
            before += r.value.before;
            smallest += r.value.smallest;
        } else {
            failed.push(`${batch[j]} — ${r.reason?.message || r.reason}`);
        }
    });
}

snapshot.media = media;
writeFileSync(CONTENT_FILE, JSON.stringify(snapshot, null, 2), 'utf8');

console.log(`✓ ${Object.keys(media).length} photos copied to public/media (originals ${kib(before)}; smallest copies ${kib(smallest)})`);
if (failed.length) {
    warn(`${failed.length} photo(s) keep their original address (could not be copied):`);
    for (const f of failed) console.log(`     • ${f}`);
}
console.log('');
