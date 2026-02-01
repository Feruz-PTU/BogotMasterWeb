import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, 'public', 'images', 'hero-bg-new.png');
const OUTPUT_FILE = path.join(__dirname, 'public', 'images', 'hero-bg-new.webp');

async function fixHero() {
    console.log('Fixing hero background (preserving transparency)...');

    try {
        await sharp(INPUT_FILE)
            .resize(1920, 1080, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 80, alphaQuality: 80 }) // WebP supports transparency
            .toFile(OUTPUT_FILE);

        console.log('✓ Created hero-bg-new.webp');
    } catch (err) {
        console.error('Error:', err);
    }
}

fixHero();
