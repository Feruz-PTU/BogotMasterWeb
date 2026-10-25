/**
 * Converts the images that are referenced from CODE to WebP.
 *
 * Deliberately limited to code-referenced files. The product photos in
 * public/images-new/ and the factory photos in public/gallery/ have their
 * paths stored in the Supabase database, so renaming them means a database
 * migration too — that is a separate, riskier job and is listed in the
 * owner's manual notes rather than done silently here.
 *
 * Originals are kept on disk so nothing is lost, and so a stale database row
 * pointing at a .png still resolves.
 *
 * Run: npm run images
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** [source, quality, optional resize width] */
const TARGETS = [
    ['public/images/mobile-main-hero-image.png', 80, 820],
    ['public/images/image16.png', 82, 870],
    ['public/images/image17.png', 82, 560],
    ['public/images/image18.png', 82, 830],
    ['public/images/Glycyrrhiza_glabra_Y03.jpg', 75, 640],
];

/**
 * Smaller copies of images the code shows smaller than their file (folder 27),
 * each next to its original, which stays: [source, output, width, quality].
 * 'near' (near-lossless) keeps the flat logo's edges clean and is the
 * smallest for it; the partner logos come out smallest at quality 90.
 */
const VARIANTS = [
    // Desktop hero: shown at 40% of the screen, about 580-770 px on a laptop.
    ['public/images/hero-bg-new.webp', 'public/images/hero-bg-new-720.webp', 720, 80],
    // Logo: 40-50 px tall in the navbar and the footer, 200-380 px on About.
    ['public/Logo/new-logo.png', 'public/Logo/logo-64.webp', 64, 'near'],
    ['public/Logo/new-logo.png', 'public/Logo/logo-128.webp', 128, 'near'],
    ['public/Logo/new-logo.png', 'public/Logo/logo-192.webp', 192, 'near'],
    // (Above 400 px the WebP comes out larger than the 904 px PNG itself.)
    ['public/Logo/new-logo.png', 'public/Logo/logo-400.webp', 400, 'near'],
    // The browser-tab icon (index.html): a PNG, a multiple of 48 px as Google
    // asks for. It was the 26 KB 904 px logo, fetched on every first visit.
    ['public/Logo/new-logo.png', 'public/Logo/favicon-96.png', 96, 'png'],
    // Partner logos: a box of 200 x 60 px at most (450 px stays sharp on a 3x phone).
    ['public/partner/partner1.png', 'public/partner/partner1-450.webp', 450, 90],
    ['public/partner/partner2.png', 'public/partner/partner2-450.webp', 450, 90],
    // The plant photo: at most 340 px wide.
    ['public/images/Glycyrrhiza_glabra_Y03.jpg', 'public/images/Glycyrrhiza_glabra_Y03-360.webp', 360, 75],
    ['public/images/Glycyrrhiza_glabra_Y03.jpg', 'public/images/Glycyrrhiza_glabra_Y03-480.webp', 480, 75],
];

const kb = (n) => Math.round(n / 1024);
let saved = 0;

for (const [rel, outRel, width, quality] of VARIANTS) {
    const src = join(ROOT, rel);
    if (!existsSync(src)) {
        console.log(`  skip (missing): ${rel}`);
        continue;
    }
    const out = join(ROOT, outRel);
    const resized = sharp(src).resize({ width, withoutEnlargement: true });
    if (quality === 'png') await resized.png({ compressionLevel: 9, palette: true }).toFile(out);
    else if (quality === 'near') await resized.webp({ nearLossless: true, quality: 60, effort: 6 }).toFile(out);
    else await resized.webp({ quality, alphaQuality: 100, effort: 6 }).toFile(out);
    console.log(`  ${outRel}  ${kb(statSync(src).size)} KB -> ${kb(statSync(out).size)} KB`);
}

for (const [rel, quality, width] of TARGETS) {
    const src = join(ROOT, rel);
    if (!existsSync(src)) {
        console.log(`  skip (missing): ${rel}`);
        continue;
    }
    const out = src.replace(/\.(png|jpe?g)$/i, '.webp');
    const before = statSync(src).size;

    let pipeline = sharp(src);
    const meta = await pipeline.metadata();
    if (width && meta.width > width) pipeline = pipeline.resize({ width });

    await pipeline.webp({ quality, effort: 6 }).toFile(out);

    const after = statSync(out).size;
    saved += before - after;
    console.log(
        `  ${rel}\n    ${kb(before)} KB -> ${kb(after)} KB  (-${Math.round((1 - after / before) * 100)}%)`
    );
}

console.log(`\n  Total saved: ${kb(saved)} KB\n`);
console.log('  Reminder: update the references in src/ to the .webp paths.');
