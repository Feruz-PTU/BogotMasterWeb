// The Incoterms 2020 rules Bogot Master ships under (owner, 22 Oct 2026),
// grouped as the ICC groups them. Uzbekistan is landlocked, so a sea term
// always names a foreign seaport.
export const INCOTERMS_ANY = ['EXW', 'FCA', 'CPT', 'CIP', 'DAP'];
export const INCOTERMS_SEA = ['FOB', 'CFR', 'CIF'];

// The official rule names; the Russian ones are those of the ICC's Russian edition.
const NAMES = {
    en: {
        EXW: 'Ex Works',
        FCA: 'Free Carrier',
        CPT: 'Carriage Paid To',
        CIP: 'Carriage and Insurance Paid To',
        DAP: 'Delivered at Place',
        FOB: 'Free on Board',
        CFR: 'Cost and Freight',
        CIF: 'Cost, Insurance and Freight',
    },
    ru: {
        EXW: 'Франко завод',
        FCA: 'Франко перевозчик',
        CPT: 'Перевозка оплачена до',
        CIP: 'Перевозка и страхование оплачены до',
        DAP: 'Поставка в месте назначения',
        FOB: 'Свободно на борту',
        CFR: 'Стоимость и фрахт',
        CIF: 'Стоимость, страхование и фрахт',
    },
};

export const incotermLabel = (code, language) =>
    `${code} — ${(NAMES[language] || NAMES.en)[code]}`;

// Units for the quote cart's total quantity. The value is what the email shows;
// the label is a translation key.
export const QUANTITY_UNITS = [
    { value: 't', label: 'quote_unit_t' },
    { value: 'kg', label: 'quote_unit_kg' },
    { value: '20 ft container', label: 'quote_unit_20ft' },
    { value: '40 ft container', label: 'quote_unit_40ft' },
    { value: 'truck', label: 'quote_unit_truck' },
];
