/**
 * Website Configuration
 * 
 * use this file to update the content of the website
 * 
 * 1. EmailJS Configuration:
 *    To change where emails are sent, you need to update these values.
 *    - Sign up/Login to https://dashboard.emailjs.com/
 *    - Service ID: Found in the "Email Services" tab
 *    - Template IDs: Found in the "Email Templates" tab
 *    - Public Key: Found in the "Account" (or "Integration") settings
 * 
 * 2. Contact Information:
 *    Update the details below to change what is displayed on the website.
 */

export const EMAILJS_CONFIG = {
    serviceId: 'service_c1bng4d',
    contactTemplateId: 'template_ad477gp',
    priceTemplateId: 'template_2p6utf9',
    publicKey: 'nMDfGjw5mSsW-3-QT'
};


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
    name: 'Feruz', // or Glabra, checking footer/logo
    // Add more if needed
};
