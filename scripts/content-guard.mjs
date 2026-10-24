/**
 * The placeholder guard: no "[owner: …]" or "[verify …]" mark may reach the
 * live site. Drafts use them for facts still missing from the owner and for
 * claims not yet checked (audit §2, "Placeholder guard").
 *
 * - checkSources(root): the page and article texts (Markdown, by file and
 *   line), the two registries, the bundled strings, and the database text
 *   fetched for this build (by field). The build runs it before Vite, and the
 *   prerender runs it again before writing anything.
 * - checkHtml(dist): every generated HTML, text and XML file; verify-build.mjs
 *   uses it as a second net.
 *
 * Run alone: node scripts/content-guard.mjs   (exits 1 if anything is found)
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
// "[owner:", "[verify]" and "[verify in the tariff]", in any case. Kept in
// src/ so the admin FAQ editor checks for exactly the same marks.
import { PLACEHOLDER } from '../src/utils/placeholder.js';

export { PLACEHOLDER };

function filesUnder(dir, test) {
    if (!existsSync(dir)) return [];
    return readdirSync(dir).flatMap((name) => {
        const full = join(dir, name);
        return statSync(full).isDirectory() ? filesUnder(full, test) : test(name) ? [full] : [];
    });
}

/** Every placeholder in a text file, as { where, text }, by line. */
function scanFile(file, base) {
    const found = [];
    readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .forEach((line, i) => {
            for (const m of line.matchAll(PLACEHOLDER)) {
                found.push({ where: `${relative(base, file).replace(/\\/g, '/')}:${i + 1}`, text: m[0] });
            }
        });
    return found;
}

/** Every placeholder in the string values of a data object, by field path. */
function scanData(value, label) {
    if (typeof value === 'string') {
        return [...value.matchAll(PLACEHOLDER)].map((m) => ({ where: label, text: m[0] }));
    }
    if (value && typeof value === 'object') {
        return Object.entries(value).flatMap(([k, v]) => scanData(v, `${label} › ${k}`));
    }
    return [];
}

export async function checkSources(root) {
    const mod = (path) => import(pathToFileURL(join(root, path)).href);
    const { PAGES } = await mod('src/content/pages/index.js');
    const { ARTICLES } = await mod('src/content/articles/index.js');
    const { FALLBACK_STRINGS } = await mod('src/i18n/fallback-strings.js');
    const readJson = (path) => {
        const file = join(root, path);
        // A byte-order mark (an editor may add one) is not JSON.
        return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, '')) : {};
    };
    const content = readJson('src/data/build-content.json');
    const faq = readJson('src/data/build-faq.json');
    return [
        ...filesUnder(join(root, 'src/content'), (n) => n.endsWith('.md')).flatMap((f) => scanFile(f, root)),
        ...PAGES.flatMap((p) => scanData(p, `content page "${p.id}"`)),
        ...ARTICLES.flatMap((a) => scanData(a, `article "${a.slug}"`)),
        ...scanData(FALLBACK_STRINGS, 'fallback-strings'),
        // The products, settings and strings fetched from the database.
        ...scanData(content.products || [], 'database › products'),
        ...scanData(content.settings || {}, 'database › settings'),
        ...scanData(content.translations || {}, 'database › translations'),
        // The published FAQ answers (supabase/faq.sql already refuses to
        // publish one with a mark; this is the second net).
        ...(faq.items || []).flatMap((item) => scanData(item, `database › faq "${item.slug}"`)),
    ];
}

export function checkHtml(dist) {
    return filesUnder(dist, (n) => /\.(html|txt|xml)$/.test(n)).flatMap((f) => scanFile(f, dist));
}

/** Print what was found; true when nothing was. */
export function report(found, what) {
    if (!found.length) return true;
    console.error(`✖ ${found.length} placeholder(s) in ${what}. Fill in the fact or remove the text, then build again:`);
    for (const f of found) console.error(`   ${f.where}  ${f.text}`);
    return false;
}

// Run directly: check the sources.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    if (!report(await checkSources(root), 'the site text')) process.exit(1);
    console.log('✓ no [owner: …] or [verify] placeholders in the site text');
}
