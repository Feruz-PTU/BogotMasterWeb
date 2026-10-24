-- ════════════════════════════════════════════════════════════════════════════
-- FAQ — THE TABLE FOR QUESTIONS AND ANSWERS
-- ════════════════════════════════════════════════════════════════════════════
-- The FAQ answers are edited in the admin (FAQ tab) and stored here, one row
-- per question. This file creates that one NEW table and its rules:
--
--   • Anyone may read an answer whose status is "published". Drafts and
--     answers waiting for the owner ("needs_owner") cannot be read by a
--     visitor, and the site build reads as a visitor, so a draft can never
--     reach the website.
--   • Only the admin (the accounts in public.admins) may add, change or
--     delete answers. This is the same rule the products table uses.
--   • The database refuses to PUBLISH an answer that still contains an
--     "[owner: …]" or "[verify]" mark. Saving it as a draft is fine.
--
-- WHAT IT CHANGES: nothing that exists today. No existing table, row, rule or
-- function is changed, dropped or deleted. It only adds the new `faq` table,
-- one small helper function for its "last changed" time, and that table's
-- rules.
--
-- SAFE TO RUN: everything is inside one transaction (begin … commit). If any
-- step failed, Postgres would undo the others. Running it twice is harmless.
--
-- HOW TO RUN: Supabase → SQL Editor → New query → paste this whole file → Run.
-- The last statement prints one row: table_exists = 1, policies = 2,
-- row_security_on = true.
--
-- UNDO: the commented block at the end.

begin;

-- ── The table ───────────────────────────────────────────────────────────────
-- slug   = the answer's anchor on the page (/faq#samples): lowercase letters,
--          digits and single hyphens.
-- order  = position inside its group.
-- status = published | needs_owner | draft. A column rather than a field in
--          `data`, so the read rule below is simple and cannot be mistyped.
-- data   = everything else, in the same document shape as the other tables:
--          { group, q_en, a_en, q_ru, a_ru, links, related_products, source,
--            updated }
create table if not exists public.faq (
    id         uuid        primary key default gen_random_uuid(),
    slug       text        not null,
    "order"    integer     not null default 0,
    status     text        not null default 'draft',
    data       jsonb       not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint faq_slug_unique unique (slug),
    constraint faq_slug_format check (
        length(slug) between 1 and 80 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    ),
    constraint faq_status_allowed check (
        status in ('published', 'needs_owner', 'draft')
    ),
    constraint faq_data_is_object check (jsonb_typeof(data) = 'object'),
    -- The same marks the build refuses (scripts/content-guard.mjs).
    constraint faq_published_has_no_placeholder check (
        status <> 'published' or data::text !~* '\[(owner:|verify\y)'
    )
);

-- Keeps updated_at current on every change.
create or replace function public.faq_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

do $$
begin
    if not exists (
        select 1 from pg_trigger
        where tgname = 'faq_touch_updated_at' and tgrelid = 'public.faq'::regclass
    ) then
        create trigger faq_touch_updated_at
            before update on public.faq
            for each row execute function public.faq_touch_updated_at();
    end if;
end $$;

-- ── Who may read and write ──────────────────────────────────────────────────
alter table public.faq enable row level security;

-- Visitors (and the site build): published answers only.
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'faq' and policyname = 'faq_read_published'
    ) then
        create policy faq_read_published on public.faq
            for select to anon, authenticated
            using (status = 'published');
    end if;
end $$;

-- The admin: every answer, and every change. Same check as products_write.
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'faq' and policyname = 'faq_admin'
    ) then
        create policy faq_admin on public.faq
            for all to authenticated
            using (public.is_admin())
            with check (public.is_admin());
    end if;
end $$;

-- Visitors may only read; the rules above then limit them to published rows.
revoke all on public.faq from anon;
grant select on public.faq to anon;
grant select, insert, update, delete on public.faq to authenticated;

commit;

-- Shows that it worked: expect 1, 2, true.
select
    (select count(*) from information_schema.tables
        where table_schema = 'public' and table_name = 'faq')           as table_exists,
    (select count(*) from pg_policies
        where schemaname = 'public' and tablename = 'faq')              as policies,
    (select relrowsecurity from pg_class where oid = 'public.faq'::regclass) as row_security_on;


-- ── UNDO, only if ever needed ────────────────────────────────────────────────
-- Removes the FAQ table and its helper function. WARNING: this also deletes
-- every answer saved in it, so copy them out first (Table Editor → faq →
-- Export). Nothing else in the database is touched.
-- To undo, remove the "-- " at the start of each line below and run them.
--
-- begin;
-- drop table if exists public.faq;
-- drop function if exists public.faq_touch_updated_at();
-- commit;
