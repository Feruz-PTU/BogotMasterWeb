/**
 * sitemap.xml — every indexable URL, and when each one last changed.
 *
 * Called by scripts/prerender.mjs, which owns the route list. It lives in its
 * own file because two things here are deliberate and easy to "simplify" by
 * mistake:
 *
 * 1. ELEMENT ORDER, AND NOTHING EXTRA. The sitemap schema is a strict
 *    sequence: <loc>, <lastmod>, <priority>. The previous sitemap put hreflang
 *    <xhtml:link> lines between <loc> and <lastmod> and failed validation on
 *    every entry. Those lines are gone on purpose, not forgotten: every page
 *    already declares its language versions in its own <head> (SEO.jsx),
 *    Google treats the two methods as equivalent, and Yandex no longer reads
 *    language versions from a sitemap at all.
 *
 * 2. <lastmod> IS NOT THE BUILD DATE. The site rebuilds on every admin save,
 *    so stamping the build date told search engines that all pages changed
 *    whenever one product was edited. Google only trusts lastmod while it is
 *    consistently accurate, so it is derived from the content instead: a page
 *    keeps its date until its fingerprint changes.
 */

import { createHash } from 'node:crypto';

/** Published next to sitemap.xml; the next build reads it back from the live site. */
export const STATE_FILE = 'sitemap-state.json';

/** W3C Datetime, to the second, in UTC: 2026-10-11T07:15:02+00:00 */
export const toW3CDate = (date) =>
    date.toISOString().replace(/\.\d{3}Z$/, '+00:00');

const W3C_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+00:00$/;

const XML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
};
const escapeXml = (value) =>
    String(value).replace(/[&<>"']/g, (c) => XML_ENTITIES[c]);

/**
 * A hash of what a search engine would call the page's content: the <head>
 * tags (title, description, canonical, hreflang, structured data) and, from
 * <main>, the visible text, the images and the links.
 *
 * Deliberately NOT a hash of the raw HTML:
 *   - the header and footer are skipped, so the copyright year rolling over
 *     on 1 January does not "modify" every page (Google names exactly that
 *     as a change that must not move lastmod);
 *   - class names and other markup are skipped, so a restyle is not a
 *     content change;
 *   - images and links are compared as sorted sets, because the factory
 *     gallery on the home page is shuffled randomly on every render.
 *
 * `rendered` is the { html, head } pair returned by entry-server's render().
 */
export function pageFingerprint({ html, head }) {
    const main = html.match(/<main\b[^>]*>([\s\S]*)<\/main>/i)?.[1] ?? html;

    const attributeValues = (name) =>
        [
            ...new Set(
                [...main.matchAll(new RegExp(`\\s${name}="([^"]*)"`, 'g'))].map(
                    (m) => m[1]
                )
            ),
        ].sort();

    const text = main
        .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return createHash('sha256')
        .update(
            JSON.stringify([
                head,
                text,
                attributeValues('src'),
                attributeValues('href'),
            ])
        )
        .digest('hex');
}

/**
 * The state the LIVE site was built with: { '/products': { hash, lastmod } }.
 *
 * It is read over HTTP from the deployed site because there is nowhere else
 * to keep it: Vercel builds from a clean checkout and cannot commit back to
 * the repository.
 *
 * Never throws. With no state (the first deploy, or the site unreachable) the
 * caller dates every page "now" — which is what the old sitemap did on every
 * single build, so the worst case here is the old normal case.
 */
export async function loadPreviousState(url) {
    let reason;
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
            if (res.status === 404) return { pages: {}, reason: 'none published yet' };
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const { pages } = await res.json();
            if (!pages || typeof pages !== 'object') throw new Error('unexpected format');
            return { pages };
        } catch (err) {
            reason = err.message;
        }
    }
    return { pages: {}, reason };
}

/**
 * Decide each page's lastmod: keep the published date while the fingerprint
 * is unchanged, otherwise the page changed in this build.
 *
 * The published date is re-checked rather than trusted, because it arrives
 * over the network and an unchanged page would otherwise carry a bad value
 * forward forever. Both dates are fixed-width UTC strings, so comparing them
 * as text compares them in time.
 */
export function resolveLastmod(fingerprints, previousPages, now) {
    const pages = {};
    for (const [urlPath, hash] of Object.entries(fingerprints)) {
        const previous = previousPages[urlPath];
        const unchanged =
            previous?.hash === hash &&
            W3C_UTC.test(previous.lastmod) &&
            previous.lastmod <= now;
        pages[urlPath] = { hash, lastmod: unchanged ? previous.lastmod : now };
    }
    return pages;
}

/**
 * `entries` is [{ loc, lastmod, priority }], `loc` being an absolute URL.
 *
 * <priority> is kept although Google ignores it: Yandex still loads a
 * sitemap's pages in priority order. <changefreq> is left out because nothing
 * here could state it honestly, and lastmod is the better signal anyway.
 */
export function buildSitemapXml(entries) {
    const urls = entries.map(
        ({ loc, lastmod, priority }) =>
            `  <url>\n` +
            // new URL() percent-encodes anything a slug should not contain
            // (spaces, Cyrillic) and throws on a URL that is not absolute.
            `    <loc>${escapeXml(new URL(loc).href)}</loc>\n` +
            `    <lastmod>${escapeXml(lastmod)}</lastmod>\n` +
            `    <priority>${escapeXml(priority)}</priority>\n` +
            `  </url>`
    );

    return (
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        urls.join('\n') +
        `\n</urlset>\n`
    );
}
