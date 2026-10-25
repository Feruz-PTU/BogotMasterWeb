/**
 * Grades by root diameter (folder 28): the table (components/GradeTable.jsx)
 * on /products, on each slice and tablet page, and in the buyer's guide
 * chapter "Choosing a form and grade" (its {{grade-table}} line). It is built
 * from the product data, never typed by hand, so it changes when a product's
 * grade does.
 *
 * A slice or tablet keeps its grade in specs.<lang>.diameter_grade as
 * "CODE (range)": "A (about 30 mm and over)", "1.2 (12 mm)", "D (offcuts of
 * A–C1)", or just "Mix". The ranges are the owner's (22–23 Oct 2026); slices
 * are sorted by hand, so their ranges say "about".
 */
import { groupOf } from './productGroups.js';

/** The catalogue groups that come in diameter grades. */
export const GRADE_FORMS = ['slices', 'tablets'];

// Letter grades from the largest root to the offcuts; sizes such as "1.2"
// follow in size order, then anything else, then Mix.
const LETTERS = ['A', 'B', 'C', 'C1', 'L', 'S', 'D'];
const VALUE = /^\s*([^()]+?)\s*\((.+)\)\s*$/;

/** "A (about 30 mm and over)" → { code: 'A', range: 'about 30 mm and over' }; "Mix" → { code: 'Mix', range: null }. */
export function parseGrade(value) {
    const text = String(value ?? '').trim();
    if (!text || text === '-') return null;
    if (/^mix$/i.test(text)) return { code: 'Mix', range: null };
    const match = text.match(VALUE);
    return match ? { code: match[1], range: match[2] } : { code: text, range: null };
}

function rank(code) {
    const letter = LETTERS.indexOf(code);
    if (letter >= 0) return [0, letter];
    if (/^\d/.test(code)) return [1, parseFloat(code)];
    if (code === 'Mix') return [3, 0];
    return [2, 0];
}

/**
 * The rows of the table for `forms` (catalogue group ids), from `products`
 * (the visible products, in one language, as ContentContext gives them):
 * [{ code, range, products: { slices: [product], tablets: [product] } }].
 */
export function gradeRows(products, forms = GRADE_FORMS) {
    const rows = new Map();
    for (const product of products) {
        const form = groupOf(product);
        if (!forms.includes(form)) continue;
        const grade = parseGrade(product.activeSpecs?.diameter_grade);
        if (!grade) continue;
        if (!rows.has(grade.code)) rows.set(grade.code, { code: grade.code, range: grade.range, products: {} });
        const row = rows.get(grade.code);
        if (!row.range && grade.range) row.range = grade.range;
        (row.products[form] ||= []).push(product);
    }
    return [...rows.values()].sort((a, b) => {
        const [ga, va] = rank(a.code);
        const [gb, vb] = rank(b.code);
        return ga - gb || va - vb;
    });
}

/** A row's diameter text: its range, "mixed diameters" for Mix, else a dash. */
export const rangeText = (row, t) => row.range || (row.code === 'Mix' ? t('grades_mix') : '—');
