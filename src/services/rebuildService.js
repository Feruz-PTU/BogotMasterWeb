import { supabase } from '../supabase/config';

/**
 * Ask the server to rebuild the public site after an admin edit.
 *
 * The public pages are prerendered, so a saved change is not visible to
 * visitors until a new build finishes. This sends the admin's access token to
 * /api/rebuild, which verifies it and then calls the Vercel Deploy Hook. The
 * hook URL itself is never exposed to the browser.
 *
 * Returns { success, message } and never throws — a failed rebuild must not
 * make a successful save look like a failure.
 */
export async function requestRebuild() {
    try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (!token) {
            return { success: false, message: 'Not signed in' };
        }

        const res = await fetch('/api/rebuild', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });

        let body = {};
        try {
            body = await res.json();
        } catch {
            /* non-JSON */
        }

        if (!res.ok || !body.success) {
            return {
                success: false,
                message: body.message || `Rebuild failed (${res.status})`,
            };
        }
        return { success: true, message: body.message, skipped: body.skipped };
    } catch {
        return { success: false, message: 'Could not reach the rebuild service' };
    }
}
