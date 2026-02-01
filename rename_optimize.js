import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_NEW_DIR = path.join(__dirname, 'public', 'images-new');

const MAPPING = [
    { id: 1, src: 'Бочонок A.jpg' },
    { id: 2, src: 'Бочонок очищенный мих.jpg' },
    { id: 3, src: 'Гранулы.jpg' },
    { id: 4, src: 'Измельчённый.jpg' },
    { id: 5, src: 'Палочки отборные стд.jpg' },
    { id: 6, src: 'Палочки отборные.jpg' },
    { id: 7, src: 'Палочки очищенные.jpg' },
    { id: 8, src: 'Порошок.jpg' },
    { id: 9, src: 'Слайс A.jpg' },
    { id: 10, src: 'Слайс мих.jpg' },
    { id: 11, src: 'Таблетка A.jpg' },
    { id: 12, src: 'Таблетка мелкие A.jpg' },
    { id: 13, src: 'Таблетка мих.jpg' },
    { id: 14, src: 'Щепки.jpg' },
    { id: 15, src: 'Индивидуальный заказ.png' }
];

async function run() {
    console.log('Starting renormalization and optimization...');

    for (const item of MAPPING) {
        const oldName = item.src;
        // Determine extension (always jpg for output, but input might be png)
        const newName = `product-${item.id}.jpg`;
        const oldPath = path.join(PUBLIC_NEW_DIR, oldName);
        const newPath = path.join(PUBLIC_NEW_DIR, newName);

        if (fs.existsSync(oldPath)) {
            console.log(`Processing ${oldName} -> ${newName}`);
            try {
                await sharp(oldPath)
                    .resize(1024, 1024, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .toFormat('jpeg', { quality: 80, mozjpeg: true })
                    .toFile(newPath);
                console.log(`✓ Success: ${newName}`);
            } catch (err) {
                console.error(`✗ Error processing ${oldName}:`, err.message);
            }
        } else {
            console.warn(`! Source file not found: ${oldName}`);
            // Fallback: Check if optimized file already exists from previous runs
            if (!fs.existsSync(newPath)) {
                // Try looking for URL encoded names or other variations if needed
            }
        }
    }
    console.log('Done.');
}

run();
