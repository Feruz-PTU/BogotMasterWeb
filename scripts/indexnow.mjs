/**
 * IndexNow: tell Bing, Yandex, Naver, Seznam and Yep which pages changed.
 * (Google does not take part; for Google the sitemap is the only signal.)
 *
 * The prerender calls submitChanges() at the end of every PRODUCTION build
 * on Vercel. It sends only the pages whose content fingerprint changed since
 * the live build (the same test that moves their sitemap <lastmod>), plus any
 * page that no longer exists. Engines stop trusting a site that pings pages
 * which did not change, so an admin save that touches one product sends one
 * or two URLs, not the whole site.
 *
 * It never fails the build: any problem is logged and the build carries on.
 *
 * Timing: the build finishes a few seconds before Vercel puts the new version
 * live. The engines fetch the pages later than that, so they see the new one.
 *
 * Once by hand, after the first deploy with the key file, send every URL:
 *     node scripts/indexnow.mjs --all
 */

import { fileURLToPath } from 'node:url';

/**
 * Not a secret: the engines read it from https://bogotmaster.org/<key>.txt
 * to check that the site sent the request. It only has to stay the same.
 */
export const INDEXNOW_KEY = '53582725df4c16c3ae86f5b9b4f25825';
export const KEY_FILE = `${INDEXNOW_KEY}.txt`;

// The shared endpoint passes each submission on to every participating engine.
const ENDPOINT = 'https://api.indexnow.org/indexnow';

/**
 * The absolute URLs to submit: pages whose lastmod moved to `now` in this
 * build, and pages the live build had that this one does not. Sorted, so the
 * build log is easy to read.
 */
export function changedUrls(previousPages, currentPages, now, siteUrl) {
    const changed = Object.entries(currentPages)
        .filter(([, { lastmod }]) => lastmod === now)
        .map(([path]) => path);
    const removed = Object.keys(previousPages).filter((path) => !(path in currentPages));
    return [...changed, ...removed].sort().map((path) => `${siteUrl}${path}`);
}

/** Whether the key file is already served by the live site. */
async function keyIsLive(siteUrl) {
    try {
        const res = await fetch(`${siteUrl}/${KEY_FILE}`, { signal: AbortSignal.timeout(10_000) });
        return res.ok && (await res.text()).trim() === INDEXNOW_KEY;
    } catch {
        return false;
    }
}

// What the endpoint's answers mean (indexnow.org/documentation).
const STATUS_TEXT = {
    200: 'accepted',
    202: 'accepted, key check pending',
    400: 'bad request',
    403: 'key not valid or not found on the site',
    422: 'URLs do not belong to the host, or key mismatch',
    429: 'too many requests',
};

/** POST the list; returns a one-line result. Never throws. */
export async function submitUrls(urls, siteUrl) {
    if (!urls.length) return 'nothing changed, nothing sent';
    if (!(await keyIsLive(siteUrl))) {
        return `skipped: ${siteUrl}/${KEY_FILE} is not live yet (run "node scripts/indexnow.mjs --all" after this deploy)`;
    }
    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({
                host: new URL(siteUrl).host,
                key: INDEXNOW_KEY,
                keyLocation: `${siteUrl}/${KEY_FILE}`,
                urlList: urls.slice(0, 10_000),
            }),
            signal: AbortSignal.timeout(15_000),
        });
        const text = STATUS_TEXT[res.status] || 'unexpected answer';
        return `${res.ok ? 'sent' : 'NOT sent'} ${urls.length} URL${urls.length === 1 ? '' : 's'}: HTTP ${res.status} (${text})`;
    } catch (err) {
        return `NOT sent: ${err.message}`;
    }
}

/**
 * Called by the prerender. Sends only on Vercel production builds, and only
 * when the live build's state was read: without it every page looks changed.
 */
export async function submitChanges({ previous, current, now, siteUrl }) {
    if (process.env.VERCEL_ENV !== 'production') return 'skipped: not a production build';
    if (previous.reason) return `skipped: no previous state (${previous.reason})`;
    const urls = changedUrls(previous.pages, current, now, siteUrl);
    const result = await submitUrls(urls, siteUrl);
    return urls.length ? `${result}\n    ${urls.join('\n    ')}` : result;
}

// ── By hand: node scripts/indexnow.mjs --all ─────────────────────────────────
// Sends every URL in the live sitemap. For the first time only, or after a
// big change across the whole site.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    const SITE_URL = 'https://bogotmaster.org';
    if (!process.argv.includes('--all')) {
        console.log('Usage: node scripts/indexnow.mjs --all   (sends every URL in the live sitemap)');
        process.exit(1);
    }
    const sitemap = await (await fetch(`${SITE_URL}/sitemap.xml`)).text();
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
    console.log(`IndexNow: ${await submitUrls(urls, SITE_URL)}`);
}
