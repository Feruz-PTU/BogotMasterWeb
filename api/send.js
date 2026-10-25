// Vercel serverless function — sends email via Resend.
// The RESEND_API_KEY stays server-side and is never exposed to the browser.
//
// Required environment variables (set in Vercel → Project → Settings → Env Vars):
//   RESEND_API_KEY     — from https://resend.com/api-keys
//   CONTACT_TO_EMAIL   — inbox that receives leads (e.g. feruz@bogotmaster.org);
//                        the auto-reply's Reply-To, so a buyer's reply lands here
//   CONTACT_FROM_EMAIL — verified sender on the Resend domain
//                        (e.g. "Bogot Master <noreply@bogotmaster.org>")

import { Resend } from 'resend';
// Plain data modules shared with the site, so the emails use the same
// reference format, option labels and contact details as the form.
import { REFERENCE_RE, makeReference } from '../src/utils/leadReference.js';
import { FALLBACK_STRINGS } from '../src/i18n/fallback-strings.js';
import { APPLICATIONS, STANDARDS, NEEDED_BY, CHANNELS } from '../src/utils/requestOptions.js';
import { INCOTERMS_ANY, INCOTERMS_SEA, QUANTITY_UNITS, incotermLabel } from '../src/i18n/incoterms.js';
import { CONTACT_INFO } from '../src/config.js';

// Quotes are escaped too. Nothing currently places user text inside an HTML
// attribute, so this is not a live hole — but if a future edit ever does, an
// apostrophe in a company name would silently break out of the attribute.
const esc = (s = '') =>
    String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

// Site design tokens (CLAUDE.md): olive #515E3B, beige #F5F4F0, Poppins.
const FONT = "'Poppins','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const OLIVE = '#515E3B';
const BEIGE = '#F5F4F0';
const INK = '#2b2b2b';
const MUTED = '#8a8a7d';
const LINE = '#e4e2d9';

const TAGLINES = {
    en: 'LICORICE ROOT EXPORT · UZBEKISTAN',
    ru: 'ЭКСПОРТ КОРНЯ СОЛОДКИ · УЗБЕКИСТАН',
};

// Shared email shell: olive header band, beige canvas, centered 600px white card,
// muted footer. Table-based so it survives Outlook / Gmail rendering.
function shell(inner, { footerNote = '', lang = 'en' } = {}) {
    return `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BEIGE};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BEIGE};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${LINE};">
        <tr>
          <td style="background:${OLIVE};padding:28px 32px;">
            <div style="font-family:${FONT};color:#ffffff;font-size:20px;font-weight:600;letter-spacing:2px;">BOGOT&nbsp;MASTER</div>
            <div style="font-family:${FONT};color:#d7dccb;font-size:12px;letter-spacing:1px;margin-top:4px;">${TAGLINES[lang] || TAGLINES.en}</div>
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

// The tag that starts the owner's subject line, by request type.
const SUBJECT_TAGS = { quote: 'Quote', price: 'Quote', sample: 'Sample', docs: 'Docs', contact: 'Question' };

/**
 * A subject the owner can triage before opening the email, with the lead's
 * reference after the type:
 *   [Quote] BM-7K4Q2 · Slice A 22 t +2 more · Germany · FCA
 *   [Sample] BM-3XW9C · Powder · South Korea
 *   [Question] BM-H8N2F · Ivan Petrov
 * Every part is already clamped (control characters stripped), and the whole
 * line is cut to 120 characters.
 */
export function subjectLine(d) {
    const tag = `[${SUBJECT_TAGS[d.type] || 'Inquiry'}]`;
    const [first, ...rest] = d.items || [];
    const head = first
        ? [first.title, first.quantity, rest.length ? `+${rest.length} more` : ''].filter(Boolean).join(' ')
        : d.product;
    const parts = [d.reference, head || d.name, d.destination_country, d.incoterms].filter(Boolean);
    return clamp(`${tag} ${parts.join(' · ')}`, 120);
}

// "22 t", "500 kg", "2 × 40 ft container", "1 × truck".
function totalQuantity(quantity, unit) {
    if (!quantity) return '';
    if (!unit) return quantity;
    return unit === 't' || unit === 'kg' ? `${quantity} ${unit}` : `${quantity} × ${unit}`;
}

export function businessHtml(d) {
    const row = (label, value) =>
        value ? `<tr>
            <td style="padding:10px 0;color:${MUTED};font-size:13px;white-space:nowrap;vertical-align:top;border-bottom:1px solid ${LINE};width:120px;">${esc(label)}</td>
            <td style="padding:10px 0 10px 16px;color:${INK};font-size:14px;border-bottom:1px solid ${LINE};white-space:pre-line;">${esc(value)}</td>
        </tr>` : '';

    const itemsRows = Array.isArray(d.items) && d.items.length
        ? `<p style="margin:24px 0 8px;color:${MUTED};font-size:13px;text-transform:uppercase;letter-spacing:1px;">Items</p>
           <ul style="margin:0;padding-left:18px;color:${INK};font-size:14px;line-height:1.8;">
             ${d.items.map(i => `<li>${esc(i.title)}${i.quantity ? ` — <strong>${esc(i.quantity)}</strong>` : ''}</li>`).join('')}
           </ul>` : '';

    const inner = `
      <div style="display:inline-block;background:${BEIGE};color:${OLIVE};font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;padding:6px 12px;border-radius:999px;">${esc(TYPE_LABELS[d.type] || d.type || 'inquiry')}</div>
      <h1 style="font-size:20px;color:${INK};margin:16px 0 24px;font-weight:600;">New inquiry from ${esc(d.name)}</h1>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${row('Reference', d.reference)}
        ${row('Name', d.name)}
        ${row('Email', d.email)}
        ${row('Phone', d.phone)}
        ${row('Reply by', d.preferred_channel)}
        ${row('Company', d.company)}
        ${row('Product', d.product)}
        ${row('Quantity', d.quantity)}
        ${row('Annual volume', d.annual_volume)}
        ${row('Used for', d.application)}
        ${row('Standard', d.standard)}
        ${row('Destination country', d.destination_country)}
        ${row('Port / city', d.destination_port)}
        ${row('Incoterms', d.incoterms)}
        ${row('Total quantity', totalQuantity(d.total_quantity, d.quantity_unit))}
        ${row('Needed by', d.timeline)}
        ${row('Sample address', d.sample_address)}
        ${row('FedEx account', d.fedex_account)}
      </table>
      ${itemsRows}
      ${d.message ? `
        <p style="margin:24px 0 8px;color:${MUTED};font-size:13px;text-transform:uppercase;letter-spacing:1px;">Message</p>
        <div style="background:${BEIGE};border-radius:8px;padding:16px;white-space:pre-line;font-size:14px;line-height:1.6;color:${INK};">${esc(d.message)}</div>` : ''}`;

    return shell(inner, { footerNote: `Reply directly to this email to reach ${esc(d.name)}. Their reference is ${esc(d.reference)}.` });
}

// ─── The auto-reply to the buyer ────────────────────────────────────────────
//
// Signed by the sales representative, with the reference, a copy of the
// request and the next steps. It goes to whatever address was typed into the
// form, so it repeats only the structured request: never the free-text
// message, the address or the phone, and no field that holds a link (a
// spammer could otherwise use the form to send their text from our domain).
// The owner's email above always has everything.

const AUTO_REPLY = {
    en: {
        subject: (ref) => `Your request ${ref} | Bogot Master`,
        hello: (name) => (name ? `Hello, ${name}!` : 'Hello!'),
        intro: 'Thank you for your request. Here is a copy of what you sent, with its reference number.',
        refLabel: 'Your reference',
        refNote: 'Mention it if you write to us on WhatsApp or Telegram.',
        requestTitle: 'Your request',
        labels: {
            type: 'Request',
            products: 'Products',
            annual: 'Annual volume',
            application: 'Used for',
            standard: 'Standard',
            destination: 'Destination',
            incoterms: 'Delivery terms',
            needed: 'Needed by',
            channel: 'Reply by',
        },
        nextTitle: 'What happens next',
        reply: (via) => (via ? `I reply within 24 hours, ${via} as you asked.` : 'I reply within 24 hours.'),
        via: { WhatsApp: 'on WhatsApp', Email: 'by email', Telegram: 'on Telegram', 'Phone call': 'by phone' },
        steps: {
            quote: 'Your quotation states the Incoterm and named place, how long the price is valid (7 days), payment terms (T/T, L/C or D/P), lead time and packing.',
            sampleOffer: 'Want to test first? Free samples, 100–200 g per grade, are sent by FedEx after 3 business days of preparation.',
            sampleShip: 'Your free sample is sent by FedEx after 3 business days of preparation, at your cost or on your own FedEx account.',
            docs: 'I send the specification and the documents you asked for.',
        },
        replyNote: 'Reply to this email to add details or files.',
        regards: 'Best regards,',
        name: 'Feruz',
        role: 'Sales Representative, Bogot Master',
        footer: 'You received this email because a request was sent with this address on bogotmaster.org.',
    },
    ru: {
        subject: (ref) => `Ваш запрос ${ref} | Bogot Master`,
        hello: (name) => (name ? `Здравствуйте, ${name}!` : 'Здравствуйте!'),
        intro: 'Спасибо за ваш запрос. Ниже — копия того, что вы отправили, и номер запроса.',
        refLabel: 'Номер вашего запроса',
        refNote: 'Укажите его, если будете писать нам в WhatsApp или Telegram.',
        requestTitle: 'Ваш запрос',
        labels: {
            type: 'Запрос',
            products: 'Позиции',
            annual: 'Годовой объём',
            application: 'Применение',
            standard: 'Стандарт',
            destination: 'Пункт назначения',
            incoterms: 'Условия поставки',
            needed: 'Срок',
            channel: 'Способ связи',
        },
        nextTitle: 'Что дальше',
        reply: (via) => (via ? `Я отвечу в течение 24 часов — ${via}, как вы просили.` : 'Я отвечу в течение 24 часов.'),
        via: { WhatsApp: 'в WhatsApp', Email: 'по электронной почте', Telegram: 'в Telegram', 'Phone call': 'по телефону' },
        steps: {
            quote: 'В коммерческом предложении будут базис поставки Incoterms с названным местом, срок действия цены (7 дней), условия оплаты (T/T, аккредитив или D/P), срок поставки и упаковка.',
            sampleOffer: 'Хотите сначала проверить качество? Бесплатные образцы, 100–200 г каждой позиции, отправляем FedEx через 3 рабочих дня подготовки.',
            sampleShip: 'Бесплатный образец отправим FedEx через 3 рабочих дня подготовки — доставка за ваш счёт или через ваш аккаунт FedEx.',
            docs: 'Я пришлю спецификацию и запрошенные документы.',
        },
        replyNote: 'Ответьте на это письмо, чтобы добавить детали или файлы.',
        regards: 'С уважением,',
        name: 'Феруз',
        role: 'менеджер по продажам, Bogot Master',
        footer: 'Вы получили это письмо, потому что с этим адресом был отправлен запрос на сайте bogotmaster.org.',
    },
};

// The request type's name, as the form shows it.
const TYPE_KEYS = { quote: 'rf_type_quote', price: 'rf_type_quote', sample: 'rf_type_sample', docs: 'rf_type_docs', contact: 'rf_type_other' };

// The next steps, by request type.
const STEPS_BY_TYPE = {
    quote: ['quote', 'sampleOffer'],
    price: ['quote', 'sampleOffer'],
    sample: ['sampleShip', 'quote'],
    docs: ['docs', 'sampleOffer'],
};

const str = (lang, key) => FALLBACK_STRINGS[lang]?.[key] ?? FALLBACK_STRINGS.en[key] ?? '';

// A form option's label in the reply's language; '' for a value the form
// never offers (a request posted straight to this endpoint).
const optionLabel = (options, value, lang) => {
    const option = options.find((o) => o.value === value);
    return option ? str(lang, option.key) : '';
};

// Anything that could carry a link or an address is left out of the reply.
const LINKISH = /(:\/\/|www\.|@|\.(?:com|net|org|info|biz|ru|xyz|top|io|co|me|site|online|shop|link|click|app|ly)\b)/i;
const echo = (value, max = 80) => (value && value.length <= max && !LINKISH.test(value) ? value : '');

// "22 t" → "22 т"; "2 × 40 ft container" → "2 × контейнеры 40 фут". The form
// builds these strings (formatAmount); anything else is left out.
function localAmount(value, lang) {
    const m = /^(\d+(?:[.,]\d+)?)(?: × | )(.+)$/.exec(value || '');
    const unit = m && QUANTITY_UNITS.find((u) => u.value === m[2]);
    if (!unit) return '';
    return unit.value === 't' || unit.value === 'kg' ? `${m[1]} ${str(lang, unit.label)}` : `${m[1]} × ${str(lang, unit.label)}`;
}

const INCOTERMS = new Set([...INCOTERMS_ANY, ...INCOTERMS_SEA]);

// Exported, like the owner's email, so a test can render it.
export function autoReplyHtml(d, lang = 'en') {
    const c = AUTO_REPLY[lang] || AUTO_REPLY.en;
    const L = c.labels;

    const products = (d.items || [])
        .map((i) => ({ title: echo(i.title), amount: localAmount(i.quantity, lang) }))
        .filter((i) => i.title);
    const destination = [echo(d.destination_country), echo(d.destination_port)].filter(Boolean).join(', ');

    const row = (label, valueHtml) =>
        valueHtml ? `<tr>
            <td style="padding:9px 0;color:${MUTED};font-size:13px;vertical-align:top;border-bottom:1px solid ${LINE};width:130px;">${esc(label)}</td>
            <td style="padding:9px 0 9px 14px;color:${INK};font-size:14px;line-height:1.6;border-bottom:1px solid ${LINE};">${valueHtml}</td>
        </tr>` : '';
    const text = (value) => (value ? esc(value) : '');

    const productList = products.length
        ? products.map((p) => `${esc(p.title)}${p.amount ? ` — <strong>${esc(p.amount)}</strong>` : ''}`).join('<br>')
        : '';

    const via = c.via[d.preferred_channel] || '';
    const steps = [c.reply(via), ...(STEPS_BY_TYPE[d.type] || []).map((s) => c.steps[s])];
    const stepRows = steps.map((s, i) => `<tr>
            <td style="width:30px;vertical-align:top;padding:0 0 12px;">
              <div style="width:22px;height:22px;line-height:22px;border-radius:11px;background:${OLIVE};color:#ffffff;font-size:12px;font-weight:600;text-align:center;font-family:${FONT};">${i + 1}</div>
            </td>
            <td style="vertical-align:top;padding:1px 0 12px;font-size:14px;line-height:1.6;color:${INK};font-family:${FONT};">${esc(s)}</td>
        </tr>`).join('');

    const heading = (title) =>
        `<p style="margin:28px 0 10px;color:${MUTED};font-size:13px;text-transform:uppercase;letter-spacing:1px;font-family:${FONT};">${esc(title)}</p>`;

    const whatsappDigits = CONTACT_INFO.social.whatsapp;
    const whatsappShown = CONTACT_INFO.phone.find((p) => p.replace(/\D/g, '') === whatsappDigits) || `+${whatsappDigits}`;

    const inner = `
      <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:${INK};">${esc(c.hello(echo(d.name, 100)))}</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:${INK};">${esc(c.intro)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BEIGE};border-left:4px solid ${OLIVE};border-radius:8px;">
        <tr><td style="padding:16px 20px;font-family:${FONT};">
          <div style="color:${MUTED};font-size:12px;letter-spacing:1px;text-transform:uppercase;">${esc(c.refLabel)}</div>
          <div style="color:${OLIVE};font-size:24px;font-weight:700;letter-spacing:2px;margin:4px 0 6px;">${esc(d.reference)}</div>
          <div style="color:${INK};font-size:13px;line-height:1.5;">${esc(c.refNote)}</div>
        </td></tr>
      </table>
      ${heading(c.requestTitle)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:${FONT};">
        ${row(L.type, text(str(lang, TYPE_KEYS[d.type] || 'rf_type_other')))}
        ${row(L.products, productList)}
        ${row(L.annual, text(localAmount(d.annual_volume, lang)))}
        ${row(L.application, text(optionLabel(APPLICATIONS, d.application, lang)))}
        ${row(L.standard, text(optionLabel(STANDARDS, d.standard, lang)))}
        ${row(L.destination, text(destination))}
        ${row(L.incoterms, text(INCOTERMS.has(d.incoterms) ? incotermLabel(d.incoterms, lang) : ''))}
        ${row(L.needed, text(optionLabel(NEEDED_BY, d.timeline, lang)))}
        ${row(L.channel, text(optionLabel(CHANNELS, d.preferred_channel, lang)))}
      </table>
      ${heading(c.nextTitle)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${stepRows}</table>
      <p style="margin:12px 0 24px;font-size:15px;line-height:1.7;color:${INK};font-weight:600;">${esc(c.replyNote)}</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:${INK};">
        ${esc(c.regards)}<br>
        <strong style="color:${OLIVE};font-size:15px;">${esc(c.name)}</strong><br>
        ${esc(c.role)}<br>
        <span style="color:${MUTED};">WhatsApp ${esc(whatsappShown)} · bogotmaster.org</span>
      </p>`;

    return shell(inner, { footerNote: esc(c.footer), lang });
}

// "Bogot Master <noreply@…>" → "Feruz from Bogot Master <noreply@…>": the
// buyer sees a person, and replies go to Reply-To (the sales inbox).
function namedSender(from, name) {
    const m = /<([^>]+)>/.exec(from);
    return `${name} <${(m ? m[1] : from).trim()}>`;
}

const EMAIL_RE = /^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]+$/;
// 'sample' and 'docs' come from the request form (src/components/RequestForm.jsx).
const TYPES = new Set(['contact', 'price', 'quote', 'sample', 'docs']);
// The badge at the top of the owner's email.
const TYPE_LABELS = {
    contact: 'Question',
    price: 'Price request',
    quote: 'Quote request',
    sample: 'Free sample',
    docs: 'Spec sheet and documents',
};
/* eslint-disable no-control-regex --
   Matching control characters is the entire point of these two helpers: it is
   what stops a newline in a name or email field from injecting an extra mail
   header (a second recipient, a forged reply-to). */

// Single-line clamp: strip all control chars (blocks header/subject injection).
const clamp = (v, n) =>
    (typeof v === 'string' ? v.replace(/[\x00-\x1f\x7f]/g, '').slice(0, n) : '');
// Multi-line clamp: keep newlines, drop other control chars.
const clampText = (v, n) =>
    (typeof v === 'string'
        ? v.replace(/\r\n?/g, '\n').replace(/[\x00-\x09\x0b-\x1f\x7f]/g, '').slice(0, n)
        : '');
/* eslint-enable no-control-regex */

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

// Reject requests that do not come from this site.
//
// This previously returned `true` when the Origin header was absent, which
// meant any scripted request (curl, a bot, anything that is not a browser)
// was waved straight through — the check only ever stopped cross-site
// submissions from inside a browser. A real browser form post always sends
// Origin, so a missing one is now refused.
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

// Server-side repeat of the two client-side bot checks. A bot that posts
// directly to this endpoint never runs the client code, so the checks have to
// exist here too.
const MIN_FILL_MS = 3000;
function looksAutomated(body) {
    if (typeof body.company_website === 'string' && body.company_website.trim() !== '') {
        return true; // honeypot filled
    }
    const elapsed = Number(body.elapsed_ms);
    if (Number.isFinite(elapsed) && elapsed > 0 && elapsed < MIN_FILL_MS) {
        return true; // submitted faster than a human can type
    }
    return false;
}

// Vercel parses the body before the handler runs, so a very large payload is
// already buffered by then. Refusing early on Content-Length keeps the obvious
// abuse cheap. The real forms are well under 10 KB.
const MAX_BODY_BYTES = 32 * 1024;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    if (!originAllowed(req)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const declared = Number(req.headers['content-length'] || 0);
    if (declared > MAX_BODY_BYTES) {
        return res.status(413).json({ success: false, message: 'Payload too large' });
    }

    // Prefer Vercel's own client IP header; x-forwarded-for is client-settable
    // at the left-most position in the general case.
    const ip =
        req.headers['x-real-ip'] ||
        (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        'unknown';
    if (rateLimited(ip)) {
        return res.status(429).json({ success: false, message: 'Too many requests' });
    }

    const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env;
    if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
        console.error('[send] Missing email env vars');
        return res.status(500).json({ success: false, message: 'Email not configured' });
    }

    const body = req.body || {};
    // The browser's reference, which the saved lead already carries; a missing
    // or malformed one is replaced (that lead then has none to match).
    const reference = typeof body.reference === 'string' && REFERENCE_RE.test(body.reference)
        ? body.reference
        : makeReference();

    // Looks like a bot: answer 200 so it believes it succeeded, and send
    // nothing. Returning an error would tell it which check to defeat.
    if (looksAutomated(body)) {
        return res.status(200).json({ success: true, reference });
    }

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
        reference,
        name,
        email,
        phone: clamp(body.phone, 32),
        company: clamp(body.company, 200),
        product: clamp(body.product, 200),
        quantity: clamp(body.quantity, 64),
        message: clampText(body.message, 5000),
        // Optional B2B trade terms from the quote form.
        destination_country: clamp(body.destination_country, 80),
        destination_port: clamp(body.destination_port, 80),
        incoterms: clamp(body.incoterms, 24),
        total_quantity: clamp(body.total_quantity, 32),
        quantity_unit: clamp(body.quantity_unit, 16),
        timeline: clamp(body.timeline, 80),
        // The request form's fields.
        annual_volume: clamp(body.annual_volume, 32),
        application: clamp(body.application, 80),
        standard: clamp(body.standard, 80),
        preferred_channel: clamp(body.preferred_channel, 16),
        sample_address: clampText(body.sample_address, 300),
        fedex_account: clamp(body.fedex_account, 40),
        items: Array.isArray(body.items)
            ? body.items.slice(0, 20).map(i => ({
                title: clamp(i?.title, 200),
                quantity: clamp(i?.quantity, 64),
            }))
            : [],
    };

    const resend = new Resend(RESEND_API_KEY);
    // English is the site's default language now, so it is the fallback.
    const language = body.language === 'ru' ? 'ru' : 'en';

    try {
        // 1) Notify the business. reply_to = customer, so a reply goes straight back.
        const { error } = await resend.emails.send({
            from: CONTACT_FROM_EMAIL,
            to: CONTACT_TO_EMAIL,
            replyTo: d.email,
            subject: subjectLine(d),
            html: businessHtml(d),
        });
        if (error) throw new Error(error.message || 'Resend error');

        // 2) Auto-reply to the customer, from the sales representative by name;
        //    a reply to it goes to the sales inbox. Failure here must not fail
        //    the request: the success screen then just leaves out "a copy is
        //    on its way".
        let confirmation = false;
        try {
            const { error: replyError } = await resend.emails.send({
                from: namedSender(CONTACT_FROM_EMAIL, 'Feruz from Bogot Master'),
                to: d.email,
                replyTo: CONTACT_TO_EMAIL.split(',').map((s) => s.trim()).filter(Boolean),
                subject: AUTO_REPLY[language].subject(reference),
                html: autoReplyHtml(d, language),
            });
            if (replyError) throw new Error(replyError.message || 'Resend error');
            confirmation = true;
        } catch (e) {
            console.warn('[send] auto-reply failed:', e.message);
        }

        return res.status(200).json({ success: true, reference, confirmation });
    } catch (err) {
        console.error('[send] failed:', err.message);
        return res.status(502).json({ success: false, message: 'Failed to send email' });
    }
}
