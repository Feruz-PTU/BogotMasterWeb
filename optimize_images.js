import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, 'public');
const IMAGES_NEW_DIR = path.join(PUBLIC_DIR, 'images-new');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');

async function optimizeImages() {
    console.log('Starting image optimization...');

    // 1. Optimize Gallery Images (images-new)
    if (fs.existsSync(IMAGES_NEW_DIR)) {
        const files = fs.readdirSync(IMAGES_NEW_DIR);
        for (const file of files) {
            if (file.match(/\.(jpg|jpeg|png)$/i)) {
                const filePath = path.join(IMAGES_NEW_DIR, file);
                const stat = fs.statSync(filePath);

                // Only optimize if larger than 500KB to avoid re-compressing small ones
                if (stat.size > 500 * 1024) {
                    console.log(`Optimizing ${file} (${(stat.size / 1024 / 1024).toFixed(2)} MB)...`);

                    try {
                        const buffer = await sharp(filePath)
                            .resize(1024, 1024, { // Max 1024px dimension
                                fit: 'inside',
                                withoutEnlargement: true
                            })
                            .jpeg({ quality: 80, mozjpeg: true })
                            .toBuffer();

                        fs.writeFileSync(filePath, buffer);
                        console.log(`✓ Optimized ${file}`);
                    } catch (err) {
                        console.error(`✗ Failed to optimize ${file}:`, err.message);
                    }
                }
            }
        }
    }

    // 2. Optimize Hero Background
    const heroBgPath = path.join(IMAGES_DIR, 'hero-bg-new.png');
    const heroBgOutput = path.join(IMAGES_DIR, 'hero-bg-new.jpg');

    if (fs.existsSync(heroBgPath)) {
        const stat = fs.statSync(heroBgPath);
        console.log(`Optimizing hero-bg-new.png (${(stat.size / 1024 / 1024).toFixed(2)} MB)...`);

        try {
            await sharp(heroBgPath)
                .resize(1920, 1080, {
                    fit: 'inside', // resizing to fit HD
                    withoutEnlargement: true
                })
                .jpeg({ quality: 80, mozjpeg: true })
                .toFile(heroBgOutput);

            console.log(`✓ Created optimized hero-bg-new.jpg`);

            // Optionally remove the original huge PNG to save space? 
            // Better to keep it for safety, but maybe rename it.
            // fs.renameSync(heroBgPath, heroBgPath + '.bak');
        } catch (err) {
            console.error(`✗ Failed to optimize hero background:`, err.message);
        }
    }

    console.log('Optimization complete!');
}

optimizeImages();
