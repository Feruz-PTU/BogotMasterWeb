/**
 * Admin → FAQ: the questions and answers in the `faq` table
 * (supabase/faq.sql).
 *
 * Only answers with the status "published" reach the site, at the next
 * rebuild. Saving a published answer, or publishing / unpublishing one,
 * starts that rebuild (services/adminData.js); drafts never do.
 * An answer with an "[owner: …]" or "[verify]" mark cannot be published:
 * this editor refuses, the database refuses, and the build refuses.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchFaq, saveFaq, saveFaqs, deleteFaq } from '../../services/adminData';
import { LIVE_LANGUAGES } from '../../i18n/languages';
import {
    FAQ_GROUPS, FAQ_STATUSES, FAQ_SOURCES, FAQ_WORDS, FAQ_SLUG_MAX,
    faqProblems, faqLanguages, faqPlaceholders, faqWordCount, sortFaq,
} from '../../utils/faq';
import './FaqAdmin.css';

const CODES = LIVE_LANGUAGES.map((l) => l.code);
const STEP = 10;

/** Today in the admin's own time zone, as YYYY-MM-DD. */
const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const statusOf = (id) => FAQ_STATUSES.find((s) => s.id === id) || FAQ_STATUSES[FAQ_STATUSES.length - 1];
const firstQuestion = (item) => CODES.map((c) => item[`q_${c}`]).find((q) => q && q.trim()) || '(no question yet)';
const textChanged = (a, b) =>
    CODES.some((c) => (a[`q_${c}`] || '') !== (b[`q_${c}`] || '') || (a[`a_${c}`] || '') !== (b[`a_${c}`] || ''));

/** "What payment terms do you accept?" → "what-payment-terms-do-you-accept" (whole words, ≤ 60). */
const slugFrom = (question) => {
    const full = String(question || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (full.length <= 60) return full;
    const cut = full.slice(0, 61);
    return cut.includes('-') ? cut.slice(0, cut.lastIndexOf('-')) : cut.slice(0, 60);
};

const blankItem = (group, order) => ({
    slug: '',
    group,
    order,
    status: 'draft',
    source: 'site',
    updated: today(),
    ...Object.fromEntries(CODES.flatMap((c) => [[`q_${c}`, ''], [`a_${c}`, '']])),
    links: [],
    related_products: [],
});

/** The form as it is saved: trimmed text, no empty links. */
const cleanItem = (form) => {
    const out = { ...form, slug: String(form.slug || '').trim().toLowerCase() };
    for (const c of CODES) {
        out[`q_${c}`] = String(form[`q_${c}`] || '').trim();
        out[`a_${c}`] = String(form[`a_${c}`] || '').trim();
    }
    out.links = (form.links || [])
        .map((l) => ({
            to: String(l.to || '').trim(),
            ...Object.fromEntries(CODES.map((c) => [`label_${c}`, String(l[`label_${c}`] || '').trim()])),
        }))
        .filter((l) => l.to);
    out.related_products = [...new Set(form.related_products || [])];
    const order = Number(form.order);
    out.order = Number.isFinite(order) ? Math.round(order) : 0;
    return out;
};

const isMissingTable = (err) => ['PGRST205', '42P01'].includes(err?.code);

/** A database refusal in words the owner can act on. */
const errorMessage = (err) => {
    if (isMissingTable(err)) return 'The FAQ table is not in the database yet: run supabase/faq.sql in Supabase.';
    if (err?.code === '23505') return 'Another answer already uses this anchor. Choose a different one.';
    if (err?.code === '23514') {
        if (/placeholder/.test(err.message)) return 'The database refused to publish it: it still has an [owner: …] or [verify] mark.';
        if (/slug_format/.test(err.message)) return 'The anchor may only use lowercase letters, digits and single hyphens.';
        return `The database refused it: ${err.message}`;
    }
    if (err?.code === '42501') return 'Not allowed. Sign out and in again with the admin account.';
    return `Error: ${err?.message || err}`;
};

const ArrowIcon = ({ up }) => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points={up ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
    </svg>
);

export default function FaqAdmin({ products = [], showToast, openConfirm }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    // { initial, original, form, dateTouched, slugTouched } while the editor is open.
    const [editor, setEditor] = useState(null);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [productToAdd, setProductToAdd] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setItems(await fetchFaq());
            setLoadError(null);
        } catch (err) {
            console.error('[faq]', err);
            setLoadError({ missingTable: isMissingTable(err), message: errorMessage(err) });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const siteSlugs = useMemo(() => products.filter((p) => !p.hidden).map((p) => p.slug), [products]);
    const checkOptions = useMemo(() => ({ codes: CODES, productSlugs: siteSlugs }), [siteSlugs]);

    // ── List ────────────────────────────────────────────────────────────────

    const counts = useMemo(
        () => Object.fromEntries(FAQ_STATUSES.map((s) => [s.id, items.filter((i) => i.status === s.id).length])),
        [items],
    );

    const query = search.trim().toLowerCase();
    const filtering = Boolean(query) || statusFilter !== 'all';
    const sections = useMemo(() => {
        const visible = sortFaq(items).filter((i) =>
            (statusFilter === 'all' || i.status === statusFilter)
            && (!query || [i.slug, ...CODES.flatMap((c) => [i[`q_${c}`], i[`a_${c}`]])]
                .some((v) => String(v || '').toLowerCase().includes(query))));
        const known = new Set(FAQ_GROUPS.map((g) => g.id));
        return [
            ...FAQ_GROUPS.map((g) => ({ ...g, items: visible.filter((i) => i.group === g.id) })),
            { id: null, label: 'No group (edit to choose one)', items: visible.filter((i) => !known.has(i.group)) },
        ].filter((s) => s.items.length || (s.id && !filtering));
    }, [items, statusFilter, query, filtering]);

    const nextOrder = (group, exceptId) =>
        Math.max(0, ...items.filter((i) => i.group === group && i.id !== exceptId).map((i) => i.order ?? 0)) + STEP;

    const move = async (item, dir) => {
        const group = sortFaq(items).filter((i) => i.group === item.group);
        const from = group.findIndex((i) => i.id === item.id);
        const to = from + (dir === 'up' ? -1 : 1);
        if (to < 0 || to >= group.length) return;
        const reordered = [...group];
        [reordered[from], reordered[to]] = [reordered[to], reordered[from]];
        // Renumber the whole group 10, 20, 30…, so equal numbers cannot block a move.
        const changed = reordered
            .map((i, n) => ({ ...i, order: (n + 1) * STEP }))
            .filter((i) => i.order !== group.find((g) => g.id === i.id).order);
        setItems((prev) => prev.map((i) => changed.find((c) => c.id === i.id) || i));
        try {
            await saveFaqs(changed);
        } catch (err) {
            showToast(errorMessage(err), 6000);
            load();
        }
    };

    const setStatus = async (item, status) => {
        const next = { ...item, status };
        if (status === 'published' && faqProblems(next, checkOptions).errors.length) {
            startEdit(item);
            showToast('Not published yet: fix the points in red first.', 6000);
            return;
        }
        setBusyId(item.id);
        try {
            const saved = await saveFaq(next, item);
            setItems((prev) => prev.map((i) => (i.id === saved.id ? saved : i)));
            showToast(status === 'published'
                ? 'Published. The site updates in a few minutes.'
                : 'Taken off the site (now a draft). The site updates in a few minutes.');
        } catch (err) {
            showToast(errorMessage(err), 6000);
        } finally {
            setBusyId(null);
        }
    };

    const remove = (item) => openConfirm({
        title: 'Delete answer',
        message: `Delete "${firstQuestion(item)}"? This cannot be undone. To take it off the site but keep it, unpublish it instead.`,
        isDanger: true,
        onConfirm: async () => {
            try {
                await deleteFaq(item);
                setItems((prev) => prev.filter((i) => i.id !== item.id));
                showToast('Answer deleted.');
            } catch (err) {
                showToast(errorMessage(err), 6000);
            }
        },
    });

    // ── Editor ──────────────────────────────────────────────────────────────

    const open = (form, original) => {
        setProductToAdd('');
        setEditor({ initial: form, original, form, dateTouched: false, slugTouched: Boolean(original) });
        window.scrollTo({ top: 0, behavior: 'instant' });
    };
    const startAdd = (group = FAQ_GROUPS[0].id) => open(blankItem(group, nextOrder(group)), null);
    function startEdit(item) {
        open({ links: [], related_products: [], source: 'site', ...item }, item);
    }

    const setForm = (patch, flags = {}) => setEditor((e) => ({ ...e, ...flags, form: { ...e.form, ...patch } }));

    const setQuestion = (code, value) => setEditor((e) => {
        const form = { ...e.form, [`q_${code}`]: value };
        // A new answer's anchor follows the English question until it is typed in.
        if (!e.slugTouched && code === 'en') form.slug = slugFrom(value);
        return { ...e, form };
    });

    const changeGroup = (group) => setEditor((e) => ({
        ...e,
        form: {
            ...e.form,
            group,
            order: e.original?.group === group ? e.original.order : nextOrder(group, e.form.id),
        },
    }));

    const setLink = (index, patch) =>
        setForm({ links: editor.form.links.map((l, i) => (i === index ? { ...l, ...patch } : l)) });

    const dirty = editor && JSON.stringify(editor.form) !== JSON.stringify(editor.initial);

    const close = () => {
        if (!dirty) { setEditor(null); return; }
        openConfirm({
            title: 'Discard changes?',
            message: 'The changes to this answer are not saved.',
            isDanger: true,
            onConfirm: () => setEditor(null),
        });
    };

    const save = async () => {
        const { original, dateTouched } = editor;
        const item = cleanItem(editor.form);
        if (!dateTouched && (!original || textChanged(item, original))) item.updated = today();
        const { errors } = faqProblems(item, checkOptions);
        // The database needs a valid anchor for any answer; publishing needs everything.
        const blocking = item.status === 'published' ? errors : errors.filter((e) => e.code === 'slug');
        if (blocking.length) {
            showToast(blocking[0].message, 6000);
            return;
        }
        setSaving(true);
        try {
            const saved = await saveFaq(item, original);
            setItems((prev) => (original ? prev.map((i) => (i.id === saved.id ? saved : i)) : [...prev, saved]));
            setEditor(null);
            showToast(
                saved.status === 'published'
                    ? 'Saved and published. The site updates in a few minutes.'
                    : original?.status === 'published'
                        ? 'Saved and taken off the site. The site updates in a few minutes.'
                        : `Saved as ${statusOf(saved.status).label.toLowerCase()}. Not on the site.`,
            );
        } catch (err) {
            showToast(errorMessage(err), 6000);
        } finally {
            setSaving(false);
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────

    if (loading) {
        return <div className="admin-section"><p className="faq-admin-note">Loading the FAQ…</p></div>;
    }

    if (loadError) {
        return (
            <div className="admin-section">
                <div className="admin-section-header"><h2>FAQ</h2></div>
                <div className="faq-admin-setup" role="alert">
                    {loadError.missingTable ? (
                        <>
                            <strong>The FAQ table is not in the database yet.</strong>
                            <p>
                                In Supabase, open SQL Editor → New query, paste the whole file
                                <code> supabase/faq.sql</code> and press Run. Then reload this tab.
                            </p>
                        </>
                    ) : (
                        <>
                            <strong>The FAQ could not be loaded.</strong>
                            <p>{loadError.message}</p>
                        </>
                    )}
                    <button className="admin-btn-secondary admin-btn-sm" onClick={load}>Reload</button>
                </div>
            </div>
        );
    }

    if (editor) {
        const { form, original } = editor;
        const item = cleanItem(form);
        const { errors, warnings } = faqProblems(item, checkOptions);
        const slugMoved = original?.status === 'published' && original.slug !== item.slug;
        const canSave = !saving && !(item.status === 'published' ? errors.length : errors.some((e) => e.code === 'slug'));
        const chosen = form.related_products || [];

        return (
            <div className="admin-section">
                <div className="admin-edit-form faq-admin-editor">
                    <div className="admin-form-header">
                        <div className="faq-admin-editor-title">
                            <h3>{original ? 'Edit answer' : 'New answer'}</h3>
                            {item.slug && <span className="admin-form-slug-badge">/faq#{item.slug}</span>}
                        </div>
                        <button className="admin-btn-close" onClick={close} aria-label="Close the editor">&times;</button>
                    </div>

                    <div className="admin-form-body">
                        <div className="admin-form-aside">
                            <div className="admin-field">
                                <label htmlFor="faq-status">Status</label>
                                <select id="faq-status" value={form.status} onChange={(e) => setForm({ status: e.target.value })}>
                                    {FAQ_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                                </select>
                                <span className="faq-admin-hint">{statusOf(form.status).hint}</span>
                            </div>
                            <div className="admin-field">
                                <label htmlFor="faq-group">Group</label>
                                <select id="faq-group" value={FAQ_GROUPS.some((g) => g.id === form.group) ? form.group : ''} onChange={(e) => changeGroup(e.target.value)}>
                                    {!FAQ_GROUPS.some((g) => g.id === form.group) && <option value="">Choose a group…</option>}
                                    {FAQ_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                                </select>
                            </div>
                            <div className="admin-field">
                                <label htmlFor="faq-slug">Anchor <span className="admin-field-hint">the link is /faq#anchor</span></label>
                                <input
                                    id="faq-slug"
                                    value={form.slug}
                                    maxLength={FAQ_SLUG_MAX}
                                    spellCheck={false}
                                    placeholder="e.g. payment-terms"
                                    onChange={(e) => setForm({ slug: e.target.value }, { slugTouched: true })}
                                />
                                <span className="faq-admin-hint">Lowercase letters, digits and hyphens. Sales paste these links into emails, so keep it once published.</span>
                                {slugMoved && (
                                    <span className="faq-admin-hint is-warn">Links already shared to /faq#{original.slug} will stop working.</span>
                                )}
                            </div>
                            <div className="admin-fields-row">
                                <div className="admin-field">
                                    <label htmlFor="faq-order">Order</label>
                                    <input id="faq-order" type="number" step={STEP} value={form.order ?? 0} onChange={(e) => setForm({ order: e.target.value })} />
                                </div>
                                <div className="admin-field">
                                    <label htmlFor="faq-updated">Last updated</label>
                                    <input id="faq-updated" type="date" value={form.updated || ''} onChange={(e) => setForm({ updated: e.target.value }, { dateTouched: true })} />
                                </div>
                            </div>
                            <span className="faq-admin-hint faq-admin-hint-tight">The date is shown under the answer. It moves to today by itself when a question or answer changes.</span>
                            <div className="admin-field">
                                <label htmlFor="faq-source">Source of the facts</label>
                                <select id="faq-source" value={form.source || 'site'} onChange={(e) => setForm({ source: e.target.value })}>
                                    {FAQ_SOURCES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="admin-form-fields">
                            {LIVE_LANGUAGES.map(({ code, name }) => {
                                const words = faqWordCount(form[`a_${code}`]);
                                const outside = words > 0 && (words < FAQ_WORDS.min || words > FAQ_WORDS.max);
                                return (
                                    <div key={code} className="faq-admin-lang-block">
                                        <p className="admin-form-section-label">{name}</p>
                                        <div className="admin-field">
                                            <label htmlFor={`faq-q-${code}`}>Question <span className="admin-field-lang">{code.toUpperCase()}</span></label>
                                            <input id={`faq-q-${code}`} lang={code} value={form[`q_${code}`] || ''} onChange={(e) => setQuestion(code, e.target.value)} />
                                        </div>
                                        <div className="admin-field">
                                            <label htmlFor={`faq-a-${code}`}>
                                                Answer <span className="admin-field-lang">{code.toUpperCase()}</span>
                                                <span className="admin-field-hint">*italic*, [link text](/logistics)</span>
                                            </label>
                                            <textarea id={`faq-a-${code}`} lang={code} rows={6} value={form[`a_${code}`] || ''} onChange={(e) => setForm({ [`a_${code}`]: e.target.value })} />
                                            <span className={`faq-admin-hint ${outside ? 'is-warn' : ''}`}>
                                                {words} {words === 1 ? 'word' : 'words'} · aim for {FAQ_WORDS.min}–{FAQ_WORDS.max}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}

                            <p className="admin-form-section-label">“Read more” links</p>
                            <p className="faq-admin-hint faq-admin-hint-block">
                                The page that holds the full detail. A site path without /ru (e.g. /logistics#incoterms or /products/powder),
                                or a full https:// address. Empty labels use the page’s own title.
                            </p>
                            {(form.links || []).map((link, i) => (
                                <div key={i} className="faq-admin-link-row">
                                    <div className="admin-field">
                                        <label htmlFor={`faq-link-${i}`}>Link</label>
                                        <input id={`faq-link-${i}`} value={link.to || ''} spellCheck={false} placeholder="/logistics#incoterms" onChange={(e) => setLink(i, { to: e.target.value })} />
                                    </div>
                                    {CODES.map((c) => (
                                        <div key={c} className="admin-field">
                                            <label htmlFor={`faq-link-${i}-${c}`}>Label <span className="admin-field-lang">{c.toUpperCase()}</span></label>
                                            <input id={`faq-link-${i}-${c}`} lang={c} value={link[`label_${c}`] || ''} onChange={(e) => setLink(i, { [`label_${c}`]: e.target.value })} />
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="admin-btn-danger admin-btn-sm faq-admin-link-remove"
                                        onClick={() => setForm({ links: form.links.filter((_, n) => n !== i) })}
                                        aria-label={`Remove link ${i + 1}`}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <div>
                                <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => setForm({ links: [...(form.links || []), { to: '' }] })}>
                                    + Add link
                                </button>
                            </div>

                            <p className="admin-form-section-label">Related products</p>
                            <p className="faq-admin-hint faq-admin-hint-block">Optional. Product pages can show this question later.</p>
                            {chosen.length > 0 && (
                                <ul className="faq-admin-chips">
                                    {chosen.map((slug) => {
                                        const p = products.find((x) => x.slug === slug);
                                        return (
                                            <li key={slug} className={!p || p.hidden ? 'is-off' : ''}>
                                                <span>{p ? (p.title_en || p.title_ru || slug) : slug}{p?.hidden ? ' (hidden)' : ''}{!p ? ' (deleted)' : ''}</span>
                                                <button type="button" onClick={() => setForm({ related_products: chosen.filter((s) => s !== slug) })} aria-label={`Remove ${slug}`}>&times;</button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                            <div className="faq-admin-add-product">
                                <div className="admin-field">
                                    <label htmlFor="faq-product">Add a product</label>
                                    <select id="faq-product" value={productToAdd} onChange={(e) => setProductToAdd(e.target.value)}>
                                        <option value="">Choose…</option>
                                        {products.filter((p) => !chosen.includes(p.slug)).map((p) => (
                                            <option key={p.slug} value={p.slug}>{p.title_en || p.title_ru || p.slug}{p.hidden ? ' (hidden)' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    className="admin-btn-secondary admin-btn-sm"
                                    disabled={!productToAdd}
                                    onClick={() => { setForm({ related_products: [...chosen, productToAdd] }); setProductToAdd(''); }}
                                >
                                    Add
                                </button>
                            </div>

                            <div className="faq-admin-checks" aria-live="polite">
                                {errors.length > 0 && (
                                    <div className="faq-admin-check is-error">
                                        <strong>
                                            {item.status === 'published' || errors.some((e) => e.code === 'slug')
                                                ? 'Fix before saving:'
                                                : 'Before it can be published:'}
                                        </strong>
                                        <ul>{errors.map((e) => <li key={e.message}>{e.message}</li>)}</ul>
                                        {item.status !== 'published' && !errors.some((e) => e.code === 'slug') && (
                                            <p>It can be saved as {statusOf(item.status).label.toLowerCase()} meanwhile.</p>
                                        )}
                                    </div>
                                )}
                                {warnings.length > 0 && (
                                    <div className="faq-admin-check is-warn">
                                        <strong>Worth a look:</strong>
                                        <ul>{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
                                    </div>
                                )}
                                {!errors.length && !warnings.length && (
                                    <div className="faq-admin-check is-ok"><strong>Ready to publish.</strong></div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="admin-edit-actions">
                        <button className="admin-btn-primary" onClick={save} disabled={!canSave}>
                            {saving ? 'Saving…' : original ? 'Save changes' : 'Add answer'}
                        </button>
                        <button className="admin-btn-secondary" onClick={close}>Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-section">
            <div className="admin-section-header">
                <div>
                    <h2>FAQ <span className="admin-count">({items.length})</span></h2>
                    <p className="admin-section-sublabel">
                        {counts.published} published · {counts.needs_owner} need the owner · {counts.draft} draft.
                        Only published answers are on the site.
                    </p>
                </div>
                <button className="admin-btn-primary" onClick={() => startAdd()}>+ Add answer</button>
            </div>

            <div className="admin-list-controls">
                <div className="admin-search">
                    <svg className="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input type="search" placeholder="Search questions, answers or anchors…" aria-label="Search the FAQ" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="admin-filter-chips" role="group" aria-label="Show">
                    <button className={`admin-chip ${statusFilter === 'all' ? 'active' : ''}`} aria-pressed={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
                        All ({items.length})
                    </button>
                    {FAQ_STATUSES.map((s) => (
                        <button key={s.id} className={`admin-chip ${statusFilter === s.id ? 'active' : ''}`} aria-pressed={statusFilter === s.id} onClick={() => setStatusFilter(s.id)}>
                            {s.label} ({counts[s.id]})
                        </button>
                    ))}
                </div>
            </div>

            {filtering && !sections.length && <div className="admin-empty-state">No answer matches.</div>}

            {sections.map((section) => (
                <div key={section.id || 'none'} className="faq-admin-group">
                    <div className="faq-admin-group-head">
                        <h3>{section.label} <span className="admin-count">({section.items.length})</span></h3>
                        {section.id && (
                            <button className="admin-btn-secondary admin-btn-sm" onClick={() => startAdd(section.id)}>+ Add to this group</button>
                        )}
                    </div>
                    {section.items.length === 0 ? (
                        <p className="faq-admin-note">No answers in this group yet.</p>
                    ) : (
                        <div className="admin-products-list">
                            {section.items.map((item, index) => {
                                const done = faqLanguages(item, CODES);
                                const marks = faqPlaceholders(item).length;
                                const busy = busyId === item.id;
                                return (
                                    <div key={item.id} className={`admin-product-row faq-admin-row is-${item.status}`}>
                                        {!filtering && (
                                            <div className="admin-reorder">
                                                <button className="admin-reorder-btn" onClick={() => move(item, 'up')} disabled={index === 0} title="Move up" aria-label="Move up">
                                                    <ArrowIcon up />
                                                </button>
                                                <button className="admin-reorder-btn" onClick={() => move(item, 'down')} disabled={index === section.items.length - 1} title="Move down" aria-label="Move down">
                                                    <ArrowIcon />
                                                </button>
                                            </div>
                                        )}
                                        <span className="admin-product-order" title="Order in the group">{item.order ?? '—'}</span>
                                        <div className="admin-product-row-info">
                                            <div className="faq-admin-row-top">
                                                <span className={`faq-admin-status is-${item.status}`}>{statusOf(item.status).label}</span>
                                                <code className="faq-admin-slug">#{item.slug}</code>
                                            </div>
                                            <strong className="faq-admin-q">{firstQuestion(item)}</strong>
                                            <div className="faq-admin-meta">
                                                {CODES.map((c) => (
                                                    <span key={c} className={`faq-admin-lang ${done.includes(c) ? 'is-done' : ''}`} title={done.includes(c) ? `${c.toUpperCase()}: question and answer written` : `${c.toUpperCase()}: not written yet`}>
                                                        {c.toUpperCase()} {done.includes(c) ? '✓' : '–'}
                                                    </span>
                                                ))}
                                                {marks > 0 && <span className="faq-admin-marks">{marks} {marks === 1 ? 'mark' : 'marks'} to fill in</span>}
                                                {item.updated && <span className="faq-admin-date">Updated {item.updated}</span>}
                                            </div>
                                        </div>
                                        <div className="admin-product-row-actions">
                                            {item.status === 'published' ? (
                                                <button className="admin-btn-secondary admin-btn-sm" disabled={busy} onClick={() => setStatus(item, 'draft')}>Unpublish</button>
                                            ) : (
                                                <button className="admin-btn-secondary admin-btn-sm" disabled={busy} onClick={() => setStatus(item, 'published')}>Publish</button>
                                            )}
                                            <button className="admin-btn-secondary admin-btn-sm" onClick={() => startEdit(item)}>Edit</button>
                                            <button className="admin-btn-danger admin-btn-sm" onClick={() => remove(item)}>Delete</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
