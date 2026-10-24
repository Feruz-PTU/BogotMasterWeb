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

        // Content pages (src/content/pages): the date line, a hub's list of
        // its pages, and the question box at the end of every page.
        content_updated: 'Updated',
        content_children_title: 'In this section',
        content_cta_title: 'Questions about this?',
        content_cta_text: 'Write to us and our sales representative will answer within 24 hours.',
        content_cta_btn: 'Ask a question',
        glossary_term_link: 'Link to this term',

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
            'Licorice root is the dried root of *Glycyrrhiza*, a perennial plant of the legume family. The species we supply, *G. glabra*, grows wild along the rivers of Central Asia, including the Amu Darya in Khorezm. Its sweetness comes from glycyrrhizin, about 50 times sweeter than sugar, and it is used in confectionery, drinks, tobacco and herbal medicine.',

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

        content_updated: 'Обновлено',
        content_children_title: 'В этом разделе',
        content_cta_title: 'Остались вопросы?',
        content_cta_text: 'Напишите нам, и наш менеджер по продажам ответит в течение 24 часов.',
        content_cta_btn: 'Задать вопрос',
        glossary_term_link: 'Ссылка на этот термин',

        sales_contact_title: 'Ваш контакт',
        sales_contact_name: 'Феруз, менеджер по продажам',
        sales_contact_languages: 'Английский, русский, узбекский',
        sales_contact_hours: 'Отвечает с 07:00 до 24:00 (UTC+5), ежедневно',
        legal_name_label: 'Юридическое название',
        legal_form_note: 'семейное предприятие',
        inn_label: 'ИНН',

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
            'Корень солодки — это высушенный корень *Glycyrrhiza*, многолетнего растения семейства бобовых. Вид, который мы поставляем, — *G. glabra* (солодка голая); он растёт в дикой природе по берегам рек Средней Азии, в том числе Амударьи в Хорезме. Сладость корню придаёт глицирризин, который примерно в 50 раз слаще сахара. Корень используют в кондитерском производстве, напитках, табачной промышленности и фитотерапии.',

        plant_photo_alt:
            'Высокие стебли с перистыми листьями и кистями мелких бледно-фиолетовых цветков',
        plant_photo_caption: 'Солодка голая (*Glycyrrhiza glabra*) в цвету',
        plant_photo_credit: 'Фото: Юрий Данилевский',
    },
};
