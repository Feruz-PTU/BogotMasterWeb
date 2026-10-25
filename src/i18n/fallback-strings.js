/**
 * Bundled defaults for the strings introduced in the SEO/prerender work.
 *
 * Why these are in the code as well as in the database:
 * the matching rows are added to Supabase by supabase/phase2-migration.sql.
 * If the site were deployed before that file is run, every one of these keys
 * would render as its raw name — real pages reading "Slice A —
 * seo_suffix_licorice" and a skip link labelled "skip_to_content".
 *
 * Bundling them removes that deployment-ordering trap entirely: the site is
 * correct the moment it ships, and the database values take precedence as
 * soon as they exist, so the owner can still edit any of this in the admin
 * panel afterwards.
 *
 * Keep this file in step with STEP 10 of the SQL migration.
 */

export const FALLBACK_STRINGS = {
    en: {
        skip_to_content: 'Skip to content',
        company_docs_title: 'Company Registration Documents',
        nav_main: 'Main navigation',
        nav_home_logo_alt: 'Bogot Master — home',
        nav_select_language: 'Select language',
        nav_open_menu: 'Open menu',
        nav_close_menu: 'Close menu',
        breadcrumb: 'Breadcrumb',

        // The menu and footer groups (content/navigation.js; folder 21).
        nav_applications: 'Applications',
        nav_applications_all: 'All applications',
        nav_quality: 'Quality',
        nav_logistics: 'Logistics',
        nav_resources: 'Resources',
        nav_company: 'Company',
        footer_nav_label: 'Site pages',
        footer_all_products: 'All products',
        footer_custom_order: 'Custom order',
        footer_request: 'Request a quote or sample',
        footer_quality_shipping: 'Quality and shipping',
        footer_company: 'Company',

        products_intro:
            'Wild licorice root (liquorice, Glycyrrhiza glabra) from Khorezm, Uzbekistan, in the cuts and grades below. Every grade is available in bulk; tell us the form and volume you need and we will quote it.',
        products_cta_title: 'Need a grade that is not listed?',
        products_cta_text:
            'We cut, grade and pack to order. Send us your specification and we will tell you what is possible.',
        // The catalogue's groups by form (utils/productGroups.js; folder 23).
        products_groups_nav: 'Product forms',
        products_group_slices: 'Slices',
        products_group_tablets: 'Tablets',
        products_group_granules: 'Granules, crushed root and powder',
        products_group_sticks: 'Sticks and fingers',
        products_group_industrial: 'Industrial and extraction grades',
        products_group_custom: 'Custom order',
        products_group_extract: 'Extract, made by our partner',
        products_group_other: 'Other products',

        about_mission_title: 'What we do and how we work',

        home_cta_title: 'Ready to Partner with Us?',
        home_cta_text:
            'Contact us today to receive a personalized commercial proposal.',

        form_name_error: 'Please enter your name',
        form_reply_time: 'We reply to every enquiry within 24 hours.',
        form_privacy_note:
            'We use your details only to answer your enquiry. See our',
        // Price form and quote cart: phone is optional, and the minimum order
        // is the owner's terms of 23 Oct 2026.
        form_optional: 'optional',
        form_phone_hint: 'Include the country code',
        form_moq_hint:
            'Minimum order: 1 t under FCA; under other terms, a full load (11 t in a 20 ft container, 22 t in a 40 ft container or truck).',

        // Licorice root product pages: free samples and trade terms (owner's
        // terms, 22–23 Oct 2026). The same for every product, so they live here
        // and not in each product's data.
        sample_title: 'Free samples',
        sample_text:
            '100–200 g of each grade, free of charge, for companies. Shipping is by FedEx at your cost, or on your own FedEx account; we send the sample after 3 business days. You are welcome to visit our facility before ordering: we help with the visa and hotel and meet you at the airport.',
        sample_btn: 'Request a free sample',
        sample_modal_title: 'Free sample request',
        sample_message: 'Free sample, 100–200 g',
        terms_title: 'Trade terms',
        terms_moq_label: 'Minimum order',
        terms_moq: '1 t under FCA; a full load under other terms',
        terms_loads_label: 'Loads',
        terms_loads: '11 t per 20 ft container; 22 t per 40 ft container or tent truck',
        terms_incoterms_label: 'Incoterms® 2020',
        terms_incoterms: 'EXW, FCA, CPT, CIP, DAP; FOB, CFR, CIF at a named seaport',
        terms_payment_label: 'Payment',
        terms_payment: 'T/T, L/C or D/P, in USD, EUR, UZS, CNY, GBP, CHF or RUB',
        terms_lead_time_label: 'Lead time',
        terms_lead_time: 'About 30 days for a 22 t load',
        terms_hs_label: 'HS code',
        terms_hs: '1211.90',
        // Link to /logistics: the trade-terms card and the footer.
        logistics_link: 'Shipping and Incoterms',
        // After the HS code in the trade-terms card: the guide's codes chapter.
        terms_hs_link: 'codes and import rules',
        // Under the description of some product pages (utils/productApplications.js).
        app_pharma_link: 'For pharmaceutical use',
        app_food_link: 'For food use',
        app_extraction_link: 'For extraction',

        // The request form (components/RequestForm.jsx), worded as in Appendix A
        // §A2 of the strategy audit, and the /request page that holds it.
        rf_type_label: 'What do you need?',
        rf_type_quote: 'Price quote',
        rf_type_sample: 'Free sample',
        rf_type_docs: 'Spec sheet and documents',
        rf_type_other: 'Other question',
        rf_required_note: 'Fields marked * are required.',
        rf_choose: 'Choose…',
        rf_products: 'Products',
        rf_products_hint_quote: 'Add every grade you want priced.',
        rf_products_hint_sample: 'Add every grade you want to try: 100–200 g of each.',
        rf_products_hint_docs: 'Add the grades you need documents for.',
        rf_products_add: 'Add a product…',
        rf_products_remove: 'Remove {product}',
        rf_quantity: 'Quantity',
        rf_quantity_hint:
            'Our minimum order is 1 t. A full truck or 40 ft container holds 22 t. Not sure yet? Leave the quantity blank.',
        rf_quantity_soft: 'Below our 1 t minimum order; we will still reply.',
        rf_annual: 'Expected annual volume',
        rf_annual_hint: 'Helps us offer contract pricing.',
        rf_application: 'What will you use it for?',
        rf_application_hint: 'So we send the right spec.',
        rf_app_confectionery: 'Confectionery',
        rf_app_beverages: 'Beverages and tea',
        rf_app_tobacco: 'Tobacco flavour',
        rf_app_extract: 'Extract production',
        rf_app_herbal: 'Herbal medicinal products',
        rf_app_supplements: 'Food supplements',
        rf_app_cosmetics: 'Cosmetics',
        rf_app_feed: 'Animal feed',
        rf_app_other: 'Other',
        rf_standard: 'Spec or pharmacopoeia',
        rf_standard_hint: "Choose 'My own spec' and we will ask for the file by email.",
        rf_std_ours: 'Our standard spec',
        rf_std_pheur: 'Ph. Eur.',
        rf_std_usp: 'USP',
        rf_std_ru: 'Russian pharmacopoeia',
        rf_std_kp: 'Korean pharmacopoeia',
        rf_std_own: 'My own spec',
        rf_country: 'Destination country',
        rf_port: 'Port or city',
        rf_incoterms: 'Delivery terms (Incoterms® 2020)',
        rf_incoterms_hint: 'Not sure? We will suggest the best option.',
        rf_incoterms_unsure: 'Not sure',
        rf_needed: 'When do you need it?',
        rf_needed_hint: 'A standard 22 t load takes about 30 days.',
        rf_needed_1m: 'Under 1 month',
        rf_needed_3m: '1–3 months',
        rf_needed_6m: '3–6 months',
        rf_needed_later: 'Over 6 months',
        rf_needed_research: 'Just researching',
        rf_name: 'Full name',
        rf_company: 'Company',
        rf_email: 'Work email',
        rf_email_soft: 'A company address speeds up sample approval.',
        rf_phone: 'Phone or WhatsApp',
        rf_phone_hint: 'Include the country code.',
        rf_channel: 'How should we reply?',
        rf_channel_whatsapp: 'WhatsApp',
        rf_channel_email: 'Email',
        rf_channel_telegram: 'Telegram',
        rf_channel_phone: 'Phone call',
        rf_sample_address: 'Where should we send the sample?',
        rf_sample_address_hint: 'Street, city, postcode, country.',
        rf_fedex: 'Your FedEx account',
        rf_message: 'Message',
        rf_message_hint: 'Anything else? Spec, packing, questions.',
        rf_submit_quote: 'Send quote request',
        rf_submit_sample: 'Request free sample',
        rf_submit_docs: 'Send me the documents',
        rf_submit_other: 'Send',
        rf_promise:
            'We reply within 24 hours. Free samples for companies: 100–200 g per grade; you pay FedEx shipping or use your own FedEx account. We use your details only to answer this request. See our',
        rf_or_message: 'Or message us directly:',
        rf_success_title: 'Request sent',
        rf_success_text: 'Thank you. We have your request and will reply within 24 hours.',
        rf_success_again: 'Send another request',
        // The success screen (folder 24): the reference, a copy of the request
        // and the next steps. {email} and {ref} are filled in.
        rf_success_ref: 'Your reference',
        rf_success_ref_hint: 'Mention it when you write to us about this request.',
        rf_success_confirm: 'A copy is on its way to {email}. Reply to it to add details or files.',
        rf_echo_title: 'What you sent',
        rf_echo_destination: 'Destination',
        rf_echo_incoterms: 'Delivery terms',
        rf_next_title: 'What happens next',
        rf_next_reply: 'We reply within 24 hours.',
        rf_next_quote:
            'Your quotation states the Incoterm and named place, how long the price is valid (7 days), payment terms (T/T, L/C or D/P), lead time and packing.',
        rf_next_sample_offer:
            'Want to test first? Free samples, 100–200 g per grade, are sent by FedEx after 3 business days of preparation.',
        rf_next_sample_ship:
            'Your free sample is sent by FedEx after 3 business days of preparation, at your cost or on your own FedEx account.',
        rf_next_docs: 'We send the specification and the documents you asked for.',
        rf_success_whatsapp: 'Message us on WhatsApp',
        rf_success_whatsapp_msg: 'Hello! About my request {ref}: ',
        // One error key per field, so no field can show another field's message.
        form_err_products: 'Please add at least one product.',
        form_err_sample_root: 'Free samples are for licorice root only; remove the extract.',
        form_err_amount: 'Enter a number above 0.',
        form_err_country: 'Please enter the destination country.',
        form_err_name: 'Please enter your name.',
        form_err_company: 'Please enter your company: free samples go to companies.',
        form_err_email: 'Please enter your email.',
        form_err_email_invalid: 'Please check the email address.',
        form_err_phone: 'Enter 7–20 digits, with the country code.',
        form_err_phone_needed: 'Add your phone number so we can reply this way.',
        form_err_sample_address: 'Please enter the delivery address.',
        request_meta_title: 'Request a Quote, Sample or Documents | Bogot Master',
        request_meta_desc:
            'Ask for a price, a free sample or the spec sheet and documents for wild licorice root from Khorezm, Uzbekistan. We reply within 24 hours.',
        request_h1: 'Send a request',
        // The quote list (QuoteCart.jsx) and the "Add to quote" button.
        quote_request_btn: 'Request a quote for these products',
        quote_request_note: 'You can add quantities and delivery details in the next step.',
        quote_added_toast: '{product} is in your quote list.',
        quote_sent_note: 'Sent as request {ref}. The list stays here until you clear it.',
        request_intro:
            'A price quote, a free sample, a spec sheet or any other question: choose what you need, and our sales representative will reply within 24 hours.',

        // Content pages (src/content/pages): the date line, a hub's list of
        // its pages, and the question box at the end of every page.
        content_updated: 'Updated',
        content_children_title: 'In this section',
        content_cta_title: 'Questions about this?',
        content_cta_text: 'Write to us and our sales representative will answer within 24 hours.',
        content_cta_btn: 'Ask a question',
        // The same box on a page that asks for a quote (registry requestType: 'quote').
        content_cta_quote_title: 'Ready for a quotation?',
        content_cta_quote_text: 'Send the product, the quantity and the destination. Our sales representative replies within 24 hours with a quotation valid for 7 days.',
        content_cta_quote_btn: 'Request a price quote',
        glossary_term_link: 'Link to this term',

        // The FAQ page (components/FaqList.jsx) and the links to it.
        faq_link: 'FAQ',
        faq_search_label: 'Search the answers',
        faq_search_placeholder: 'e.g. samples, Incoterms, HS code',
        faq_groups_label: 'Show one group',
        faq_chip_all: 'All',
        faq_chip_products: 'Products',
        faq_chip_quality: 'Quality',
        faq_chip_ordering: 'Ordering',
        faq_chip_shipping: 'Shipping',
        faq_chip_origin: 'Origin',
        faq_group_products: 'Products and grades',
        faq_group_quality: 'Quality, testing and storage',
        faq_group_ordering: 'Ordering and samples',
        faq_group_shipping: 'Shipping, documents and customs',
        faq_group_origin: 'Origin and the plant',
        // {n} is the number of answers shown; one form per plural case.
        faq_results_one: '{n} answer',
        faq_results_other: '{n} answers',
        faq_no_results: 'No answer matches “{q}”. Ask us: our sales representative replies within 24 hours.',
        faq_no_results_group: 'No answers in this group yet.',
        faq_ask_btn: 'Ask this question',
        faq_read_more: 'Read more:',
        faq_copy_link: 'Copy link',
        faq_link_copied: 'Link copied',
        faq_loading: 'Loading the answers…',
        faq_none: 'The answers are being written. Ask us anything in the meantime.',
        faq_cta_title: 'Did not find your question?',
        contact_faq_link: 'Common questions →',
        // Under the free-sample box: "More about samples: FAQ · How ordering works".
        sample_more: 'More about samples:',
        sample_guide_link: 'How ordering works',
        // Beside the specification heading on licorice root product pages.
        spec_guide_link: 'How to read this specification →',

        // The named sales contact and the legal details (owner, 22–23 Oct 2026).
        sales_contact_title: 'Your contact',
        sales_contact_name: 'Feruz, Sales Representative',
        sales_contact_languages: 'English, Russian, Uzbek',
        sales_contact_hours: 'Replies 07:00–24:00 (UTC+5), every day',
        legal_name_label: 'Legal name',
        legal_form_note: 'family enterprise',
        inn_label: 'INN (tax ID)',

        seo_suffix_licorice: 'Bulk Licorice Root Supplier | Bogot Master',
        seo_suffix_generic: 'Bulk Supply from Uzbekistan | Bogot Master',
        // Leads a licorice root product's meta description when its own
        // description does not name licorice (seo/productMeta.js).
        seo_meta_licorice_lead: 'Licorice (liquorice) root',

        a11y_close: 'Close',
        a11y_prev_image: 'Previous image',
        a11y_next_image: 'Next image',
        a11y_whatsapp: 'Contact us on WhatsApp',
        a11y_telegram: 'Contact us on Telegram',
        a11y_open_contact: 'Open contact menu',
        a11y_close_contact: 'Close contact menu',
        a11y_pdf_suffix: '(PDF, opens in a new tab)',

        quote_optional_title: 'Shipping details (optional)',
        quote_optional_hint:
            'Filling these in gets you an accurate quote first time. Leave them blank if you are not sure yet.',
        quote_destination_country: 'Destination country',
        quote_destination_port: 'Port or city',
        quote_incoterms: 'Incoterms',
        quote_incoterms_choose: 'Not sure / to discuss',
        quote_total_quantity: 'Total quantity',
        quote_unit: 'Unit',
        quote_timeline: 'Needed by',
        quote_timeline_placeholder: 'e.g. by the end of March',
        quote_incoterms_any: 'Any transport',
        quote_incoterms_sea: 'Sea (named seaport)',
        quote_unit_t: 't',
        quote_unit_kg: 'kg',
        quote_unit_20ft: '20 ft containers',
        quote_unit_40ft: '40 ft containers',
        quote_unit_truck: 'trucks',

        privacy_title: 'Privacy Policy',
        privacy_meta_title: 'Privacy Policy | Bogot Master',
        privacy_meta_desc:
            'How Bogot Master handles the information you send through this website: what is collected, where it is stored, and how to have it deleted.',
        privacy_draft_label: 'Draft.',
        privacy_draft_text:
            'This policy describes what the website actually does, but it has not yet been reviewed by a lawyer. Please check it before relying on it.',
        privacy_intro:
            'This page explains what happens to the information you send us through this website.',
        privacy_what_title: 'What we collect',
        privacy_what_text:
            'Only what you type into one of our forms: your name, email address, and where you provide them, your phone number, company name, product interest, quantity, destination and message. We also record which page the form was sent from, the language you were reading, and the website that referred you (the domain name only, never the full address).',
        privacy_why_title: 'Why we collect it',
        privacy_why_text:
            'To answer your enquiry and to prepare a quotation. We do not sell your details, and we do not use them for marketing unless you ask us to.',
        privacy_where_title: 'Where it is stored',
        privacy_where_text:
            'Enquiries are stored in a database hosted by Supabase. The website itself is hosted by Vercel, whose servers keep standard access logs. Both are third-party providers acting on our behalf.',
        privacy_email_title: 'Email',
        privacy_email_text:
            'When you send an enquiry we email it to ourselves and send you an automatic confirmation. Those emails are delivered by Resend. Your email address is used as the reply address so we can respond to you directly.',
        privacy_analytics_title: 'Analytics and cookies',
        privacy_analytics_text:
            'This website sets no cookies and uses no third-party analytics. We count page views and a small number of actions (for example, that a contact form was submitted) without storing any identifier for you, so these records cannot be connected to each other or to you. That is why you see no cookie banner.',
        privacy_retention_title: 'How long we keep it',
        privacy_retention_text:
            'Enquiries are kept for as long as we may need them for our business relationship with you. Ask us and we will delete yours.',
        privacy_rights_title: 'Your rights',
        privacy_rights_text:
            'You can ask us what we hold about you, ask us to correct it, or ask us to delete it. Write to the address below and we will respond.',
        privacy_contact_title: 'Contact',
        privacy_contact_text: 'For anything on this page, write to',

        // Articles. Strings shown in running text may use *italic* for
        // species names; the pages render them as inline Markdown.
        articles: 'Articles',
        articles_meta_title: 'Licorice Root: Facts and Articles | Bogot Master',
        articles_meta_desc:
            'What licorice root is, where it grows and how it is used, with in-depth articles on the plant and on licorice from Khorezm, Uzbekistan.',
        articles_title: 'About licorice root',
        articles_intro_1:
            'Licorice root is the dried root and underground stems of *Glycyrrhiza*, a perennial plant of the legume family. Three closely related species supply the trade: *G. glabra*, native from the Mediterranean to Central Asia, and *G. uralensis* and *G. inflata*, which grow further east, chiefly in northern China and Mongolia.',
        articles_intro_2:
            'The root tastes sweet because it contains glycyrrhizin, a compound about 50 times sweeter than sugar. The European Pharmacopoeia requires licorice root sold as a herbal drug to contain at least 4% of it. The root and its extract are used in confectionery, drinks, tobacco and herbal medicine.',
        articles_intro_3:
            'In Uzbekistan licorice grows wild along the Amu Darya and Syr Darya rivers, including in Khorezm, and it is also grown on plantations. The articles below look at the plant in more depth.',
        articles_list_title: 'All articles',
        article_read: 'Read',
        article_english_only: 'In English',
        article_back: 'All articles',
        article_loading: 'Loading the article…',
        // Shown at the top of a translated article, before a link to the
        // original. One string per language a translation can come from.
        article_translated_from_ru: 'This article is a translation from Russian. The original:',

        home_licorice_label: 'Licorice root',
        home_licorice_title: 'What is licorice root?',
        home_licorice_text:
            'Licorice root (spelled liquorice in British English and in EU texts) is the dried root of *Glycyrrhiza*, a perennial plant of the legume family. The species we supply, *G. glabra*, grows wild along the rivers of Central Asia, including the Amu Darya in Khorezm. Its sweetness comes from glycyrrhizin, about 50 times sweeter than sugar, and it is used in confectionery, drinks, tobacco and herbal medicine.',

        // Photo of the plant (components/PlantPhoto.jsx). A third-party photo
        // taken in Russia: do not caption it as our field or region.
        plant_photo_alt:
            'Tall stems with pinnate leaves and clusters of small pale violet flowers',
        plant_photo_caption: '*Glycyrrhiza glabra* in flower',
        plant_photo_credit: 'Photo: Yuriy Danilevsky',
    },

    ru: {
        skip_to_content: 'Перейти к содержанию',
        company_docs_title: 'Регистрационные документы компании',
        nav_main: 'Основная навигация',
        nav_home_logo_alt: 'Bogot Master — на главную',
        nav_select_language: 'Выбрать язык',
        nav_open_menu: 'Открыть меню',
        nav_close_menu: 'Закрыть меню',
        breadcrumb: 'Навигационная цепочка',

        nav_applications: 'Применение',
        nav_applications_all: 'Все направления',
        nav_quality: 'Качество',
        nav_logistics: 'Доставка',
        nav_resources: 'Материалы',
        nav_company: 'О компании',
        footer_nav_label: 'Страницы сайта',
        footer_all_products: 'Весь каталог',
        footer_custom_order: 'Индивидуальный заказ',
        footer_request: 'Запросить цену или образец',
        footer_quality_shipping: 'Качество и доставка',
        footer_company: 'Компания',

        products_intro:
            'Дикорастущий корень солодки (Glycyrrhiza glabra) из Хорезма, Узбекистан, в указанных ниже формах и фракциях. Все позиции доступны оптом — сообщите нужную форму и объём, и мы подготовим предложение.',
        products_cta_title: 'Нужна позиция, которой нет в списке?',
        products_cta_text:
            'Мы режем, калибруем и упаковываем под заказ. Пришлите вашу спецификацию, и мы скажем, что возможно.',
        products_groups_nav: 'Формы продукции',
        products_group_slices: 'Слайсы',
        products_group_tablets: 'Таблетки',
        products_group_granules: 'Гранулы, измельчённый корень и порошок',
        products_group_sticks: 'Палочки и бочонок',
        products_group_industrial: 'Сорта для промышленности и экстракции',
        products_group_custom: 'Индивидуальный заказ',
        products_group_extract: 'Экстракт производства нашего партнёра',
        products_group_other: 'Другая продукция',

        about_mission_title: 'Чем мы занимаемся и как работаем',

        home_cta_title: 'Готовы начать сотрудничество?',
        home_cta_text:
            'Свяжитесь с нами сегодня, чтобы получить индивидуальное коммерческое предложение.',

        form_name_error: 'Пожалуйста, укажите ваше имя',
        form_reply_time: 'Мы отвечаем на каждый запрос в течение 24 часов.',
        form_privacy_note:
            'Мы используем ваши данные только для ответа на запрос. См.',
        form_optional: 'необязательно',
        form_phone_hint: 'С кодом страны',
        form_moq_hint:
            'Минимальный заказ: 1 т на условиях FCA; на других условиях — полная загрузка (11 т — 20-футовый контейнер, 22 т — 40-футовый контейнер или фура).',

        sample_title: 'Бесплатные образцы',
        sample_text:
            '100–200 г каждой позиции бесплатно, для компаний. Доставка FedEx за ваш счёт или через ваш аккаунт FedEx; отправляем образец через 3 рабочих дня. Приглашаем посетить производство до заказа: поможем с визой и гостиницей, встретим в аэропорту.',
        sample_btn: 'Запросить образец',
        sample_modal_title: 'Запрос образца',
        sample_message: 'Бесплатный образец, 100–200 г',
        terms_title: 'Условия поставки',
        terms_moq_label: 'Минимальный заказ',
        terms_moq: '1 т на условиях FCA; на других условиях — полная загрузка',
        terms_loads_label: 'Загрузка',
        terms_loads: '11 т — 20-футовый контейнер; 22 т — 40-футовый контейнер или тентованная фура',
        terms_incoterms_label: 'Incoterms® 2020',
        terms_incoterms: 'EXW, FCA, CPT, CIP, DAP; FOB, CFR, CIF — до указанного морского порта',
        terms_payment_label: 'Оплата',
        terms_payment: 'T/T, аккредитив (L/C) или D/P; USD, EUR, UZS, CNY, GBP, CHF, RUB',
        terms_lead_time_label: 'Срок выполнения заказа',
        terms_lead_time: 'Около 30 дней для партии 22 т',
        terms_hs_label: 'Код ТН ВЭД',
        terms_hs: '1211 90 860 1 (ТН ВЭД ЕАЭС); 1211.90 (HS)',
        logistics_link: 'Доставка и Incoterms',
        terms_hs_link: 'коды и правила импорта',
        app_pharma_link: 'Для фармацевтического производства',
        app_food_link: 'Для пищевой промышленности',
        app_extraction_link: 'Для экстракции',

        rf_type_label: 'Что вам нужно?',
        rf_type_quote: 'Коммерческое предложение',
        rf_type_sample: 'Бесплатный образец',
        rf_type_docs: 'Спецификация и документы',
        rf_type_other: 'Другой вопрос',
        rf_required_note: 'Поля, отмеченные *, обязательны.',
        rf_choose: 'Выберите…',
        rf_products: 'Продукция',
        rf_products_hint_quote: 'Добавьте все позиции для расчёта.',
        rf_products_hint_sample: 'Добавьте позиции, которые хотите попробовать: по 100–200 г каждой.',
        rf_products_hint_docs: 'Добавьте позиции, по которым нужны документы.',
        rf_products_add: 'Добавить позицию…',
        rf_products_remove: 'Убрать: {product}',
        rf_quantity: 'Количество',
        rf_quantity_hint:
            'Минимальный заказ — 1 т. Фура или 40-футовый контейнер — 22 т. Пока не знаете — оставьте количество пустым.',
        rf_quantity_soft: 'Меньше минимального заказа в 1 т; мы всё равно ответим.',
        rf_annual: 'Ожидаемый объём в год',
        rf_annual_hint: 'Поможет предложить контрактную цену.',
        rf_application: 'Для чего вы будете использовать?',
        rf_application_hint: 'Чтобы прислать нужную спецификацию.',
        rf_app_confectionery: 'Кондитерские изделия',
        rf_app_beverages: 'Напитки и чай',
        rf_app_tobacco: 'Ароматизация табака',
        rf_app_extract: 'Производство экстракта',
        rf_app_herbal: 'Растительные лекарственные средства',
        rf_app_supplements: 'Биологически активные добавки',
        rf_app_cosmetics: 'Косметика',
        rf_app_feed: 'Корма для животных',
        rf_app_other: 'Другое',
        rf_standard: 'Спецификация или фармакопея',
        rf_standard_hint: 'Выберите «Своя спецификация» — файл запросим по почте.',
        rf_std_ours: 'Наша стандартная спецификация',
        rf_std_pheur: 'Европейская фармакопея (Ph. Eur.)',
        rf_std_usp: 'Фармакопея США (USP)',
        rf_std_ru: 'Государственная фармакопея РФ',
        rf_std_kp: 'Корейская фармакопея',
        rf_std_own: 'Своя спецификация',
        rf_country: 'Страна назначения',
        rf_port: 'Порт или город',
        rf_incoterms: 'Условия поставки (Incoterms® 2020)',
        rf_incoterms_hint: 'Не уверены? Мы предложим вариант.',
        rf_incoterms_unsure: 'Пока не знаю',
        rf_needed: 'Когда нужна поставка?',
        rf_needed_hint: 'Стандартная партия 22 т — около 30 дней.',
        rf_needed_1m: 'Менее 1 месяца',
        rf_needed_3m: '1–3 месяца',
        rf_needed_6m: '3–6 месяцев',
        rf_needed_later: 'Более 6 месяцев',
        rf_needed_research: 'Пока изучаю рынок',
        rf_name: 'Имя и фамилия',
        rf_company: 'Компания',
        rf_email: 'Рабочий e-mail',
        rf_email_soft: 'Корпоративный адрес ускорит отправку образца.',
        rf_phone: 'Телефон или WhatsApp',
        rf_phone_hint: 'С кодом страны.',
        rf_channel: 'Как с вами связаться?',
        rf_channel_whatsapp: 'WhatsApp',
        rf_channel_email: 'E-mail',
        rf_channel_telegram: 'Telegram',
        rf_channel_phone: 'Звонок',
        rf_sample_address: 'Куда отправить образец?',
        rf_sample_address_hint: 'Улица, город, индекс, страна.',
        rf_fedex: 'Ваш аккаунт FedEx',
        rf_message: 'Сообщение',
        rf_message_hint: 'Что-то ещё? Спецификация, упаковка, вопросы.',
        rf_submit_quote: 'Отправить запрос',
        rf_submit_sample: 'Запросить образец',
        rf_submit_docs: 'Прислать документы',
        rf_submit_other: 'Отправить',
        rf_promise:
            'Отвечаем в течение 24 часов. Бесплатные образцы для компаний: 100–200 г каждой позиции; доставка FedEx за ваш счёт или через ваш аккаунт FedEx. Данные используем только для ответа на запрос. См.',
        rf_or_message: 'Или напишите нам напрямую:',
        rf_success_title: 'Запрос отправлен',
        rf_success_text: 'Спасибо! Мы получили ваш запрос и ответим в течение 24 часов.',
        rf_success_again: 'Отправить ещё один запрос',
        rf_success_ref: 'Номер запроса',
        rf_success_ref_hint: 'Укажите его, когда будете писать нам об этом запросе.',
        rf_success_confirm: 'Копия запроса отправлена на {email}. Ответьте на это письмо, чтобы добавить детали или файлы.',
        rf_echo_title: 'Что вы отправили',
        rf_echo_destination: 'Пункт назначения',
        rf_echo_incoterms: 'Условия поставки',
        rf_next_title: 'Что дальше',
        rf_next_reply: 'Мы ответим в течение 24 часов.',
        rf_next_quote:
            'В коммерческом предложении будут базис поставки Incoterms с названным местом, срок действия цены (7 дней), условия оплаты (T/T, аккредитив или D/P), срок поставки и упаковка.',
        rf_next_sample_offer:
            'Хотите сначала проверить качество? Бесплатные образцы, 100–200 г каждой позиции, отправляем FedEx через 3 рабочих дня подготовки.',
        rf_next_sample_ship:
            'Бесплатный образец отправим FedEx через 3 рабочих дня подготовки — доставка за ваш счёт или через ваш аккаунт FedEx.',
        rf_next_docs: 'Мы пришлём спецификацию и запрошенные документы.',
        rf_success_whatsapp: 'Написать в WhatsApp',
        rf_success_whatsapp_msg: 'Здравствуйте! По моему запросу {ref}: ',
        form_err_products: 'Добавьте хотя бы одну позицию.',
        form_err_sample_root: 'Бесплатные образцы — только корня солодки; уберите экстракт.',
        form_err_amount: 'Введите число больше 0.',
        form_err_country: 'Пожалуйста, укажите страну назначения.',
        form_err_name: 'Пожалуйста, укажите имя.',
        form_err_company: 'Укажите компанию: бесплатные образцы отправляем компаниям.',
        form_err_email: 'Пожалуйста, укажите e-mail.',
        form_err_email_invalid: 'Проверьте адрес e-mail.',
        form_err_phone: 'Введите от 7 до 20 цифр, с кодом страны.',
        form_err_phone_needed: 'Укажите телефон, чтобы мы могли ответить этим способом.',
        form_err_sample_address: 'Пожалуйста, укажите адрес доставки.',
        request_meta_title: 'Запрос цены, образца или документов | Bogot Master',
        request_meta_desc:
            'Запросите цену, бесплатный образец или спецификацию и документы на корень дикорастущей солодки из Хорезма (Узбекистан). Ответим в течение 24 часов.',
        request_h1: 'Отправить запрос',
        quote_request_btn: 'Запросить цену на эти позиции',
        quote_request_note: 'Количество и условия поставки можно указать на следующем шаге.',
        quote_added_toast: '{product} — в списке для запроса.',
        quote_sent_note: 'Отправлено, номер запроса {ref}. Список останется здесь, пока вы его не очистите.',
        request_intro:
            'Коммерческое предложение, бесплатный образец, спецификация или другой вопрос: выберите, что вам нужно, и наш менеджер по продажам ответит в течение 24 часов.',

        content_updated: 'Обновлено',
        content_children_title: 'В этом разделе',
        content_cta_title: 'Остались вопросы?',
        content_cta_text: 'Напишите нам, и наш менеджер по продажам ответит в течение 24 часов.',
        content_cta_btn: 'Задать вопрос',
        content_cta_quote_title: 'Готовы запросить предложение?',
        content_cta_quote_text: 'Пришлите продукт, количество и место назначения. Менеджер по продажам ответит в течение 24 часов коммерческим предложением, действующим 7 дней.',
        content_cta_quote_btn: 'Запросить коммерческое предложение',
        glossary_term_link: 'Ссылка на этот термин',

        faq_link: 'Вопросы и ответы',
        faq_search_label: 'Поиск по ответам',
        faq_search_placeholder: 'например: образцы, Incoterms, ТН ВЭД',
        faq_groups_label: 'Показать одну группу',
        faq_chip_all: 'Все',
        faq_chip_products: 'Продукция',
        faq_chip_quality: 'Качество',
        faq_chip_ordering: 'Заказ',
        faq_chip_shipping: 'Доставка',
        faq_chip_origin: 'Происхождение',
        faq_group_products: 'Продукция и фракции',
        faq_group_quality: 'Качество, анализы и хранение',
        faq_group_ordering: 'Заказ и образцы',
        faq_group_shipping: 'Доставка, документы и таможня',
        faq_group_origin: 'Происхождение и растение',
        faq_results_one: '{n} ответ',
        faq_results_few: '{n} ответа',
        faq_results_many: '{n} ответов',
        faq_results_other: '{n} ответа',
        faq_no_results: 'Нет ответа на «{q}». Спросите нас: менеджер по продажам ответит в течение 24 часов.',
        faq_no_results_group: 'В этой группе пока нет ответов.',
        faq_ask_btn: 'Задать этот вопрос',
        faq_read_more: 'Подробнее:',
        faq_copy_link: 'Копировать ссылку',
        faq_link_copied: 'Ссылка скопирована',
        faq_loading: 'Загружаем ответы…',
        faq_none: 'Ответы готовятся. А пока задайте нам любой вопрос.',
        faq_cta_title: 'Не нашли свой вопрос?',
        contact_faq_link: 'Частые вопросы →',
        sample_more: 'Подробнее об образцах:',
        sample_guide_link: 'Как устроен заказ',
        spec_guide_link: 'Как читать эту спецификацию →',

        sales_contact_title: 'Ваш контакт',
        sales_contact_name: 'Феруз, менеджер по продажам',
        sales_contact_languages: 'Английский, русский, узбекский',
        sales_contact_hours: 'Отвечает с 07:00 до 24:00 (UTC+5), ежедневно',
        legal_name_label: 'Юридическое название',
        legal_form_note: 'семейное предприятие',
        inn_label: 'ИНН',

        seo_suffix_licorice: 'Оптовый поставщик корня солодки | Bogot Master',
        seo_suffix_generic: 'Оптовые поставки из Узбекистана | Bogot Master',
        seo_meta_licorice_lead: 'Корень солодки',

        a11y_close: 'Закрыть',
        a11y_prev_image: 'Предыдущее изображение',
        a11y_next_image: 'Следующее изображение',
        a11y_whatsapp: 'Написать нам в WhatsApp',
        a11y_telegram: 'Написать нам в Telegram',
        a11y_open_contact: 'Открыть меню контактов',
        a11y_close_contact: 'Закрыть меню контактов',
        a11y_pdf_suffix: '(PDF, откроется в новой вкладке)',

        quote_optional_title: 'Детали поставки (необязательно)',
        quote_optional_hint:
            'Если заполните эти поля, мы сразу подготовим точное предложение. Можно оставить пустыми.',
        quote_destination_country: 'Страна назначения',
        quote_destination_port: 'Порт или город',
        quote_incoterms: 'Условия поставки (Incoterms)',
        quote_incoterms_choose: 'Не знаю / обсудим',
        quote_total_quantity: 'Общий объём',
        quote_unit: 'Единица',
        quote_timeline: 'Срок поставки',
        quote_timeline_placeholder: 'например, до конца марта',
        quote_incoterms_any: 'Любой вид транспорта',
        quote_incoterms_sea: 'Море (порт назначения)',
        quote_unit_t: 'т',
        quote_unit_kg: 'кг',
        quote_unit_20ft: 'контейнеры 20 фут',
        quote_unit_40ft: 'контейнеры 40 фут',
        quote_unit_truck: 'фуры',

        privacy_title: 'Политика конфиденциальности',
        privacy_meta_title: 'Политика конфиденциальности | Bogot Master',
        privacy_meta_desc:
            'Как Bogot Master обращается с данными, которые вы отправляете через этот сайт: что собирается, где хранится и как это удалить.',
        privacy_draft_label: 'Черновик.',
        privacy_draft_text:
            'Эта политика описывает, что сайт действительно делает, но она ещё не проверена юристом. Пожалуйста, проверьте её перед использованием.',
        privacy_intro:
            'На этой странице объясняется, что происходит с данными, которые вы отправляете нам через сайт.',
        privacy_what_title: 'Какие данные мы собираем',
        privacy_what_text:
            'Только то, что вы вводите в наши формы: имя, адрес электронной почты, а также — если вы их указали — телефон, название компании, интересующий товар, объём, направление поставки и сообщение. Мы также фиксируем, с какой страницы отправлена форма, на каком языке вы читали сайт и с какого сайта вы к нам пришли (только доменное имя, никогда полный адрес).',
        privacy_why_title: 'Зачем они нам',
        privacy_why_text:
            'Чтобы ответить на ваш запрос и подготовить коммерческое предложение. Мы не продаём ваши данные и не используем их для рассылок без вашей просьбы.',
        privacy_where_title: 'Где они хранятся',
        privacy_where_text:
            'Запросы хранятся в базе данных на сервисе Supabase. Сам сайт размещён на Vercel, чьи серверы ведут обычные журналы доступа. Оба — сторонние поставщики услуг, действующие по нашему поручению.',
        privacy_email_title: 'Электронная почта',
        privacy_email_text:
            'Когда вы отправляете запрос, мы пересылаем его себе на почту и отправляем вам автоматическое подтверждение. Эти письма доставляет сервис Resend. Ваш адрес используется как адрес для ответа, чтобы мы могли написать вам напрямую.',
        privacy_analytics_title: 'Аналитика и cookie',
        privacy_analytics_text:
            'Этот сайт не использует cookie и не использует сторонние системы аналитики. Мы считаем просмотры страниц и несколько действий (например, что форма была отправлена), не сохраняя никакого вашего идентификатора, поэтому эти записи нельзя связать между собой или с вами. Именно поэтому на сайте нет баннера о cookie.',
        privacy_retention_title: 'Сколько мы их храним',
        privacy_retention_text:
            'Запросы хранятся столько, сколько они могут понадобиться для наших деловых отношений с вами. Напишите нам, и мы удалим ваши данные.',
        privacy_rights_title: 'Ваши права',
        privacy_rights_text:
            'Вы можете запросить, какие данные о вас у нас есть, попросить их исправить или удалить. Напишите на адрес ниже, и мы ответим.',
        privacy_contact_title: 'Контакты',
        privacy_contact_text: 'По любым вопросам с этой страницы пишите на',

        articles: 'Статьи',
        articles_meta_title: 'Корень солодки: факты и статьи | Bogot Master',
        articles_meta_desc:
            'Что такое корень солодки, где он растёт и как используется, а также подробные статьи о растении и о солодке из Хорезма, Узбекистан.',
        articles_title: 'О корне солодки',
        articles_intro_1:
            'Корень солодки — это высушенные корни и подземные побеги *Glycyrrhiza*, многолетнего растения семейства бобовых. В торговлю поступают три близких вида: *G. glabra* (солодка голая), естественный ареал которой простирается от Средиземноморья до Средней Азии, а также *G. uralensis* (солодка уральская) и *G. inflata* (солодка вздутая), которые растут восточнее, главным образом на севере Китая и в Монголии.',
        articles_intro_2:
            'Корень сладкий на вкус благодаря глицирризину — веществу, которое примерно в 50 раз слаще сахара. Европейская фармакопея требует, чтобы корень солодки как лекарственное растительное сырьё содержал его не менее 4%. Корень и его экстракт используют в кондитерском производстве, напитках, табачной промышленности и фитотерапии.',
        articles_intro_3:
            'В Узбекистане солодка растёт в дикой природе по берегам Амударьи и Сырдарьи, в том числе в Хорезме, а также выращивается на плантациях. В статьях ниже растение рассмотрено подробнее.',
        articles_list_title: 'Все статьи',
        article_read: 'Читать',
        article_english_only: 'На английском',
        article_back: 'Все статьи',
        article_loading: 'Загрузка статьи…',
        article_translated_from_en: 'Эта статья — перевод с английского языка. Оригинал:',

        home_licorice_label: 'Корень солодки',
        home_licorice_title: 'Что такое корень солодки?',
        home_licorice_text:
            'Корень солодки, или солодковый корень, — это высушенный корень *Glycyrrhiza*, многолетнего растения семейства бобовых. Вид, который мы поставляем, — *G. glabra* (солодка голая); он растёт в дикой природе по берегам рек Средней Азии, в том числе Амударьи в Хорезме. Сладость корню придаёт глицирризин, который примерно в 50 раз слаще сахара. Корень используют в кондитерском производстве, напитках, табачной промышленности и фитотерапии.',

        plant_photo_alt:
            'Высокие стебли с перистыми листьями и кистями мелких бледно-фиолетовых цветков',
        plant_photo_caption: 'Солодка голая (*Glycyrrhiza glabra*) в цвету',
        plant_photo_credit: 'Фото: Юрий Данилевский',
    },
};
