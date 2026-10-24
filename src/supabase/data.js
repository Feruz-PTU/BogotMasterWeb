import { supabase } from './config';

export { SEED_PRODUCTS, SEED_SETTINGS, SEED_TRANSLATIONS } from '../data/seed';
import { SEED_PRODUCTS, SEED_SETTINGS, SEED_TRANSLATIONS } from '../data/seed';

// All dynamic content lives in Postgres (Supabase). Tables store the original
// Firestore-style documents inside a `data` jsonb column, so the rest of the app
// keeps reading the same flat object shape (title_ru, desc_en, specs, …).

// ─── Products ────────────────────────────────────────────────────────────────

export async function fetchProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('order', { ascending: true });
    if (error) throw error;
    return data.map(r => ({ ...r.data, slug: r.slug, order: r.order, docId: r.slug }));
}

export async function fetchProductBySlug(slug) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { ...data.data, slug: data.slug, order: data.order, docId: data.slug };
}

export async function saveProduct(product) {
    const { error } = await supabase
        .from('products')
        .upsert({ slug: product.slug, order: product.order ?? 0, data: product });
    if (error) throw error;
}

// Several products in one request, so they are saved together or not at all
// (a product family is stored on each of its members).
export async function saveProducts(products) {
    const { error } = await supabase
        .from('products')
        .upsert(products.map((p) => ({ slug: p.slug, order: p.order ?? 0, data: p })));
    if (error) throw error;
}

export async function deleteProduct(slug) {
    const { error } = await supabase.from('products').delete().eq('slug', slug);
    if (error) throw error;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function fetchSettings() {
    const { data, error } = await supabase
        .from('settings')
        .select('data')
        .eq('id', 'main')
        .maybeSingle();
    if (error) throw error;
    return data?.data ?? null;
}

export async function saveSettings(patch) {
    // Mirror Firestore setDoc({ merge: true }) — merge top-level keys into existing.
    const { data: existing } = await supabase
        .from('settings')
        .select('data')
        .eq('id', 'main')
        .maybeSingle();
    const merged = { ...(existing?.data ?? {}), ...patch };
    const { error } = await supabase
        .from('settings')
        .upsert({ id: 'main', data: merged });
    if (error) throw error;
}

// ─── Translations ────────────────────────────────────────────────────────────

export async function fetchTranslations() {
    const { data, error } = await supabase
        .from('settings')
        .select('data')
        .eq('id', 'translations')
        .maybeSingle();
    if (error) throw error;
    return data?.data ?? null;
}

export async function saveTranslations(data) {
    const { error } = await supabase
        .from('settings')
        .upsert({ id: 'translations', data });
    if (error) throw error;
}

// ─── Seed ────────────────────────────────────────────────────────────────────

export async function seedDatabase() {
    const productRows = SEED_PRODUCTS.map(p => ({
        slug: p.slug, order: p.order ?? 0, data: p,
    }));
    const { error: pErr } = await supabase.from('products').upsert(productRows);
    if (pErr) throw pErr;

    const { error: sErr } = await supabase.from('settings').upsert([
        { id: 'main', data: SEED_SETTINGS },
        { id: 'translations', data: SEED_TRANSLATIONS },
    ]);
    if (sErr) throw sErr;
}

export async function isDatabaseSeeded() {
    const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return (count ?? 0) > 0;
}

// ─── Inquiries ───────────────────────────────────────────────────────────────

export async function saveInquiry(data) {
    const { error } = await supabase.from('inquiries').insert({ data });
    if (error) throw error;
}

export async function fetchInquiries() {
    const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(r => ({ ...r.data, id: r.id, read: r.read, createdAt: r.created_at }));
}

export async function markInquiryRead(id) {
    const { error } = await supabase.from('inquiries').update({ read: true }).eq('id', id);
    if (error) throw error;
}

export async function deleteInquiry(id) {
    const { error } = await supabase.from('inquiries').delete().eq('id', id);
    if (error) throw error;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function trackPageView(path) {
    const key = path.replace(/\//g, '_').replace(/\./g, '_').replace(/^_/, '') || 'home';
    try {
        // SECURITY DEFINER RPC handles the atomic upsert + increment so anonymous
        // visitors can be counted without direct write access to the stats table.
        await supabase.rpc('increment_pageview', { p_key: key });
    } catch {
        // Never break the user-facing app over analytics.
    }
}

// ─── Events (cookieless analytics) ──────────────────────────────────────────

/**
 * Records one interaction. No visitor identifier is stored, so rows cannot be
 * joined into a profile of an individual — see src/analytics.js.
 * Allowed event names are enforced again by a CHECK constraint in the
 * database (supabase/phase2-migration.sql).
 */
export async function recordEvent({ name, path, lang, referrer_host, detail }) {
    const row = {
        name: String(name).slice(0, 40),
        path: path ? String(path).slice(0, 200) : null,
        lang: lang ? String(lang).slice(0, 8) : null,
        referrer_host: referrer_host ? String(referrer_host).slice(0, 120) : null,
    };
    // Only sent when there is one: the column exists once
    // supabase/phase3-events.sql has been run.
    if (detail) row.detail = String(detail).slice(0, 120);
    const { error } = await supabase.from('events').insert(row);
    if (error) throw error;
}

export async function fetchEventSummary(days = 30) {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const query = (columns) =>
        supabase
            .from('events')
            .select(columns)
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(5000);
    let { data, error } = await query('name, path, lang, referrer_host, detail, created_at');
    // Before phase3-events.sql there is no `detail` column.
    if (error && ['PGRST204', '42703'].includes(error.code)) {
        ({ data, error } = await query('name, path, lang, referrer_host, created_at'));
    }
    if (error) throw error;
    return data || [];
}

export async function fetchStats() {
    try {
        const { data, error } = await supabase
            .from('stats')
            .select('*')
            .eq('id', 'pageviews')
            .maybeSingle();
        if (error || !data) return { total: 0, paths: {} };
        return { total: data.total || 0, paths: data.paths || {} };
    } catch {
        return { total: 0, paths: {} };
    }
}
