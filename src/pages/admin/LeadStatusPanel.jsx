import { useState } from 'react';
import {
    LEAD_STATUSES, LOST_REASONS, REPLY_PROMISE_HOURS,
    statusLabel, lostReasonLabel, statusOf, leadFlag, historyOf, isOpen,
    applyChange, undoLast, formatHours,
} from '../../utils/leadStatus';
import './LeadStatusPanel.css';

// A lead's status in the admin (folder 25): the pill and the flag used in the
// leads list, and the Status card of the lead's detail view.

const pad = (n) => String(n).padStart(2, '0');
/** A date as the value of <input type="datetime-local">, in local time. */
const toLocalInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const when = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function StatusPill({ status }) {
    return <span className={`lead-status-pill ${status}`}>{statusLabel(status)}</span>;
}

const FLAG_ICONS = {
    overdue: <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />,
    follow: <path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />,
    due: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
};

/** What the lead needs now, with an icon and words, never colour alone. */
export function LeadFlag({ flag }) {
    if (!flag) return null;
    return (
        <span className={`lead-flag ${flag.kind}`} title={`${flag.kind === 'due' ? 'Reply due' : 'Due since'} ${when(flag.due)}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{FLAG_ICONS[flag.kind]}</svg>
            {flag.label}
        </span>
    );
}

/**
 * The Status card. `onSave(patch)` saves the five status fields and resolves
 * once they are stored; the dashboard keeps the lead in its list up to date.
 * Give it `key={lead.id}`, so a half-filled change never carries over to
 * another lead.
 */
export default function LeadStatusPanel({ lead, enabled, onSave }) {
    const [choice, setChoice] = useState(null); // a status id, or 'follow_up'
    const [reason, setReason] = useState('');
    const [at, setAt] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    if (!enabled) {
        return (
            <div className="admin-inq-detail-card lead-status-card">
                <p className="admin-inq-detail-card-label">Status</p>
                <p className="lead-status-off">
                    Lead status is off until <code>supabase/phase4-lead-status.sql</code> has been run in Supabase
                    (SQL Editor). Everything else works as before.
                </p>
            </div>
        );
    }

    const status = statusOf(lead);
    const flag = leadFlag(lead);
    const history = historyOf(lead);
    const last = history[history.length - 1];
    const firstReplyHours = lead.first_reply_at
        ? Math.max(0, (Date.parse(lead.first_reply_at) - Date.parse(lead.createdAt)) / 3600000)
        : null;

    const start = (id) => {
        setChoice(id);
        setReason('');
        setAt(toLocalInput(new Date()));
        setError('');
    };
    const save = async (result) => {
        if (result.error) {
            setError(result.error);
            return;
        }
        setSaving(true);
        setError('');
        try {
            await onSave(result.patch);
            setChoice(null);
        } catch (e) {
            setError(`Not saved: ${e?.message || e}`);
        } finally {
            setSaving(false);
        }
    };
    const confirm = () => save(applyChange(lead, choice === 'follow_up' ? { follow_up: true, at } : { status: choice, reason, at }));

    return (
        <div className="admin-inq-detail-card lead-status-card">
            <p className="admin-inq-detail-card-label">Status</p>

            <div className="lead-status-now">
                <StatusPill status={status} />
                <span className="lead-status-since">
                    {lead.status_updated_at ? `since ${when(lead.status_updated_at)}` : `request came in ${when(lead.createdAt)}`}
                </span>
                {status === 'lost' && <span className="lead-status-since">· {lostReasonLabel(lead.lost_reason)}</span>}
            </div>
            {flag && <div className="lead-status-flag"><LeadFlag flag={flag} /></div>}
            <p className="lead-status-reply">
                {firstReplyHours === null
                    ? 'No reply recorded yet.'
                    : <>First reply {formatHours(firstReplyHours)} after the request ({when(lead.first_reply_at)}){firstReplyHours > REPLY_PROMISE_HOURS ? `, later than the ${REPLY_PROMISE_HOURS} h promise` : ''}.</>}
            </p>

            {!choice ? (
                <div className="lead-status-actions">
                    {status === 'new' && (
                        <button type="button" className="admin-btn-primary admin-btn-sm" onClick={() => save(applyChange(lead, { status: 'replied' }))} disabled={saving}>
                            {saving ? 'Saving…' : 'Mark replied now'}
                        </button>
                    )}
                    <span className="lead-status-actions-label">Set:</span>
                    {LEAD_STATUSES.filter((s) => s.id !== 'new' && s.id !== status).map((s) => (
                        <button type="button" key={s.id} className="admin-btn-secondary admin-btn-sm" onClick={() => start(s.id)} disabled={saving}>
                            {s.label}…
                        </button>
                    ))}
                    {isOpen(status) && (
                        <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => start('follow_up')} disabled={saving}>
                            Record a follow-up…
                        </button>
                    )}
                </div>
            ) : (
                <div className="lead-status-form">
                    <p className="lead-status-form-title">
                        {choice === 'follow_up' ? 'Record a follow-up (a nudge, a check-in, a question about test results)' : <>Set the status to <StatusPill status={choice} /></>}
                    </p>
                    {choice === 'lost' && (
                        <fieldset className="lead-status-reasons">
                            <legend>Why was it lost?</legend>
                            {LOST_REASONS.map((r) => (
                                <label key={r.id}>
                                    <input type="radio" name="lead-lost-reason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} />
                                    {r.label}
                                </label>
                            ))}
                        </fieldset>
                    )}
                    <label className="lead-status-when">
                        <span>When</span>
                        <input type="datetime-local" value={at} max={toLocalInput(new Date())} onChange={(e) => setAt(e.target.value)} />
                    </label>
                    <p className="lead-status-hint">Change the time if it happened earlier, for example a reply sent on WhatsApp yesterday.</p>
                    <div className="lead-status-form-buttons">
                        <button type="button" className="admin-btn-primary admin-btn-sm" onClick={confirm} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                        <button type="button" className="admin-btn-secondary admin-btn-sm" onClick={() => { setChoice(null); setError(''); }} disabled={saving}>Cancel</button>
                    </div>
                </div>
            )}
            {error && <p className="lead-status-error" role="alert">{error}</p>}

            <div className="lead-status-history">
                <p className="lead-status-history-title">History</p>
                <ol>
                    <li><span className="lead-status-history-when">{when(lead.createdAt)}</span>Request came in</li>
                    {history.map((e, i) => (
                        <li key={i}>
                            <span className="lead-status-history-when">{when(e.at)}</span>
                            {e.follow_up ? 'Follow-up recorded' : `${statusLabel(e.status)}${e.status === 'lost' ? ` (${lostReasonLabel(e.reason)})` : ''}`}
                        </li>
                    ))}
                </ol>
                {last && !choice && (
                    <button type="button" className="lead-status-undo" onClick={() => save(undoLast(lead))} disabled={saving}>
                        Undo the last change ({last.follow_up ? 'follow-up' : statusLabel(last.status)}, {when(last.at)})
                    </button>
                )}
            </div>
        </div>
    );
}
