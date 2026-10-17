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

const kb = (n) => Math.round(n / 1024);
let saved = 0;

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
