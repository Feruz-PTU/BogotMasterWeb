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

// ─── FAQ ─────────────────────────────────────────────────────────────────────
// One row per question (supabase/faq.sql). slug, order and status are
// columns; the rest is the `data` document, flattened here like the other
// tables. A visitor can read published rows only; the admin reads them all.
// Public pages never call these: the build writes the published answers to
// src/data/build-faq.json (scripts/fetch-content.mjs).

const faqFromRow = (r) => ({
    ...r.data,
    id: r.id,
    slug: r.slug,
    order: r.order,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
});

// eslint-disable-next-line no-unused-vars -- createdAt/updatedAt are set by the database, so they are left out
const faqToRow = ({ id, slug, order, status, createdAt, updatedAt, ...data }) => ({
    ...(id ? { id } : {}),
    slug,
    order: order ?? 0,
    status: status || 'draft',
    data,
});

export async function fetchFaq() {
    const { data, error } = await supabase
        .from('faq')
        .select('*')
        .order('order', { ascending: true });
    if (error) throw error;
    return data.map(faqFromRow);
}

/** Adds the answer (no id yet) or updates it; returns the row as saved. */
export async function saveFaq(item) {
    const row = faqToRow(item);
    const query = row.id
        ? supabase.from('faq').update(row).eq('id', row.id)
        : supabase.from('faq').insert(row);
    const { data, error } = await query.select().single();
    if (error) throw error;
    return faqFromRow(data);
}

/** Several existing answers in one request (a new order inside a group). */
export async function saveFaqs(items) {
    const { error } = await supabase
        .from('faq')
        .upsert(items.map(faqToRow), { onConflict: 'id' });
    if (error) throw error;
}

export async function deleteFaq(id) {
    const { error } = await supabase.from('faq').delete().eq('id', id);
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

// A lead's status (folder 25) lives in its own columns, added by
// supabase/phase4-lead-status.sql, never in `data`, which visitors write.
const STATUS_FIELDS = ['status', 'lost_reason', 'first_reply_at', 'status_updated_at', 'status_history'];

function inquiryFromRow(r) {
    const lead = { ...r.data, id: r.id, read: r.read, createdAt: r.created_at };
    for (const f of STATUS_FIELDS) delete lead[f];
    // Before the SQL has been run the row has no status, and the admin says so.
    if ('status' in r) for (const f of STATUS_FIELDS) lead[f] = r[f];
    return lead;
}

export async function fetchInquiries() {
    const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(inquiryFromRow);
}

/**
 * Saves a lead's five status fields (worked out by utils/leadStatus.js) and
 * returns them as saved. The database's row rules let only the admin update a
 * lead; an update they block changes no row, so an empty answer is an error.
 */
export async function updateInquiryStatus(id, patch) {
    const fields = Object.fromEntries(STATUS_FIELDS.map((f) => [f, patch[f] ?? null]));
    if (!Array.isArray(fields.status_history)) fields.status_history = [];
    const { data, error } = await supabase
        .from('inquiries')
        .update(fields)
        .eq('id', id)
        .select(STATUS_FIELDS.join(', '));
    if (error) throw error;
    if (!data?.length) throw new Error('The lead was not saved: it may have been deleted, or this account may not edit leads.');
    return Object.fromEntries(STATUS_FIELDS.map((f) => [f, data[0][f]]));
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

// Supabase answers at most 1000 rows per request (the project's "max rows"),
// whatever limit is asked for, so longer lists are read a page at a time.
const PAGE_ROWS = 1000;
async function fetchAllPages(build, maxRows = 20000) {
    const rows = [];
    for (let from = 0; from < maxRows; from += PAGE_ROWS) {
        const { data, error } = await build().range(from, from + PAGE_ROWS - 1);
        if (error) throw error;
        rows.push(...(data || []));
        if (!data || data.length < PAGE_ROWS) break;
    }
    return rows;
}

export async function fetchEventSummary(days = 30) {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const pages = (columns) => fetchAllPages(() =>
        supabase
            .from('events')
            .select(columns)
            .gte('created_at', since)
            .order('created_at', { ascending: false }));
    try {
        return await pages('name, path, lang, referrer_host, detail, created_at');
    } catch (error) {
        // Before phase3-events.sql there is no `detail` column.
        if (['PGRST204', '42703'].includes(error?.code)) return pages('name, path, lang, referrer_host, created_at');
        throw error;
    }
}

/** Product-page views (/products/<slug>, any language), for leads per 100 views. */
export async function fetchProductPageViews(days = 90) {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    return fetchAllPages(() =>
        supabase
            .from('events')
            .select('path, lang, referrer_host, created_at')
            .eq('name', 'page_view')
            .like('path', '%/products/%')
            .gte('created_at', since)
            .order('created_at', { ascending: false }));
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
