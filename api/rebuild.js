/**
 * POST /api/rebuild — ask Vercel to rebuild the site.
 *
 * Why this exists: the public pages are now prerendered at build time, so an
 * edit in the admin panel only reaches visitors after a new build. This
 * triggers one.
 *
 * Why it is a server function rather than a fetch from the dashboard: a Vercel
 * Deploy Hook URL is a secret. Anyone who has it can force unlimited builds on
 * the account. It must never appear in browser code, so it lives only in
 * VERCEL_DEPLOY_HOOK_URL here, and the browser calls this endpoint instead.
 *
 * Authorisation: the caller must send the Supabase access token of a signed-in
 * user, which this function verifies against Supabase's own /auth/v1/user
 * endpoint. An anonymous caller cannot trigger a build.
 *
 * Required environment variables (Vercel → Settings → Environment Variables):
 *   VERCEL_DEPLOY_HOOK_URL   the hook from Settings → Git → Deploy Hooks
 *   VITE_SUPABASE_URL        already set (used by the build)
 *   VITE_SUPABASE_ANON_KEY   already set (used by the build)
 */

// A rebuild takes a couple of minutes, so collapse bursts of saves. This is
// in-memory and therefore best-effort across serverless instances — it is a
// courtesy to avoid queueing ten builds, not a security control.
let lastTriggeredAt = 0;
const COOLDOWN_MS = 60 * 1000;

function originAllowed(req) {
    const origin = req.headers.origin;
    if (!origin) return false;
    let host;
    try {
        host = new URL(origin).host;
    } catch {
        return false;
    }
    const allow = (process.env.ALLOWED_ORIGIN || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    if (allow.length) return allow.includes(host);
    return host === req.headers.host;
}

/** Returns the signed-in user, or null. */
async function verifyAdmin(req) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token) return null;

    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) return null;

    try {
        const res = await fetch(`${url}/auth/v1/user`, {
            headers: { apikey: key, Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return null;
        const user = await res.json();
        return user?.id ? user : null;
    } catch {
        return null;
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res
            .status(405)
            .json({ success: false, message: 'Method not allowed' });
    }

    if (!originAllowed(req)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const user = await verifyAdmin(req);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Not signed in' });
    }

    const hook = process.env.VERCEL_DEPLOY_HOOK_URL;
    if (!hook) {
        console.error('[rebuild] VERCEL_DEPLOY_HOOK_URL is not set');
        return res.status(500).json({
            success: false,
            message: 'Rebuild is not configured yet',
        });
    }

    const now = Date.now();
    if (now - lastTriggeredAt < COOLDOWN_MS) {
        return res.status(200).json({
            success: true,
            skipped: true,
            message: 'A rebuild was just started; this change is included.',
        });
    }

    try {
        const hookRes = await fetch(hook, { method: 'POST' });
        if (!hookRes.ok) {
            return res.status(502).json({
                success: false,
                message: `Vercel refused the rebuild (${hookRes.status})`,
            });
        }
        lastTriggeredAt = now;
        return res.status(200).json({
            success: true,
            message: 'Rebuild started. The site updates in a few minutes.',
        });
    } catch {
        return res
            .status(502)
            .json({ success: false, message: 'Could not reach Vercel' });
    }
}
