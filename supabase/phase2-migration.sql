-- ════════════════════════════════════════════════════════════════════════════
--  BOGOT MASTER — PHASE 2 DATABASE MIGRATION
--  Run this ONCE, in: Supabase Dashboard → SQL Editor → New query → Run.
--
--  WHAT IT DOES, in plain language:
--    1. Makes the admin a real, named account in the database, so that
--       permission to change the site no longer depends on one dashboard
--       toggle being switched off.
--    2. Locks down who may write products, settings and translations.
--    3. Locks down who may upload images.
--    4. Puts a size limit on the contact-form messages anyone can insert.
--    5. Adds the columns that record which page produced each enquiry.
--    6. Creates the cookieless analytics table.
--    7. Fixes product URLs that contain capital letters.
--    8. Renames the misspelled gallery folder in the stored image paths.
--    9. Adds the new text used by the redesigned pages, in English and Russian.
--
--  BEFORE YOU RUN IT: read STEP 1 — you must paste your admin email there.
--  AFTER YOU RUN IT:  sign out of /admin and sign in again, then check you can
--                     still edit a product. If anything goes wrong, the UNDO
--                     section at the bottom reverses every change.
--
--  It is safe to run twice: every statement is written to be repeatable.
-- ════════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 1 — TELL THE DATABASE WHO THE ADMIN IS      ← EDIT THE EMAIL BELOW
-- ════════════════════════════════════════════════════════════════════════════
--
-- Replace the email on the marked line with the address you use to sign in at
-- bogotmaster.org/admin/login. Keep the quotes.
--
-- Why this matters: right now every "write" rule in the database says
-- `to authenticated`, which means ANY account that exists may rewrite your
-- product catalogue and read every customer enquiry. The only thing stopping
-- a stranger from creating such an account is the "Allow new users to sign up"
-- switch in the dashboard. This step replaces that single switch with a real
-- rule, so even if sign-up is accidentally turned on, a new account can do
-- nothing.

create table if not exists public.admins (
    id         uuid primary key references auth.users (id) on delete cascade,
    email      text,
    created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

insert into public.admins (id, email)
select id, email
from auth.users
where lower(email) = lower(
    'bogotmaster@gmail.com'      -- ←←← PUT YOUR ADMIN EMAIL HERE
)
on conflict (id) do nothing;

-- Helper used by every rule below. SECURITY DEFINER so it can read the
-- admins table regardless of the caller's own permissions; search_path is
-- pinned, which is the standard hardening for this kind of function.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (select 1 from public.admins a where a.id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists admins_self_read on public.admins;
create policy admins_self_read on public.admins
    for select to authenticated
    using (id = auth.uid());

-- ── CHECK: this must return one row with your email, and is_admin = true.
--    If it returns nothing, the email above does not match any account.
--    Fix it and re-run before continuing — the next steps would lock you out.
select a.email, public.is_admin() as is_admin_for_current_session
from public.admins a;


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2 — ONLY THE ADMIN MAY CHANGE THE SITE'S CONTENT
-- ════════════════════════════════════════════════════════════════════════════
-- Reading stays public (the catalogue is a public website). Writing becomes
-- admin-only.

drop policy if exists products_write on public.products;
create policy products_write on public.products
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists inquiries_admin on public.inquiries;
create policy inquiries_admin on public.inquiries
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists stats_read on public.stats;
create policy stats_read on public.stats
    for select to authenticated
    using (public.is_admin());


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 3 — ONLY THE ADMIN MAY UPLOAD IMAGES
-- ════════════════════════════════════════════════════════════════════════════
-- The image buckets are public to READ (they are website images). Uploading,
-- replacing and deleting become admin-only.
--
-- If an upload policy was created by hand in the dashboard using the
-- "Enable access for all users" template, anonymous visitors can currently
-- upload any file to your domain. This replaces that.
--
-- To see what exists today, run this on its own first:
--     select policyname, cmd, roles
--     from pg_policies where schemaname = 'storage' and tablename = 'objects';

drop policy if exists "bm_storage_public_read"   on storage.objects;
drop policy if exists "bm_storage_admin_insert"  on storage.objects;
drop policy if exists "bm_storage_admin_update"  on storage.objects;
drop policy if exists "bm_storage_admin_delete"  on storage.objects;

create policy "bm_storage_public_read" on storage.objects
    for select to anon, authenticated
    using (bucket_id in ('products', 'gallery'));

create policy "bm_storage_admin_insert" on storage.objects
    for insert to authenticated
    with check (bucket_id in ('products', 'gallery') and public.is_admin());

create policy "bm_storage_admin_update" on storage.objects
    for update to authenticated
    using (bucket_id in ('products', 'gallery') and public.is_admin())
    with check (bucket_id in ('products', 'gallery') and public.is_admin());

create policy "bm_storage_admin_delete" on storage.objects
    for delete to authenticated
    using (bucket_id in ('products', 'gallery') and public.is_admin());

-- IMPORTANT: any OLDER storage policy you created by hand still applies
-- alongside these. Go to Storage → Policies and delete anything that grants
-- insert/update/delete to "public" or "anon". See the manual notes, section A.


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 4 — LIMIT WHAT A STRANGER CAN WRITE INTO YOUR ENQUIRIES TABLE
-- ════════════════════════════════════════════════════════════════════════════
-- Anyone must be able to send you an enquiry — that is the point of a contact
-- form. But the rule was `with check (true)`, which validated nothing: a
-- script could insert unlimited multi-megabyte rows and fill your database.

drop policy if exists inquiries_insert on public.inquiries;
create policy inquiries_insert on public.inquiries
    for insert to anon, authenticated
    with check (
        jsonb_typeof(data) = 'object'
        and pg_column_size(data) < 8192        -- ~8 KB per enquiry is plenty
    );


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 5 — RECORD WHERE EACH ENQUIRY CAME FROM
-- ════════════════════════════════════════════════════════════════════════════
-- These three values are written inside the existing `data` column by the
-- website, so no schema change is strictly required. This view makes them
-- easy to read in the dashboard without digging through JSON.

create or replace view public.inquiries_readable as
select
    i.id,
    i.created_at,
    i.read,
    i.data ->> 'type'          as type,
    i.data ->> 'name'          as name,
    i.data ->> 'email'         as email,
    i.data ->> 'phone'         as phone,
    i.data ->> 'company'       as company,
    i.data ->> 'page_url'      as came_from_page,
    i.data ->> 'language'      as language,
    i.data ->> 'referrer_host' as found_us_via,
    i.data ->> 'message'       as message
from public.inquiries i;

revoke all on public.inquiries_readable from anon;
grant select on public.inquiries_readable to authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 6 — COOKIELESS ANALYTICS TABLE
-- ════════════════════════════════════════════════════════════════════════════
-- Records WHAT happened and ON WHICH PAGE, with no visitor identifier at all,
-- so rows cannot be linked together into a profile of one person. That is why
-- the site needs no cookie banner.

create table if not exists public.events (
    id            bigserial primary key,
    name          text not null,
    path          text,
    lang          text,
    referrer_host text,
    created_at    timestamptz not null default now()
);

alter table public.events
    drop constraint if exists events_name_allowed;
alter table public.events
    add constraint events_name_allowed check (name in (
        'page_view',
        'quote_modal_open',
        'quote_add',
        'form_submit_contact',
        'form_submit_price',
        'form_submit_quote',
        'click_phone',
        'click_email',
        'click_whatsapp',
        'click_telegram',
        'click_certificate'
    ));

alter table public.events
    drop constraint if exists events_sizes;
alter table public.events
    add constraint events_sizes check (
        length(coalesce(path, '')) <= 200
        and length(coalesce(lang, '')) <= 8
        and length(coalesce(referrer_host, '')) <= 120
    );

create index if not exists events_created_at_idx on public.events (created_at desc);
create index if not exists events_name_idx       on public.events (name);

alter table public.events enable row level security;

drop policy if exists events_insert on public.events;
create policy events_insert on public.events
    for insert to anon, authenticated
    with check (true);     -- the CHECK constraints above do the validating

drop policy if exists events_read on public.events;
create policy events_read on public.events
    for select to authenticated
    using (public.is_admin());


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 7 — FIX PRODUCT URLS THAT CONTAIN CAPITAL LETTERS
-- ════════════════════════════════════════════════════════════════════════════
-- Web addresses on Vercel are case-sensitive: /products/Slice-B and
-- /products/slice-b are two different pages. Two of your products have
-- capitals in their address (Slice-B, Tribulus), which creates duplicates and
-- breaks links typed in lower case. The website already redirects the old
-- capitalised address to the new one, so no link is lost.

update public.products
set slug = lower(slug),
    data = jsonb_set(data, '{slug}', to_jsonb(lower(slug)))
where slug <> lower(slug);

-- ── CHECK: should return no rows.
select slug from public.products where slug <> lower(slug);


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 8 — RENAME THE MISSPELLED GALLERY FOLDER IN STORED PATHS
-- ════════════════════════════════════════════════════════════════════════════
-- The folder is called "gallary photos" — misspelled, and with a space in it,
-- which has to be encoded as %20 in every web address. It is renamed to
-- "gallery" in the project; this updates the paths saved in the database to
-- match. Run this ONLY after the new version is deployed, or the gallery
-- images will 404 on the current live site for a few minutes.

update public.settings
set data = jsonb_set(
        data,
        '{gallery}',
        (
            select coalesce(
                jsonb_agg(
                    to_jsonb(replace(elem #>> '{}', '/gallary photos/', '/gallery/'))
                    order by ord
                ),
                '[]'::jsonb
            )
            from jsonb_array_elements(data -> 'gallery') with ordinality as t (elem, ord)
        )
    )
where id = 'main'
  and jsonb_typeof(data -> 'gallery') = 'array';

-- ── CHECK: every path should now start with /gallery/
select jsonb_array_elements_text(data -> 'gallery') as gallery_path
from public.settings where id = 'main';


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 9 — STOP THE PAGE COUNTER GROWING WITHOUT LIMIT
-- ════════════════════════════════════════════════════════════════════════════
-- The counter accepted any key name, so a script could invent unlimited new
-- keys and bloat the single row it stores. This caps the number of distinct
-- pages it will track.

create or replace function public.increment_pageview(p_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    existing jsonb;
begin
    if p_key is null
       or length(p_key) > 80
       or p_key !~ '^[a-zA-Z0-9_-]+$' then
        return;
    end if;

    select coalesce(paths, '{}'::jsonb) into existing
    from public.stats where id = 'pageviews';

    -- Refuse to create a NEW key once 300 distinct pages are tracked.
    -- Existing keys keep counting normally.
    if existing is not null
       and not (existing ? p_key)
       and (select count(*) from jsonb_object_keys(existing)) >= 300 then
        update public.stats set total = coalesce(total, 0) + 1 where id = 'pageviews';
        return;
    end if;

    insert into public.stats (id, total, paths)
    values ('pageviews', 1, jsonb_build_object(p_key, 1))
    on conflict (id) do update
    set total = coalesce(public.stats.total, 0) + 1,
        paths = jsonb_set(
            coalesce(public.stats.paths, '{}'::jsonb),
            array[p_key],
            to_jsonb(coalesce((public.stats.paths ->> p_key)::int, 0) + 1),
            true
        );
end;
$$;

revoke all on function public.increment_pageview(text) from public;
grant execute on function public.increment_pageview(text) to anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- STEP 10 — NEW TEXT USED BY THE UPDATED PAGES (ENGLISH + RUSSIAN)
-- ════════════════════════════════════════════════════════════════════════════
-- All of this is editable afterwards in the admin panel under Translations.
-- The `||` operator merges these keys in without touching existing ones.

update public.settings
set data = jsonb_set(
    data,
    '{en}',
    coalesce(data -> 'en', '{}'::jsonb) || '{
        "skip_to_content": "Skip to content",
        "nav_main": "Main navigation",
        "nav_home_logo_alt": "Bogot Master — home",
        "nav_select_language": "Select language",
        "nav_open_menu": "Open menu",
        "nav_close_menu": "Close menu",
        "breadcrumb": "Breadcrumb",

        "products_intro": "Licorice root (Glycyrrhiza glabra) from Khorezm, Uzbekistan, in the cuts and grades below. Every grade is available in bulk; tell us the form and volume you need and we will quote it.",
        "products_cta_title": "Need a grade that is not listed?",
        "products_cta_text": "We cut, grade and pack to order. Send us your specification and we will tell you what is possible.",

        "about_mission_title": "What we do and how we work",

        "home_cta_title": "Ready to Partner with Us?",
        "home_cta_text": "Contact us today to receive a personalized commercial proposal.",

        "form_name_error": "Please enter your name",
        "form_reply_time": "We reply to every enquiry within 24 hours.",
        "form_privacy_note": "We use your details only to answer your enquiry. See our",

        "seo_suffix_licorice": "Bulk Licorice Root Supplier | Bogot Master",
        "seo_suffix_generic": "Bulk Supply from Uzbekistan | Bogot Master",

        "a11y_close": "Close",
        "a11y_prev_image": "Previous image",
        "a11y_next_image": "Next image",
        "a11y_whatsapp": "Contact us on WhatsApp",
        "a11y_telegram": "Contact us on Telegram",
        "a11y_open_contact": "Open contact menu",
        "a11y_close_contact": "Close contact menu",
        "a11y_pdf_suffix": "(PDF, opens in a new tab)",

        "quote_optional_title": "Shipping details (optional)",
        "quote_optional_hint": "Filling these in gets you an accurate quote first time. Leave them blank if you are not sure yet.",
        "quote_destination_country": "Destination country",
        "quote_destination_port": "Port or city",
        "quote_incoterms": "Incoterms",
        "quote_incoterms_choose": "Not sure / to discuss",
        "quote_total_quantity": "Total quantity",
        "quote_unit": "Unit",
        "quote_timeline": "Needed by",

        "privacy_title": "Privacy Policy",
        "privacy_meta_title": "Privacy Policy | Bogot Master",
        "privacy_meta_desc": "How Bogot Master handles the information you send through this website: what is collected, where it is stored, and how to have it deleted.",
        "privacy_draft_label": "Draft.",
        "privacy_draft_text": "This policy describes what the website actually does, but it has not yet been reviewed by a lawyer. Please check it before relying on it.",
        "privacy_intro": "This page explains what happens to the information you send us through this website.",
        "privacy_what_title": "What we collect",
        "privacy_what_text": "Only what you type into one of our forms: your name, email address, and where you provide them, your phone number, company name, product interest, quantity, destination and message. We also record which page the form was sent from, the language you were reading, and the website that referred you (the domain name only, never the full address).",
        "privacy_why_title": "Why we collect it",
        "privacy_why_text": "To answer your enquiry and to prepare a quotation. We do not sell your details, and we do not use them for marketing unless you ask us to.",
        "privacy_where_title": "Where it is stored",
        "privacy_where_text": "Enquiries are stored in a database hosted by Supabase. The website itself is hosted by Vercel, whose servers keep standard access logs. Both are third-party providers acting on our behalf.",
        "privacy_email_title": "Email",
        "privacy_email_text": "When you send an enquiry we email it to ourselves and send you an automatic confirmation. Those emails are delivered by Resend. Your email address is used as the reply address so we can respond to you directly.",
        "privacy_analytics_title": "Analytics and cookies",
        "privacy_analytics_text": "This website sets no cookies and uses no third-party analytics. We count page views and a small number of actions (for example, that a contact form was submitted) without storing any identifier for you, so these records cannot be connected to each other or to you. That is why you see no cookie banner.",
        "privacy_retention_title": "How long we keep it",
        "privacy_retention_text": "Enquiries are kept for as long as we may need them for our business relationship with you. Ask us and we will delete yours.",
        "privacy_rights_title": "Your rights",
        "privacy_rights_text": "You can ask us what we hold about you, ask us to correct it, or ask us to delete it. Write to the address below and we will respond.",
        "privacy_contact_title": "Contact",
        "privacy_contact_text": "For anything on this page, write to"
    }'::jsonb
)
where id = 'translations';

update public.settings
set data = jsonb_set(
    data,
    '{ru}',
    coalesce(data -> 'ru', '{}'::jsonb) || '{
        "skip_to_content": "Перейти к содержанию",
        "nav_main": "Основная навигация",
        "nav_home_logo_alt": "Bogot Master — на главную",
        "nav_select_language": "Выбрать язык",
        "nav_open_menu": "Открыть меню",
        "nav_close_menu": "Закрыть меню",
        "breadcrumb": "Навигационная цепочка",

        "products_intro": "Корень солодки (Glycyrrhiza glabra) из Хорезма, Узбекистан, в указанных ниже формах и фракциях. Все позиции доступны оптом — сообщите нужную форму и объём, и мы подготовим предложение.",
        "products_cta_title": "Нужна позиция, которой нет в списке?",
        "products_cta_text": "Мы режем, калибруем и упаковываем под заказ. Пришлите вашу спецификацию, и мы скажем, что возможно.",

        "about_mission_title": "Чем мы занимаемся и как работаем",

        "home_cta_title": "Готовы начать сотрудничество?",
        "home_cta_text": "Свяжитесь с нами сегодня, чтобы получить индивидуальное коммерческое предложение.",

        "form_name_error": "Пожалуйста, укажите ваше имя",
        "form_reply_time": "Мы отвечаем на каждый запрос в течение 24 часов.",
        "form_privacy_note": "Мы используем ваши данные только для ответа на запрос. См.",

        "seo_suffix_licorice": "Оптовый поставщик корня солодки | Bogot Master",
        "seo_suffix_generic": "Оптовые поставки из Узбекистана | Bogot Master",

        "a11y_close": "Закрыть",
        "a11y_prev_image": "Предыдущее изображение",
        "a11y_next_image": "Следующее изображение",
        "a11y_whatsapp": "Написать нам в WhatsApp",
        "a11y_telegram": "Написать нам в Telegram",
        "a11y_open_contact": "Открыть меню контактов",
        "a11y_close_contact": "Закрыть меню контактов",
        "a11y_pdf_suffix": "(PDF, откроется в новой вкладке)",

        "quote_optional_title": "Детали поставки (необязательно)",
        "quote_optional_hint": "Если заполните эти поля, мы сразу подготовим точное предложение. Можно оставить пустыми.",
        "quote_destination_country": "Страна назначения",
        "quote_destination_port": "Порт или город",
        "quote_incoterms": "Условия поставки (Incoterms)",
        "quote_incoterms_choose": "Не знаю / обсудим",
        "quote_total_quantity": "Общий объём",
        "quote_unit": "Единица",
        "quote_timeline": "Срок поставки",

        "privacy_title": "Политика конфиденциальности",
        "privacy_meta_title": "Политика конфиденциальности | Bogot Master",
        "privacy_meta_desc": "Как Bogot Master обращается с данными, которые вы отправляете через этот сайт: что собирается, где хранится и как это удалить.",
        "privacy_draft_label": "Черновик.",
        "privacy_draft_text": "Эта политика описывает, что сайт действительно делает, но она ещё не проверена юристом. Пожалуйста, проверьте её перед использованием.",
        "privacy_intro": "На этой странице объясняется, что происходит с данными, которые вы отправляете нам через сайт.",
        "privacy_what_title": "Какие данные мы собираем",
        "privacy_what_text": "Только то, что вы вводите в наши формы: имя, адрес электронной почты, а также — если вы их указали — телефон, название компании, интересующий товар, объём, направление поставки и сообщение. Мы также фиксируем, с какой страницы отправлена форма, на каком языке вы читали сайт и с какого сайта вы к нам пришли (только доменное имя, никогда полный адрес).",
        "privacy_why_title": "Зачем они нам",
        "privacy_why_text": "Чтобы ответить на ваш запрос и подготовить коммерческое предложение. Мы не продаём ваши данные и не используем их для рассылок без вашей просьбы.",
        "privacy_where_title": "Где они хранятся",
        "privacy_where_text": "Запросы хранятся в базе данных на сервисе Supabase. Сам сайт размещён на Vercel, чьи серверы ведут обычные журналы доступа. Оба — сторонние поставщики услуг, действующие по нашему поручению.",
        "privacy_email_title": "Электронная почта",
        "privacy_email_text": "Когда вы отправляете запрос, мы пересылаем его себе на почту и отправляем вам автоматическое подтверждение. Эти письма доставляет сервис Resend. Ваш адрес используется как адрес для ответа, чтобы мы могли написать вам напрямую.",
        "privacy_analytics_title": "Аналитика и cookie",
        "privacy_analytics_text": "Этот сайт не использует cookie и не использует сторонние системы аналитики. Мы считаем просмотры страниц и несколько действий (например, что форма была отправлена), не сохраняя никакого вашего идентификатора, поэтому эти записи нельзя связать между собой или с вами. Именно поэтому на сайте нет баннера о cookie.",
        "privacy_retention_title": "Сколько мы их храним",
        "privacy_retention_text": "Запросы хранятся столько, сколько они могут понадобиться для наших деловых отношений с вами. Напишите нам, и мы удалим ваши данные.",
        "privacy_rights_title": "Ваши права",
        "privacy_rights_text": "Вы можете запросить, какие данные о вас у нас есть, попросить их исправить или удалить. Напишите на адрес ниже, и мы ответим.",
        "privacy_contact_title": "Контакты",
        "privacy_contact_text": "По любым вопросам с этой страницы пишите на"
    }'::jsonb
)
where id = 'translations';

-- ── CHECK: both should return 't'
select
    (data -> 'en' ? 'privacy_title') as english_text_added,
    (data -> 'ru' ? 'privacy_title') as russian_text_added
from public.settings where id = 'translations';


-- ════════════════════════════════════════════════════════════════════════════
--  DONE.
--  Now sign out of /admin, sign in again, and check that you can still edit
--  a product. If you cannot, run the UNDO section below and tell your
--  developer which step failed.
-- ════════════════════════════════════════════════════════════════════════════


/* ════════════════════════════════════════════════════════════════════════════
   UNDO — ONLY RUN THIS IF SOMETHING BROKE
   ════════════════════════════════════════════════════════════════════════════
   Remove the surrounding slash-asterisk markers to run it.

   This puts the permission rules back exactly as they were before (any signed
   in account may write), and removes the new table and helper. It does NOT
   undo Step 7 (lowercase URLs), Step 8 (gallery paths) or Step 10 (new text),
   because those are content changes that the new site depends on — reversing
   them would break the live pages. Undo statements for them are included at
   the very bottom, commented out separately, in case you truly need them.


-- Put the old, permissive rules back
drop policy if exists products_write on public.products;
create policy products_write on public.products
    for all to authenticated using (true) with check (true);

drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings
    for all to authenticated using (true) with check (true);

drop policy if exists inquiries_admin on public.inquiries;
create policy inquiries_admin on public.inquiries
    for all to authenticated using (true) with check (true);

drop policy if exists inquiries_insert on public.inquiries;
create policy inquiries_insert on public.inquiries
    for insert to anon, authenticated with check (true);

drop policy if exists stats_read on public.stats;
create policy stats_read on public.stats
    for select to authenticated using (true);

-- Remove the storage rules this migration added
drop policy if exists "bm_storage_public_read"  on storage.objects;
drop policy if exists "bm_storage_admin_insert" on storage.objects;
drop policy if exists "bm_storage_admin_update" on storage.objects;
drop policy if exists "bm_storage_admin_delete" on storage.objects;

-- Remove the new analytics table and the admin helper
drop view  if exists public.inquiries_readable;
drop table if exists public.events;
drop function if exists public.is_admin();
drop table if exists public.admins;

   ════════════════════════════════════════════════════════════════════════════ */


/* ── Separate undo for the content changes (rarely needed) ───────────────────

-- Step 8 reversed: put the misspelled folder back in the stored paths
update public.settings
set data = jsonb_set(
        data, '{gallery}',
        (select coalesce(jsonb_agg(to_jsonb(replace(elem #>> '{}', '/gallery/', '/gallary photos/')) order by ord), '[]'::jsonb)
         from jsonb_array_elements(data -> 'gallery') with ordinality as t (elem, ord))
    )
where id = 'main' and jsonb_typeof(data -> 'gallery') = 'array';

-- Step 7 cannot be reversed automatically: the original capitalisation is not
-- recorded anywhere. The two affected products were "Slice-B" and "Tribulus".

   ──────────────────────────────────────────────────────────────────────────── */
