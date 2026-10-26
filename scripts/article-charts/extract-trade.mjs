// Draws the two charts of the article "Licorice extract in world trade"
// (src/content/articles/licorice-extract-world-trade.*.md) as SVG files in
// public/images/articles/licorice-extract-world-trade/, one per chart and
// language.
//
// The numbers come from extract-trade-data.json next to this script: UN
// Comtrade, HS 1302.12, pulled on 26 Oct 2026 (the pull and its scripts are in
// _dev/research/comtrade-2026-10-26/). To update the charts, refresh that JSON
// and run: node scripts/article-charts/extract-trade.mjs
// The SVGs are committed; the build does not run this script.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '../../public/images/articles/licorice-extract-world-trade');
const DATA = JSON.parse(readFileSync(join(here, 'extract-trade-data.json'), 'utf8'));

const C = {
    main: '#515E3B', // the site's olive
    muted: '#B4B1A7',
    faint: '#D9D6CD',
    grid: '#E8E6E0',
    axis: '#8F8C83',
    text: '#1A1A1A',
    quiet: '#5F5F5F',
};
const FONT = "Poppins, 'Segoe UI', Arial, sans-serif";

const T = {
    en: {
        locale: 'en-US',
        flows: { Exports: 'Exports', Imports: 'Imports' },
        peak: (v, y) => `${v} in ${y}`,
        last: (v, y) => `${v} in ${y}, incomplete`,
        world: 'World exports and imports of licorice extract reported to UN Comtrade, USD million, 2000–2024',
        latest: (v, y) => `USD ${v} million in ${y}`,
        countries: { 'United States': 'United States', Iran: 'Iran', China: 'China', France: 'France', Germany: 'Germany', Uzbekistan: 'Uzbekistan' },
        exporters: 'Exports of licorice extract by country, USD million, 2000–2024',
    },
    ru: {
        locale: 'ru-RU',
        flows: { Exports: 'Экспорт', Imports: 'Импорт' },
        peak: (v, y) => `${v} в ${y} г.`,
        last: (v, y) => `${v} в ${y} г., неполные данные`,
        world: 'Мировой экспорт и импорт экстракта солодки по данным UN Comtrade, млн долл. США, 2000–2024',
        latest: (v, y) => `${v} млн долл. в ${y} г.`,
        countries: { 'United States': 'США', Iran: 'Иран', China: 'Китай', France: 'Франция', Germany: 'Германия', Uzbekistan: 'Узбекистан' },
        exporters: 'Экспорт экстракта солодки по странам, млн долл. США, 2000–2024',
    },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const num = (v, lang) => v.toLocaleString(T[lang].locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const text = (x, y, s, { fill = C.quiet, anchor = 'start', size = 12, weight = 400 } = {}) =>
    `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${esc(s)}</text>`;
const svg = (w, h, title, body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" font-family="${FONT}"><title>${esc(title)}</title><rect width="${w}" height="${h}" fill="#FFFFFF"/>${body}</svg>\n`;

/** Chart 1: world exports (olive) and imports (grey), one line each. */
function worldChart(lang) {
    const t = T[lang];
    const W = 480, H = 300, left = 38, right = 466, y0 = 40, base = 262, vmax = 250;
    const x = (yr) => left + ((yr - 2000) / 24) * (right - left);
    const y = (v) => base - (v / vmax) * (base - y0);
    const series = (flow) => DATA.world.filter((r) => r.flow === flow);
    const path = (rows) => rows.map((r, i) => `${i ? 'L' : 'M'}${x(r.year).toFixed(1)},${y(r.v).toFixed(1)}`).join(' ');
    const ex = series('Exports'), im = series('Imports');
    const peak = ex.reduce((m, r) => (r.v > m.v ? r : m), ex[0]);
    const last = ex.at(-1);
    let b = '';
    for (const v of [0, 50, 100, 150, 200, 250]) {
        b += `<line x1="${left}" x2="${right}" y1="${y(v)}" y2="${y(v)}" stroke="${v ? C.grid : C.axis}"/>`;
        b += text(left - 6, y(v) + 4, v, { anchor: 'end' });
    }
    for (const yr of [2000, 2006, 2012, 2018, 2024]) b += text(x(yr), base + 20, yr, { anchor: yr === 2000 ? 'start' : yr === 2024 ? 'end' : 'middle' });
    // Legend
    b += `<line x1="${left}" x2="${left + 18}" y1="14" y2="14" stroke="${C.main}" stroke-width="2.5"/>` + text(left + 24, 18, t.flows.Exports, { fill: C.text });
    b += `<line x1="${left + 110}" x2="${left + 128}" y1="14" y2="14" stroke="${C.muted}" stroke-width="2"/>` + text(left + 134, 18, t.flows.Imports);
    b += `<path d="${path(im)}" fill="none" stroke="${C.muted}" stroke-width="2"/>`;
    b += im.map((r) => `<circle cx="${x(r.year).toFixed(1)}" cy="${y(r.v).toFixed(1)}" r="2" fill="${C.muted}"/>`).join('');
    b += `<path d="${path(ex)}" fill="none" stroke="${C.main}" stroke-width="2.5"/>`;
    b += ex.map((r) => `<circle cx="${x(r.year).toFixed(1)}" cy="${y(r.v).toFixed(1)}" r="${r === peak || r === last ? 4 : 2.2}" fill="${C.main}"/>`).join('');
    b += text(x(peak.year) - 8, y(240), t.peak(num(peak.v, lang), peak.year), { fill: C.text, anchor: 'end' });
    b += text(x(last.year), y(last.v) + 22, t.last(num(last.v, lang), last.year), { fill: C.text, anchor: 'end' });
    return svg(W, H, t.world, b);
}

/** Chart 2: one small panel per exporter, the others in faint grey behind. */
function exportersChart(lang) {
    const t = T[lang];
    const rows = DATA.exporters;
    const names = [...new Set(rows.map((r) => r.country))];
    const pts = (c) => rows.filter((r) => r.country === c);
    const latest = (c) => pts(c).at(-1);
    const order = names.slice().sort((a, b) => latest(b).v - latest(a).v);
    const W = 480, pw = 196, ph = 78, gx = 240, gy = 138, ox = 30, oy = 46, vmax = 60;
    const H = oy + 2 * gy + ph + 26;
    let b = '';
    order.forEach((c, k) => {
        const px = ox + (k % 2) * gx, py = oy + Math.floor(k / 2) * gy;
        const X = (yr) => px + ((yr - 2000) / 24) * pw;
        const Y = (v) => py + ph - (v / vmax) * ph;
        const d = (s) => {
            const p = pts(s);
            return p.map((r, i) => `${i && p[i - 1].year === r.year - 1 ? 'L' : 'M'}${X(r.year).toFixed(1)},${Y(r.v).toFixed(1)}`).join(' ');
        };
        const last = latest(c);
        b += text(px, py - 26, t.countries[c], { fill: C.text, size: 13, weight: 600 });
        b += text(px, py - 10, t.latest(num(last.v, lang), last.year));
        for (const v of [0, 30, 60]) {
            b += `<line x1="${px}" x2="${px + pw}" y1="${Y(v)}" y2="${Y(v)}" stroke="${v ? C.grid : C.axis}"/>`;
            if (k % 2 === 0) b += text(px - 5, Y(v) + 4, v, { anchor: 'end', size: 11 });
        }
        b += text(X(2000), py + ph + 15, 2000, { size: 11 }) + text(X(2024), py + ph + 15, 2024, { size: 11, anchor: 'end' });
        for (const n of names) if (n !== c) b += `<path d="${d(n)}" fill="none" stroke="${C.faint}" stroke-width="1.2"/>`;
        b += `<path d="${d(c)}" fill="none" stroke="${C.main}" stroke-width="2.3"/>`;
        b += `<circle cx="${X(last.year).toFixed(1)}" cy="${Y(last.v).toFixed(1)}" r="3.5" fill="${C.main}"/>`;
    });
    return svg(W, H, t.exporters, b);
}

mkdirSync(OUT, { recursive: true });
for (const lang of ['en', 'ru']) {
    writeFileSync(join(OUT, `world-exports-imports.${lang}.svg`), worldChart(lang));
    writeFileSync(join(OUT, `exporters-by-country.${lang}.svg`), exportersChart(lang));
}
console.log(`wrote 4 SVG files to ${OUT}`);
