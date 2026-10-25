/**
 * Lead status (folder 25): each enquiry's place in the sales pipeline, the
 * follow-up reminders, and the figures in the admin's Stats tab. Plain
 * functions without React or browser code, so the tests run them in Node.
 * Only the admin imports this file.
 *
 * The database keeps five fields per lead (supabase/phase4-lead-status.sql):
 * status, lost_reason, first_reply_at, status_updated_at and status_history.
 * The history is the record; the other four are worked out from it on every
 * change (`fieldsFromHistory`), so they can never disagree with it.
 *
 * A lead here is the admin's flat object: the form fields, `createdAt`, and
 * the five status fields (see fetchInquiries in supabase/data.js).
 */

const HOUR = 3600000;
const DAY = 24 * HOUR;

/** The reply promise on the site: "We reply to every enquiry within 24 hours." */
export const REPLY_PROMISE_HOURS = 24;

export const LEAD_STATUSES = [
    { id: 'new', label: 'New' },
    { id: 'replied', label: 'Replied' },
    { id: 'quoted', label: 'Quoted' },
    { id: 'sample_sent', label: 'Sample sent' },
    { id: 'won', label: 'Won' },
    { id: 'lost', label: 'Lost' },
];
const STATUS_IDS = new Set(LEAD_STATUSES.map((s) => s.id));
export const statusLabel = (id) => (LEAD_STATUSES.find((s) => s.id === id) || LEAD_STATUSES[0]).label;

export const LOST_REASONS = [
    { id: 'price', label: 'Price' },
    { id: 'spec', label: 'Specification' },
    { id: 'timing', label: 'Timing' },
    { id: 'no_reply', label: 'The buyer stopped replying' },
    { id: 'other', label: 'Other' },
];
const REASON_IDS = new Set(LOST_REASONS.map((r) => r.id));
export const lostReasonLabel = (id) => (LOST_REASONS.find((r) => r.id === id) || LOST_REASONS[LOST_REASONS.length - 1]).label;

/** Statuses that mean the buyer has had an answer from us. */
const ANSWERED = new Set(['replied', 'quoted', 'sample_sent', 'won']);

/** Still in play: a follow-up can be recorded. */
export const isOpen = (status) => ['replied', 'quoted', 'sample_sent'].includes(status);

/**
 * The follow-up cadence (strategy audit, Appendix A §A3): a nudge 3 days after
 * a reply or quotation, test results asked for 7 days after a sample arrives,
 * and a check-in on day 30. Days count from the last status change. The
 * arrival day is not recorded, so "sample sent" assumes about 3 days in
 * transit: the results question comes on day 10.
 */
export const SAMPLE_TRANSIT_DAYS = 3;
const FOLLOW_UPS = {
    replied: [{ day: 3, label: 'Nudge the buyer' }, { day: 30, label: 'Check in' }],
    quoted: [{ day: 3, label: 'Nudge the buyer' }, { day: 30, label: 'Check in' }],
    sample_sent: [{ day: SAMPLE_TRANSIT_DAYS + 7, label: 'Ask for test results' }, { day: 30, label: 'Check in' }],
};

const time = (v) => {
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
};

/** The lead's history, keeping only well-formed entries. */
export function historyOf(lead) {
    const h = Array.isArray(lead?.status_history) ? lead.status_history : [];
    return h.filter((e) => e && typeof e === 'object' && time(e.at) !== null
        && (e.follow_up === true || STATUS_IDS.has(e.status)));
}

/** The four status fields, worked out from a history. */
export function fieldsFromHistory(history) {
    let status = 'new';
    let lostReason = null;
    let updatedAt = null;
    let firstReply = null;
    for (const e of history) {
        if (e.follow_up) continue;
        status = e.status;
        updatedAt = e.at;
        lostReason = e.status === 'lost' ? (REASON_IDS.has(e.reason) ? e.reason : 'other') : null;
        if (ANSWERED.has(e.status) && (firstReply === null || time(e.at) < time(firstReply))) firstReply = e.at;
    }
    return { status, lost_reason: lostReason, first_reply_at: firstReply, status_updated_at: updatedAt };
}

/** The status shown for a lead (a lead saved before the status existed is new). */
export const statusOf = (lead) => (STATUS_IDS.has(lead?.status) ? lead.status : 'new');

// A time typed in the admin has minute precision, so a change entered as
// 10:00 right after one saved at 10:00:40 is accepted and kept in order.
const SLACK = 60000;

/**
 * A change to a lead: { status, reason?, at? } or { follow_up: true, at? }.
 * `at` is when it happened (default: now). Returns { patch } with the five
 * fields to save, or { error } with a sentence for the admin.
 */
export function applyChange(lead, change, now = Date.now()) {
    const history = historyOf(lead);
    let at = change.at === undefined || change.at === '' ? now : time(change.at);
    if (at === null) return { error: 'Enter a valid date and time.' };
    if (at > now + 5 * 60000) return { error: 'The time cannot be in the future.' };
    const created = time(lead.createdAt);
    if (created !== null) {
        if (at < created - SLACK) return { error: 'The time cannot be before the request came in.' };
        at = Math.max(at, created);
    }
    const last = history.length ? time(history[history.length - 1].at) : null;
    if (last !== null) {
        if (at < last - SLACK) return { error: 'The time cannot be before the last change.' };
        at = Math.max(at, last);
    }
    const iso = new Date(at).toISOString();

    let entry;
    const current = statusOf(lead);
    if (change.follow_up) {
        if (!isOpen(current)) return { error: 'A follow-up is recorded for a lead that is replied, quoted or has a sample.' };
        entry = { follow_up: true, at: iso };
    } else {
        if (!STATUS_IDS.has(change.status) || change.status === 'new') return { error: 'Choose a status.' };
        if (change.status === current) return { error: `The lead is already “${statusLabel(current)}”.` };
        if (change.status === 'lost' && !REASON_IDS.has(change.reason)) return { error: 'Choose why the lead was lost.' };
        entry = { status: change.status, at: iso, ...(change.status === 'lost' ? { reason: change.reason } : {}) };
    }
    const next = [...history, entry];
    return { patch: { status_history: next, ...fieldsFromHistory(next) } };
}

/** Takes back the last change or follow-up. */
export function undoLast(lead) {
    const history = historyOf(lead);
    if (!history.length) return { error: 'There is nothing to undo.' };
    const next = history.slice(0, -1);
    return { patch: { status_history: next, ...fieldsFromHistory(next) } };
}

/** "45 min", "5.5 h", "3 days". */
export function formatHours(hours) {
    if (hours === null || hours === undefined || Number.isNaN(hours)) return '—';
    if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
    if (hours < 48) return `${Number(hours.toFixed(1))} h`;
    const days = Math.floor(hours / 24);
    return `${days} days`;
}

/**
 * What a lead needs now, or null:
 *   overdue: still new 24 hours after it came in;
 *   due:     still new, inside the 24 hours ("Reply within 5 h");
 *   follow:  a follow-up from the cadence above is due.
 * A follow-up step is done once one is recorded in its window: from halfway
 * between the previous step's day (or the change) and its own day. A nudge
 * on day 3 therefore does not also count as the day-30 check-in.
 */
export function leadFlag(lead, now = Date.now()) {
    const status = statusOf(lead);
    const created = time(lead.createdAt);
    if (status === 'new') {
        if (created === null) return null;
        const due = created + REPLY_PROMISE_HOURS * HOUR;
        if (now >= due) return { kind: 'overdue', label: `No reply for ${formatHours((now - created) / HOUR)}`, due };
        return { kind: 'due', label: `Reply within ${Math.max(1, Math.ceil((due - now) / HOUR))} h`, due };
    }
    const steps = FOLLOW_UPS[status];
    if (!steps) return null;
    const changed = time(lead.status_updated_at) ?? created;
    if (changed === null) return null;
    const followUps = historyOf(lead).filter((e) => e.follow_up && time(e.at) >= changed).map((e) => time(e.at));
    for (let i = steps.length - 1; i >= 0; i--) {
        const due = changed + steps[i].day * DAY;
        if (now < due) continue;
        const windowStart = changed + (((i ? steps[i - 1].day : 0) + steps[i].day) / 2) * DAY;
        if (followUps.some((t) => t >= windowStart)) return null;
        return { kind: 'follow', label: `${steps[i].label} (day ${steps[i].day})`, due };
    }
    return null;
}

/** Overdue for a reply, or a follow-up is due. */
export const needsAction = (lead, now = Date.now()) => ['overdue', 'follow'].includes(leadFlag(lead, now)?.kind);

const filled = (v) => v !== undefined && v !== null && String(v).trim() !== '';
/** The buyer said how much: per product, in total, or a yearly volume. */
export const hasQuantity = (lead) => (Array.isArray(lead.items) && lead.items.some((i) => filled(i?.quantity)))
    || filled(lead.quantity) || filled(lead.total_quantity) || filled(lead.annual_volume);

/** A product page: /products/<slug> or /<lang>/products/<slug>. */
export const PRODUCT_PAGE = /^\/(?:[a-z]{2}\/)?products\/[^/]+\/?$/;
const hostOf = (h) => (filled(h) ? String(h).toLowerCase().replace(/^www\./, '') : '');

function median(values) {
    if (!values.length) return null;
    const s = [...values].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * The Stats tab's figures for the leads that came in during the last `days`
 * days, and the product-page views of the same days.
 * `productViews`: page_view events ({ path, lang, referrer_host, created_at }).
 */
export function leadMetrics(leads, productViews, { days, now = Date.now() }) {
    const since = now - days * DAY;
    const inRange = (t) => t !== null && t >= since && t <= now;
    const list = leads.filter((l) => inRange(time(l.createdAt)));

    // The reply promise. A lead counts once it has an answer or its 24 hours
    // have passed; one never answered counts as missed.
    const replyHours = [];
    let counted = 0;
    let onTime = 0;
    let waiting = 0;
    let overdue = 0;
    for (const l of list) {
        const created = time(l.createdAt);
        const first = time(l.first_reply_at);
        const late = now - created >= REPLY_PROMISE_HOURS * HOUR;
        if (first !== null) {
            const h = Math.max(0, (first - created) / HOUR);
            replyHours.push(h);
            counted++;
            if (h <= REPLY_PROMISE_HOURS) onTime++;
        } else if (late) {
            counted++;
        }
        if (statusOf(l) === 'new') {
            waiting++;
            if (late) overdue++;
        }
    }

    // The pipeline: where the leads are now, and how the quoted and sampled
    // ones ended.
    const byStatus = Object.fromEntries(LEAD_STATUSES.map((s) => [s.id, 0]));
    for (const l of list) byStatus[statusOf(l)]++;
    const reached = (l, status) => statusOf(l) === status || historyOf(l).some((e) => e.status === status);
    const outcome = (status) => {
        const group = list.filter((l) => reached(l, status));
        const won = group.filter((l) => statusOf(l) === 'won').length;
        const lost = group.filter((l) => statusOf(l) === 'lost').length;
        return { total: group.length, won, lost, open: group.length - won - lost };
    };
    const lostReasons = Object.fromEntries(LOST_REASONS.map((r) => [r.id, 0]));
    for (const l of list) if (statusOf(l) === 'lost') lostReasons[REASON_IDS.has(l.lost_reason) ? l.lost_reason : 'other']++;

    const quality = {
        total: list.length,
        company: list.filter((l) => filled(l.company)).length,
        country: list.filter((l) => filled(l.destination_country)).length,
        quantity: list.filter(hasQuantity).length,
    };

    // Leads per 100 product-page views. No visitor id exists, so these are
    // ratios of counts: every lead (from any page) against product-page views.
    const views = (productViews || []).filter((e) => PRODUCT_PAGE.test(e.path || '') && inRange(time(e.created_at)));
    const tally = (keyOfView, keyOfLead) => {
        const m = new Map();
        const row = (k) => m.get(k) || m.set(k, { key: k, views: 0, leads: 0 }).get(k);
        for (const v of views) row(keyOfView(v)).views++;
        for (const l of list) row(keyOfLead(l)).leads++;
        return [...m.values()]
            .map((r) => ({ ...r, per100: r.views ? (r.leads / r.views) * 100 : null }))
            .sort((a, b) => b.views - a.views || b.leads - a.leads || a.key.localeCompare(b.key));
    };

    return {
        days,
        leads: list.length,
        reply: {
            median: median(replyHours),
            replied: replyHours.length,
            counted,
            onTime,
            waiting,
            overdue,
        },
        byStatus,
        quoted: outcome('quoted'),
        sampled: outcome('sample_sent'),
        lostReasons,
        quality,
        views: {
            total: views.length,
            per100: views.length ? (list.length / views.length) * 100 : null,
            byLanguage: tally((v) => v.lang || '', (l) => l.language || ''),
            byReferrer: tally((v) => hostOf(v.referrer_host), (l) => hostOf(l.referrer_host)),
        },
    };
}
