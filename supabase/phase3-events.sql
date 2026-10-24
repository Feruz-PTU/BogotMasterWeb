-- ════════════════════════════════════════════════════════════════════════════
-- PHASE 3 — THE REQUEST FORM'S ANALYTICS EVENTS
-- ════════════════════════════════════════════════════════════════════════════
-- The website records visitor actions in public.events, and the database
-- accepts only the event names on its list (the events_name_allowed check from
-- phase2-migration.sql). This file:
--   1. adds six names to that list: form_start, form_error,
--      form_submit_sample, form_submit_docs, spec_download, coa_download;
--   2. adds an optional `detail` column (at most 120 characters). The form
--      fills it only for form_error, with the NAMES of the fields that had an
--      error ("email,country"), never what was typed.
--
-- WHAT IT CHANGES: one new empty column and a longer list of allowed names.
-- No row is deleted or changed; every name allowed today stays allowed.
--
-- SAFE TO RUN: everything is inside one transaction (begin … commit). If any
-- step failed, Postgres would undo the others and leave the table as it was.
-- Running it twice is harmless.
--
-- HOW TO RUN: Supabase → SQL Editor → New query → paste this whole file → Run.
-- The last statement prints the list of allowed names, with the six new ones.
--
-- UNDO: the commented block at the end.

begin;

alter table public.events
    add column if not exists detail text;

alter table public.events
    drop constraint if exists events_detail_size;
alter table public.events
    add constraint events_detail_size check (length(coalesce(detail, '')) <= 120);

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
        'click_certificate',
        -- New:
        'form_start',
        'form_error',
        'form_submit_sample',
        'form_submit_docs',
        'spec_download',
        'coa_download'
    ));

commit;

-- Shows the list now in force.
select pg_get_constraintdef(oid) as allowed_event_names
from pg_constraint
where conname = 'events_name_allowed';


-- ── UNDO, only if ever needed ────────────────────────────────────────────────
-- Puts back the old list. "not valid" means rows already recorded under the
-- new names are kept; only new ones would be refused. The second statement
-- drops the `detail` column and what it holds (field names only).
-- To undo, remove the "-- " at the start of each line below and run them.
--
-- begin;
-- alter table public.events drop constraint if exists events_name_allowed;
-- alter table public.events add constraint events_name_allowed check (name in (
--     'page_view', 'quote_modal_open', 'quote_add', 'form_submit_contact',
--     'form_submit_price', 'form_submit_quote', 'click_phone', 'click_email',
--     'click_whatsapp', 'click_telegram', 'click_certificate'
-- )) not valid;
-- alter table public.events drop constraint if exists events_detail_size;
-- alter table public.events drop column if exists detail;
-- commit;
