import { useMemo, useState } from 'react';
import {
    LEAD_STATUSES, LOST_REASONS, REPLY_PROMISE_HOURS,
    leadMetrics, formatHours,
} from '../../utils/leadStatus';
import { StatusPill } from './LeadStatusPanel';
import './LeadStats.css';

// The Stats tab's "Leads and Replies" section (folder 25): the reply promise,
// the pipeline, lead quality, and leads per 100 product-page views, for the
// leads that came in during the last 30 or 90 days.

const LANGUAGE_NAMES = { en: 'English', ru: 'Russian' };
const languageName = (code) => (code ? LANGUAGE_NAMES[code] || code.toUpperCase() : 'Not recorded');
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
const per100 = (v) => (v === null ? '—' : v.toFixed(1));
const MAX_SITES = 8;

/** A share as a bar on its track, with the numbers beside it. */
function Share({ n, total }) {
    const p = pct(n, total);
    return (
        <td className="admin-pv-share-cell">
            <div className="admin-pv-bar-wrap"><div className="admin-pv-bar olive" style={{ width: `${p}%` }} /></div>
            <span>{p}%</span>
        </td>
    );
}

function Outcome({ label, o }) {
    return (
        <p className="lead-stats-outcome">
            <strong>{label}:</strong>{' '}
            {o.total === 0
                ? 'none yet'
                : <>{o.won} of {o.total} won ({pct(o.won, o.total)}%) · {o.lost} lost · {o.open} still open</>}
        </p>
    );
}

function ViewsTable({ column, rows, nameOf }) {
    return (
        <table className="admin-pv-table">
            <thead>
                <tr>
                    <th>{column}</th>
                    <th>Product-page views</th>
                    <th>Leads</th>
                    <th>Leads per 100 views</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((r) => (
                    <tr key={r.key || '—'}>
                        <td className="admin-pv-title">{nameOf(r.key)}</td>
                        <td className="lead-stats-num">{r.views.toLocaleString()}</td>
                        <td className="lead-stats-num">{r.leads.toLocaleString()}</td>
                        <td className="lead-stats-num">{per100(r.per100)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default function LeadStats({ leads, productViews, enabled }) {
    const [days, setDays] = useState(30);
    const m = useMemo(() => leadMetrics(leads, productViews, { days }), [leads, productViews, days]);

    // The referring sites with the most views; the rest share one row.
    const sites = m.views.byReferrer.slice(0, MAX_SITES);
    const rest = m.views.byReferrer.slice(MAX_SITES);
    if (rest.length) {
        const views = rest.reduce((s, r) => s + r.views, 0);
        const leadsN = rest.reduce((s, r) => s + r.leads, 0);
        sites.push({ key: '__other', views, leads: leadsN, per100: views ? (leadsN / views) * 100 : null });
    }
    const siteName = (key) => (key === '__other' ? `Other sites (${rest.length})` : key || 'Direct, or not known');

    const r = m.reply;
    const promiseKept = r.median !== null && r.median <= REPLY_PROMISE_HOURS;

    return (
        <section className="lead-stats" aria-labelledby="lead-stats-title">
            <div className="lead-stats-head">
                <div>
                    <h3 id="lead-stats-title">Leads and Replies</h3>
                    <p className="admin-card-meta">Leads that came in during the last {days} days</p>
                </div>
                <div className="admin-filter-chips" role="group" aria-label="Period">
                    {[30, 90].map((d) => (
                        <button key={d} type="button" className={`admin-chip ${days === d ? 'active' : ''}`} aria-pressed={days === d} onClick={() => setDays(d)}>
                            Last {d} days
                        </button>
                    ))}
                </div>
            </div>

            {!enabled ? (
                <p className="lead-stats-off">
                    Reply times and the pipeline appear once <code>supabase/phase4-lead-status.sql</code> has been run in Supabase.
                </p>
            ) : (
                <div className="admin-stats-grid lead-stats-kpis">
                    <div className="admin-stat-card">
                        <span className="admin-stat-label">Median first reply</span>
                        <span className="admin-stat-value">{formatHours(r.median)}</span>
                        <span className={`lead-stats-target ${r.median === null ? '' : promiseKept ? 'kept' : 'missed'}`}>
                            {r.median === null
                                ? 'No replies recorded yet'
                                : promiseKept ? `✓ Within the ${REPLY_PROMISE_HOURS} h promise` : `! Over the ${REPLY_PROMISE_HOURS} h promise`}
                        </span>
                        <span className="admin-stat-sub">{r.replied} lead{r.replied === 1 ? '' : 's'} with a recorded reply</span>
                    </div>
                    <div className="admin-stat-card">
                        <span className="admin-stat-label">Replied within {REPLY_PROMISE_HOURS} h</span>
                        <span className="admin-stat-value">{r.counted ? `${pct(r.onTime, r.counted)}%` : '—'}</span>
                        <span className="admin-stat-sub">{r.onTime} of {r.counted} leads whose {REPLY_PROMISE_HOURS} h have passed or that have a reply</span>
                    </div>
                    <div className="admin-stat-card">
                        <span className="admin-stat-label">Waiting for a first reply</span>
                        <span className="admin-stat-value">{r.waiting}</span>
                        <span className="admin-stat-sub">{r.overdue} past {REPLY_PROMISE_HOURS} h</span>
                    </div>
                    <div className="admin-stat-card">
                        <span className="admin-stat-label">Leads received</span>
                        <span className="admin-stat-value">{m.leads}</span>
                        <span className="admin-stat-sub">in the last {days} days</span>
                    </div>
                </div>
            )}

            <div className="admin-dash-grid">
                {enabled && (
                    <>
                        <div className="admin-card">
                            <div className="admin-card-head">
                                <h3>Pipeline</h3>
                                <span className="admin-card-meta">where these leads are now</span>
                            </div>
                            <table className="admin-pv-table">
                                <thead>
                                    <tr><th>Status</th><th>Leads</th><th>Share</th></tr>
                                </thead>
                                <tbody>
                                    {LEAD_STATUSES.map((s) => (
                                        <tr key={s.id}>
                                            <td className="admin-pv-title"><StatusPill status={s.id} /></td>
                                            <td className="lead-stats-num">{m.byStatus[s.id]}</td>
                                            <Share n={m.byStatus[s.id]} total={m.leads} />
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <Outcome label="Quoted → won" o={m.quoted} />
                            <Outcome label="Sample sent → won" o={m.sampled} />
                        </div>

                        <div className="admin-card">
                            <div className="admin-card-head">
                                <h3>Why Leads Were Lost</h3>
                                <span className="admin-card-meta">{m.byStatus.lost} lost</span>
                            </div>
                            {m.byStatus.lost === 0 ? (
                                <p className="admin-card-empty">No lost leads in this period.</p>
                            ) : (
                                <table className="admin-pv-table">
                                    <thead>
                                        <tr><th>Reason</th><th>Leads</th><th>Share</th></tr>
                                    </thead>
                                    <tbody>
                                        {LOST_REASONS.map((reason) => (
                                            <tr key={reason.id}>
                                                <td className="admin-pv-title">{reason.label}</td>
                                                <td className="lead-stats-num">{m.lostReasons[reason.id]}</td>
                                                <Share n={m.lostReasons[reason.id]} total={m.byStatus.lost} />
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                <div className="admin-card">
                    <div className="admin-card-head">
                        <h3>Lead Quality</h3>
                        <span className="admin-card-meta">of {m.quality.total} leads, questions included</span>
                    </div>
                    {m.quality.total === 0 ? (
                        <p className="admin-card-empty">No leads in this period.</p>
                    ) : (
                        <table className="admin-pv-table">
                            <thead>
                                <tr><th>The buyer gave</th><th>Leads</th><th>Share</th></tr>
                            </thead>
                            <tbody>
                                {[
                                    ['A company name', m.quality.company],
                                    ['A destination country', m.quality.country],
                                    ['A quantity (per product, total or yearly)', m.quality.quantity],
                                ].map(([label, n]) => (
                                    <tr key={label}>
                                        <td className="admin-pv-title">{label}</td>
                                        <td className="lead-stats-num">{n}</td>
                                        <Share n={n} total={m.quality.total} />
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="admin-card">
                    <div className="admin-card-head">
                        <h3>Leads per 100 Product-Page Views</h3>
                        <span className="admin-card-meta">{per100(m.views.per100)} overall</span>
                    </div>
                    <p className="lead-stats-note">
                        {m.leads} lead{m.leads === 1 ? '' : 's'} (from any page) against {m.views.total.toLocaleString()} views of product pages.
                        No visitor is identified, so these compare counts, not people.
                    </p>
                    <ViewsTable column="Language" rows={m.views.byLanguage} nameOf={languageName} />
                </div>

                <div className="admin-card admin-card-wide">
                    <div className="admin-card-head">
                        <h3>Leads per 100 Product-Page Views, by Referring Site</h3>
                        <span className="admin-card-meta">the site a visitor arrived from</span>
                    </div>
                    {sites.length === 0 ? (
                        <p className="admin-card-empty">Nothing recorded in this period.</p>
                    ) : (
                        <ViewsTable column="Referring site" rows={sites} nameOf={siteName} />
                    )}
                </div>
            </div>
        </section>
    );
}
