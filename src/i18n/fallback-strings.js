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

        products_intro:
            'Licorice root (Glycyrrhiza glabra) from Khorezm, Uzbekistan, in the cuts and grades below. Every grade is available in bulk; tell us the form and volume you need and we will quote it.',
        products_cta_title: 'Need a grade that is not listed?',
        products_cta_text:
            'We cut, grade and pack to order. Send us your specification and we will tell you what is possible.',

        about_mission_title: 'What we do and how we work',

        home_cta_title: 'Ready to Partner with Us?',
        home_cta_text:
            'Contact us today to receive a personalized commercial proposal.',

        form_name_error: 'Please enter your name',
        form_reply_time: 'We reply to every enquiry within 24 hours.',
        form_privacy_note:
            'We use your details only to answer your enquiry. See our',

        seo_suffix_licorice: 'Bulk Licorice Root Supplier | Bogot Master',
        seo_suffix_generic: 'Bulk Supply from Uzbekistan | Bogot Master',

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

        products_intro:
            'Корень солодки (Glycyrrhiza glabra) из Хорезма, Узбекистан, в указанных ниже формах и фракциях. Все позиции доступны оптом — сообщите нужную форму и объём, и мы подготовим предложение.',
        products_cta_title: 'Нужна позиция, которой нет в списке?',
        products_cta_text:
            'Мы режем, калибруем и упаковываем под заказ. Пришлите вашу спецификацию, и мы скажем, что возможно.',

        about_mission_title: 'Чем мы занимаемся и как работаем',

        home_cta_title: 'Готовы начать сотрудничество?',
        home_cta_text:
            'Свяжитесь с нами сегодня, чтобы получить индивидуальное коммерческое предложение.',

        form_name_error: 'Пожалуйста, укажите ваше имя',
        form_reply_time: 'Мы отвечаем на каждый запрос в течение 24 часов.',
        form_privacy_note:
            'Мы используем ваши данные только для ответа на запрос. См.',

        seo_suffix_licorice: 'Оптовый поставщик корня солодки | Bogot Master',
        seo_suffix_generic: 'Оптовые поставки из Узбекистана | Bogot Master',

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
    },
};
