/**
 * Website Configuration
 *
 * Use this file to update the contact details shown on the website.
 * Email sending is handled server-side by the /api/send function (Resend) —
 * see DEPLOY.md and api/send.js. No email keys live here.
 */

export const CONTACT_INFO = {
    email: 'bogotmaster@gmail.com',
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
        whatsapp: '998995129826', // Phone number for WhatsApp (no + or spaces)
        telegram: 'e_f_r_u_z_0_0_2_6'   // Telegram username (without @)
    }
};

export const COMPANY_INFO = {
    name: 'Bogot Master',
};
