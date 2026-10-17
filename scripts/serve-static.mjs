/**
 * A static server that behaves the way Vercel will serve dist/.
 *
 * `vite preview` is NOT a fair test: it falls back to index.html for every
 * unknown path, so a broken route and a real 404 both look like a working
 * page. This serves the exact file, then <dir>/index.html, and otherwise
 * returns 404.html with a real HTTP 404 — which is the behaviour the whole
 * prerender change depends on.
 *
 * It also applies the /admin rewrite and the cache headers from vercel.json
 * so what you measure locally resembles production.
 *
 * Usage: node scripts/serve-static.mjs [port]
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, brotliCompressSync } from 'node:zlib';

/** Vercel compresses text responses. Without this, a local measurement sends
 *  27 KB of HTML uncompressed against production's ~6 KB, which makes the new
 *  build look far slower than it is. */
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.xml', '.txt', '.svg']);

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const PORT = Number(process.argv[2] || 4173);

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();

createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);

    const headers = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    // /admin/* -> admin.html, noindex (mirrors vercel.json)
    if (url === '/admin' || url.startsWith('/admin/')) {
        headers['X-Robots-Tag'] = 'noindex, nofollow';
        headers['Content-Type'] = TYPES['.html'];
        res.writeHead(200, headers);
        return res.end(readFileSync(join(DIST, 'admin.html')));
    }

    const candidates = [
        join(DIST, url),
        join(DIST, url, 'index.html'),
    ];
    const hit = candidates.find(isFile);

    const send = (status, file, ext) => {
        let body = readFileSync(file);
        headers['Content-Type'] = TYPES[ext] || 'application/octet-stream';
        headers['Cache-Control'] = url.startsWith('/assets/') || url.startsWith('/fonts/')
            ? 'public, max-age=31536000, immutable'
            : ext === '.html'
              ? 'public, max-age=0, must-revalidate'
              : 'public, max-age=2592000';

        const accept = String(req.headers['accept-encoding'] || '');
        if (COMPRESSIBLE.has(ext)) {
            if (accept.includes('br')) {
                body = brotliCompressSync(body);
                headers['Content-Encoding'] = 'br';
            } else if (accept.includes('gzip')) {
                body = gzipSync(body);
                headers['Content-Encoding'] = 'gzip';
            }
            headers.Vary = 'Accept-Encoding';
        }
        headers['Content-Length'] = body.length;
        res.writeHead(status, headers);
        res.end(body);
    };

    if (hit) return send(200, hit, extname(hit));

    // Real 404, exactly as Vercel does for an unmatched path.
    send(404, join(DIST, '404.html'), '.html');
}).listen(PORT, () => {
    console.log(`Serving dist/ like Vercel on http://localhost:${PORT}`);
});
