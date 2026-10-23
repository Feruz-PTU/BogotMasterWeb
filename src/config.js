/**
 * Website Configuration
 *
 * Use this file to update the contact details shown on the website.
 * Email sending is handled server-side by the /api/send function (Resend) —
 * see DEPLOY.md and api/send.js. No email keys live here.
 */

export const CONTACT_INFO = {
    email: 'info@bogotmaster.org',        // Legal, privacy and general questions
    sales_email: 'feruz@bogotmaster.org', // B2B trade enquiries
    phone: [
        '+998 97 712 98 26',
        '+998 99 512 98 26'
    ],
    address: '220204, Боготский район, Хорезмская область, Республика Узбекистан',
    address_lines: [
        '220204, Боготский район,',
        'Хорезмская область, Республика Узбекистан.'
    ],
    website: 'https://bogotmaster.org',
    website_display: 'bogotmaster.org',
    social: {
        // The sales rep is moving both to business accounts (owner, 23 Oct
        // 2026). WhatsApp Business keeps the number; update the Telegram
        // username here once the new account exists.
        whatsapp: '998995129826', // Phone number for WhatsApp (no + or spaces)
        telegram: 'e_f_r_u_z_0_0_2_6'   // Telegram username (without @)
    },
    // The person who answers trade enquiries. The page text (name, title,
    // languages, hours) is in the translations: sales_contact_*.
    sales_contact: {
        name: 'Feruz',
        languages: ['en', 'ru', 'uz'],
        // Every day, 07:00 to midnight, Uzbekistan time.
        hours: { opens: '07:00:00+05:00', closes: '23:59:59+05:00' },
    },
    // Exactly as on the tax registration certificate (Tax Committee, printed
    // 24 Jan 2026): the backtick is theirs. The 2014 state registration
    // certificate writes BOG'OT; the registry's stray space before the
    // closing quote is left out. "Oilaviy korxona" = family enterprise.
    legal_name: '"BOG`OT MASTER" OILAVIY KORXONA',
    inn: '303047792',
    inn_display: '303 047 792',
};

export const COMPANY_INFO = {
    name: 'Bogot Master',
};
