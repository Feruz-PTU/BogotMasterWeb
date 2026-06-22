// Vercel serverless function — sends email via Resend.
// The RESEND_API_KEY stays server-side and is never exposed to the browser.
//
// Required environment variables (set in Vercel → Project → Settings → Env Vars):
//   RESEND_API_KEY     — from https://resend.com/api-keys
//   CONTACT_TO_EMAIL   — inbox that receives leads (e.g. bogotmaster@gmail.com)
//   CONTACT_FROM_EMAIL — verified sender on the Resend domain
//                        (e.g. "Bogot Master <noreply@bogotmaster.org>")

import { Resend } from 'resend';

const esc = (s = '') =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const AUTO_REPLY = {
    ru: (name, product) =>
        `Здравствуйте, ${name}!\n\nСпасибо за ваш запрос${product ? ` по продукту «${product}»` : ''}.\nНаш специалист свяжется с вами в течение 24 часов.\n\nС уважением,\nКоманда Bogot Master`,
    en: (name, product) =>
        `Hello, ${name}!\n\nThank you for your inquiry${product ? ` regarding «${product}»` : ''}.\nOur specialist will contact you within 24 hours.\n\nBest regards,\nBogot Master Team`,
};

// Site design tokens (CLAUDE.md): olive #515E3B, beige #F5F4F0, Poppins.
const FONT = "'Poppins','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const OLIVE = '#515E3B';
const BEIGE = '#F5F4F0';
const INK = '#2b2b2b';
const MUTED = '#8a8a7d';
const LINE = '#e4e2d9';

// Shared email shell: olive header band, beige canvas, centered 600px white card,
// muted footer. Table-based so it survives Outlook / Gmail rendering.
function shell(inner, { footerNote = '' } = {}) {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BEIGE};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BEIGE};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${LINE};">
        <tr>
          <td style="background:${OLIVE};padding:28px 32px;">
            <div style="font-family:${FONT};color:#ffffff;font-size:20px;font-weight:600;letter-spacing:2px;">BOGOT&nbsp;MASTER</div>
            <div style="font-family:${FONT};color:#d7dccb;font-size:12px;letter-spacing:1px;margin-top:4px;">LICORICE ROOT EXPORT · UZBEKISTAN</div>
          </td>
        </tr>
        <tr><td style="padding:32px;font-family:${FONT};color:${INK};">${inner}</td></tr>
        <tr>
          <td style="background:${BEIGE};padding:20px 32px;font-family:${FONT};color:${MUTED};font-size:12px;line-height:1.6;border-top:1px solid ${LINE};">
            ${footerNote ? `${footerNote}<br>` : ''}Bogot Master · bogotmaster.org
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function businessHtml(d) {
    const row = (label, value) =>
        value ? `<tr>
            <td style="padding:10px 0;color:${MUTED};font-size:13px;white-space:nowrap;vertical-align:top;border-bottom:1px solid ${LINE};width:120px;">${esc(label)}</td>
            <td style="padding:10px 0 10px 16px;color:${INK};font-size:14px;border-bottom:1px solid ${LINE};">${esc(value)}</td>
        </tr>` : '';

    const itemsRows = Array.isArray(d.items) && d.items.length
        ? `<p style="margin:24px 0 8px;color:${MUTED};font-size:13px;text-transform:uppercase;letter-spacing:1px;">Items</p>
           <ul style="margin:0;padding-left:18px;color:${INK};font-size:14px;line-height:1.8;">
             ${d.items.map(i => `<li>${esc(i.title)}${i.quantity ? ` — <strong>${esc(i.quantity)}</strong>` : ''}</li>`).join('')}
           </ul>` : '';

    const inner = `
      <div style="display:inline-block;background:${BEIGE};color:${OLIVE};font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:6px 12px;border-radius:999px;">${esc(d.type || 'inquiry')}</div>
      <h1 style="font-size:20px;color:${INK};margin:16px 0 24px;font-weight:600;">New inquiry from ${esc(d.name)}</h1>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${row('Name', d.name)}
        ${row('Email', d.email)}
        ${row('Phone', d.phone)}
        ${row('Company', d.company)}
        ${row('Product', d.product)}
        ${row('Quantity', d.quantity)}
      </table>
      ${itemsRows}
      ${d.message ? `
        <p style="margin:24px 0 8px;color:${MUTED};font-size:13px;text-transform:uppercase;letter-spacing:1px;">Message</p>
        <div style="background:${BEIGE};border-radius:8px;padding:16px;white-space:pre-line;font-size:14px;line-height:1.6;color:${INK};">${esc(d.message)}</div>` : ''}`;

    return shell(inner, { footerNote: `Reply directly to this email to reach ${esc(d.name)}.` });
}

export function autoReplyHtml(message) {
    const inner = `
      <div style="white-space:pre-line;font-size:15px;line-height:1.7;color:${INK};">${esc(message)}</div>
      <div style="height:1px;background:${LINE};margin:28px 0;"></div>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr><td style="color:${MUTED};font-size:13px;line-height:1.7;font-family:${FONT};">
          <strong style="color:${OLIVE};">Bogot Master</strong><br>
          Licorice Root Export · Uzbekistan<br>
          bogotmaster.org
        </td></tr>
      </table>`;

    return shell(inner, { footerNote: 'This is an automated confirmation — no need to reply.' });
}

const EMAIL_RE = /^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]+$/;
const TYPES = new Set(['contact', 'price', 'quote']);
// Single-line clamp: strip all control chars (blocks header/subject injection).
const clamp = (v, n) =>
    (typeof v === 'string' ? v.replace(/[\x00-\x1f\x7f]/g, '').slice(0, n) : '');
// Multi-line clamp: keep newlines, drop other control chars.
const clampText = (v, n) =>
    (typeof v === 'string'
        ? v.replace(/\r\n?/g, '\n').replace(/[\x00-\x09\x0b-\x1f\x7f]/g, '').slice(0, n)
        : '');

// Best-effort in-memory rate limit. Serverless instances are ephemeral so this
// only throttles within a warm instance — a backstop, not a guarantee. For hard
// limits add Cloudflare Turnstile (CAPTCHA) + Upstash rate limiting (see DEPLOY.md).
const HITS = new Map(); // ip -> number[] (timestamps)
const RL_WINDOW_MS = 10 * 60 * 1000;
const RL_MAX = 5;
function rateLimited(ip) {
    const now = Date.now();
    const recent = (HITS.get(ip) || []).filter(t => now - t < RL_WINDOW_MS);
    if (recent.length >= RL_MAX) { HITS.set(ip, recent); return true; }
    recent.push(now);
    HITS.set(ip, recent);
    return false;
}

// Reject browser requests coming from a different site (basic anti-abuse).
// Same-origin fetches send an Origin whose host matches the request host. If
// ALLOWED_ORIGIN is set it takes precedence (comma-separated list of hosts).
function originAllowed(req) {
    const origin = req.headers.origin;
    if (!origin) return true; // non-browser / same-origin without Origin — allow
    let host;
    try { host = new URL(origin).host; } catch { return false; }
    const allow = (process.env.ALLOWED_ORIGIN || '')
        .split(',').map(s => s.trim()).filter(Boolean);
    if (allow.length) return allow.includes(host);
    return host === req.headers.host;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    if (!originAllowed(req)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    if (rateLimited(ip)) {
        return res.status(429).json({ success: false, message: 'Too many requests' });
    }

    const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env;
    if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
        console.error('[send] Missing email env vars');
        return res.status(500).json({ success: false, message: 'Email not configured' });
    }

    const body = req.body || {};

    // Validate + clamp every field. Reject (not truncate) so abuse is visible.
    const email = clamp(body.email, 254).trim();
    const name = clamp(body.name, 100).trim();
    if (!name || !email || !EMAIL_RE.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid name or email' });
    }
    if (typeof body.message === 'string' && body.message.length > 5000) {
        return res.status(400).json({ success: false, message: 'Message too long' });
    }
    if (Array.isArray(body.items) && body.items.length > 20) {
        return res.status(400).json({ success: false, message: 'Too many items' });
    }

    const d = {
        type: TYPES.has(body.type) ? body.type : 'inquiry',
        name,
        email,
        phone: clamp(body.phone, 32),
        company: clamp(body.company, 200),
        product: clamp(body.product, 200),
        quantity: clamp(body.quantity, 64),
        message: clampText(body.message, 5000),
        items: Array.isArray(body.items)
            ? body.items.slice(0, 20).map(i => ({
                title: clamp(i?.title, 200),
                quantity: clamp(i?.quantity, 64),
            }))
            : [],
    };

    const resend = new Resend(RESEND_API_KEY);
    const language = body.language === 'en' ? 'en' : 'ru';

    try {
        // 1) Notify the business. reply_to = customer, so a reply goes straight back.
        const { error } = await resend.emails.send({
            from: CONTACT_FROM_EMAIL,
            to: CONTACT_TO_EMAIL,
            replyTo: d.email,
            subject: `New ${d.type} from ${d.name}`,
            html: businessHtml(d),
        });
        if (error) throw new Error(error.message || 'Resend error');

        // 2) Auto-reply to the customer. Failure here must not fail the request.
        try {
            const body = AUTO_REPLY[language](d.name, d.product || '');
            await resend.emails.send({
                from: CONTACT_FROM_EMAIL,
                to: d.email,
                subject: language === 'ru'
                    ? 'Спасибо за ваш запрос | Bogot Master'
                    : 'Thank you for your inquiry | Bogot Master',
                html: autoReplyHtml(body),
            });
        } catch (e) {
            console.warn('[send] auto-reply failed:', e.message);
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('[send] failed:', err.message);
        return res.status(502).json({ success: false, message: 'Failed to send email' });
    }
}
