/**
 * Page texts, loaded the same way as the article texts (see
 * ../articles/bodies.js): each Markdown file is its own chunk in the browser,
 * fetched only when that page is opened, and entry-server.jsx hands every
 * text to the prerender up front.
 */
const LAZY = import.meta.glob('./*.md', { query: '?raw', import: 'default' });

/** Filled by the server build only; empty in the browser. */
const PROVIDED = {};

const fileFor = (id, language) => `./${id}.${language}.md`;

/** Called by entry-server.jsx with the result of an eager import.meta.glob. */
export function provideBodies(texts) {
    Object.assign(PROVIDED, texts);
}

/** The text, if it is already at hand (server build only). */
export const bodyNow = (id, language) => PROVIDED[fileFor(id, language)];

/** A promise of the text, or undefined if there is no such file. */
export const loadBody = (id, language) => LAZY[fileFor(id, language)]?.();
