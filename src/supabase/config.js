import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set in .env — image uploads will fail.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

// ─── Auth (admin) ──────────────────────────────────────────────────────────

export async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
}

export async function signOut() {
    await supabase.auth.signOut();
}

// Calls back with the user (or null) immediately and on every auth change.
// Returns an unsubscribe function.
export function onAuth(callback) {
    supabase.auth.getSession().then(({ data }) => callback(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
}

function assertConfigured() {
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    }
}

export async function uploadProductImage(slug, file) {
    assertConfigured();
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const path = `${slug}/${fileName}`;

    const { error } = await supabase.storage
        .from('products')
        .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage
        .from('products')
        .getPublicUrl(path);

    return data.publicUrl;
}

export async function uploadGalleryImage(file) {
    assertConfigured();
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}.${ext}`;
    const path = `image-${fileName}`;

    const { error } = await supabase.storage
        .from('gallery')
        .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage
        .from('gallery')
        .getPublicUrl(path);

    return data.publicUrl;
}
