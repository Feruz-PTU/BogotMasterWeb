/**
 * Option lists and small helpers for the request form (RequestForm.jsx),
 * from Appendix A §A2 of the strategy audit.
 *
 * Each option has a `value`, which is what the lead and the owner's email
 * carry (English, so every lead reads the same whatever the page language),
 * and a `key`, the translation key the form shows.
 */

/**
 * The four request types. `lead` is the type stored with the lead; `event` is
 * the key in analytics.js EVENTS fired on a successful send.
 */
export const REQUEST_TYPES = [
    { value: 'quote', lead: 'quote', key: 'rf_type_quote', submitKey: 'rf_submit_quote', event: 'FORM_SUBMIT_PRICE' },
    { value: 'sample', lead: 'sample', key: 'rf_type_sample', submitKey: 'rf_submit_sample', event: 'FORM_SUBMIT_SAMPLE' },
    { value: 'docs', lead: 'docs', key: 'rf_type_docs', submitKey: 'rf_submit_docs', event: 'FORM_SUBMIT_DOCS' },
    { value: 'other', lead: 'contact', key: 'rf_type_other', submitKey: 'rf_submit_other', event: 'FORM_SUBMIT_CONTACT' },
];

export const findRequestType = (value) =>
    REQUEST_TYPES.find((r) => r.value === value) || REQUEST_TYPES[0];

/**
 * Which fields each type shows. A field that is not shown is not sent.
 * `required` lists the ones that must be filled.
 */
export const FIELDS_BY_TYPE = {
    quote: {
        show: ['products', 'quantity', 'annual', 'application', 'standard', 'country', 'port', 'incoterms', 'needed', 'company'],
        required: ['products', 'country'],
    },
    sample: {
        show: ['products', 'annual', 'application', 'standard', 'country', 'company', 'sample_address', 'fedex'],
        required: ['products', 'country', 'company', 'sample_address'],
    },
    docs: {
        show: ['products', 'application', 'standard', 'company'],
        required: ['products'],
    },
    other: {
        show: ['company'],
        required: [],
    },
};

export const APPLICATIONS = [
    { value: 'Confectionery', key: 'rf_app_confectionery' },
    { value: 'Beverages and tea', key: 'rf_app_beverages' },
    { value: 'Tobacco flavour', key: 'rf_app_tobacco' },
    { value: 'Extract production', key: 'rf_app_extract' },
    { value: 'Herbal medicinal products', key: 'rf_app_herbal' },
    { value: 'Food supplements', key: 'rf_app_supplements' },
    { value: 'Cosmetics', key: 'rf_app_cosmetics' },
    { value: 'Animal feed', key: 'rf_app_feed' },
    { value: 'Other', key: 'rf_app_other' },
];

export const STANDARDS = [
    { value: 'Our standard spec', key: 'rf_std_ours' },
    { value: 'Ph. Eur.', key: 'rf_std_pheur' },
    { value: 'USP', key: 'rf_std_usp' },
    { value: 'Russian pharmacopoeia', key: 'rf_std_ru' },
    { value: 'Korean pharmacopoeia', key: 'rf_std_kp' },
    { value: 'My own spec', key: 'rf_std_own' },
];

export const NEEDED_BY = [
    { value: 'Under 1 month', key: 'rf_needed_1m' },
    { value: '1–3 months', key: 'rf_needed_3m' },
    { value: '3–6 months', key: 'rf_needed_6m' },
    { value: 'Over 6 months', key: 'rf_needed_later' },
    { value: 'Just researching', key: 'rf_needed_research' },
];

/** WhatsApp first: the sales rep's fastest channel (24 Oct 2026). */
export const CHANNELS = [
    { value: 'WhatsApp', key: 'rf_channel_whatsapp', needsPhone: true },
    { value: 'Email', key: 'rf_channel_email', needsPhone: false },
    { value: 'Telegram', key: 'rf_channel_telegram', needsPhone: true },
    { value: 'Phone call', key: 'rf_channel_phone', needsPhone: true },
];

/** "22" -> 22, "1,5" -> 1.5; anything else -> NaN. */
export const parseAmount = (value) => {
    const v = String(value || '').trim().replace(',', '.');
    return /^\d+(\.\d+)?$/.test(v) ? Number(v) : NaN;
};

/** A filled amount must be a number above 0; an empty one is fine. */
export const isValidAmount = (value) => {
    if (!String(value || '').trim()) return true;
    const n = parseAmount(value);
    return Number.isFinite(n) && n > 0;
};

/** Below the 1 t minimum order? Only t and kg can be; a truck or container is a full load. */
export const belowMinimum = (value, unit) => {
    const n = parseAmount(value);
    if (!Number.isFinite(n) || n <= 0) return false;
    if (unit === 't') return n < 1;
    if (unit === 'kg') return n < 1000;
    return false;
};

/** "22 t", "500 kg", "2 × 40 ft container"; empty when no amount. */
export const formatAmount = (value, unit) => {
    const v = String(value || '').trim();
    if (!v) return '';
    if (!unit) return v;
    return unit === 't' || unit === 'kg' ? `${v} ${unit}` : `${v} × ${unit}`;
};

// Free-mail providers. For a sample request a company address speeds up the
// approval, so these get a soft note, never a block.
const FREE_MAIL = /@(gmail\.com|googlemail\.com|yahoo\.[a-z.]+|ymail\.com|hotmail\.[a-z.]+|outlook\.[a-z.]+|live\.[a-z.]+|msn\.com|icloud\.com|me\.com|mac\.com|aol\.com|gmx\.[a-z.]+|proton\.me|protonmail\.com|mail\.ru|yandex\.[a-z]+|ya\.ru|rambler\.ru|bk\.ru|list\.ru|inbox\.ru|qq\.com|163\.com|126\.com|naver\.com|daum\.net|hanmail\.net|web\.de)$/i;
export const isFreeMail = (email) => FREE_MAIL.test(String(email || '').trim());

// ISO 3166-1 alpha-2 codes of countries and territories a buyer may ship to.
const COUNTRY_CODES = (
    'AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ ' +
    'CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR ' +
    'GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP ' +
    'KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS ' +
    'MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS ' +
    'RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ ' +
    'UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'
).split(' ');

/**
 * Country names in the page language, sorted, for the destination field's
 * suggestion list. Built in the browser only: Node's and the browser's
 * country names can differ, which would break hydration.
 */
export function countryNames(language) {
    try {
        const names = new Intl.DisplayNames([language], { type: 'region' });
        return COUNTRY_CODES.map((c) => names.of(c))
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, language));
    } catch {
        return [];
    }
}
