/**
 * Article texts, loaded so that no page pays for an article it does not show.
 *
 * In the browser each article is its own chunk, fetched only when someone
 * opens that article. A long review is tens of kilobytes; bundled the way the
 * rest of the site's text is, every page would download every article.
 *
 * The prerender step cannot wait for a chunk (renderToString is synchronous),
 * so entry-server.jsx, which only the server build includes, imports every
 * text up front and hands them over with provideBodies().
 */
const LAZY = import.meta.glob('./*.md', { query: '?raw', import: 'default' });

/** Filled by the server build only; empty in the browser. */
const PROVIDED = {};

const fileFor = (slug, language) => `./${slug}.${language}.md`;

/** Called by entry-server.jsx with the result of an eager import.meta.glob. */
export function provideBodies(texts) {
    Object.assign(PROVIDED, texts);
}

/** The text, if it is already at hand (server build only). */
export const bodyNow = (slug, language) => PROVIDED[fileFor(slug, language)];

/** A promise of the text, or undefined if there is no such file. */
export const loadBody = (slug, language) => LAZY[fileFor(slug, language)]?.();
