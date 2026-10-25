-- ════════════════════════════════════════════════════════════════════════════
-- PHASE 4 — THE LEAD REFERENCE IN THE READABLE ENQUIRIES VIEW (OPTIONAL)
-- ════════════════════════════════════════════════════════════════════════════
-- Since folder 24 every lead carries a reference such as "BM-7K4Q2" (the
-- buyer sees it on screen and in their confirmation email). The website saves
-- it inside the `data` column of public.inquiries, like every other field, and
-- the admin dashboard already shows it. This file only adds it to the
-- inquiries_readable view as a column, for reading leads in Supabase itself.
--
-- WHAT IT CHANGES: only the view, which is a saved read-only query. No table
-- is changed and no enquiry is touched.
--
-- WHY IT CANNOT BREAK ANYTHING: the view's 24 columns of today keep their
-- names and order, and `reference` comes after them. That is the only change
-- Postgres allows in CREATE OR REPLACE VIEW. If the live view did not match,
-- Postgres would refuse the whole statement and change nothing.
-- (Checked on 25 Oct 2026: the live view has exactly the 24 columns below.)
--
-- HOW TO RUN: Supabase → SQL Editor → New query → paste this whole file → Run.
-- "Success. No rows returned" means it worked.
--
-- UNDO: the commented block at the end restores the 24-column view.

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
    i.data ->> 'message'       as message,
    i.data ->> 'product'             as products,
    i.data -> 'items'                as items,
    i.data ->> 'annual_volume'       as annual_volume,
    i.data ->> 'application'         as used_for,
    i.data ->> 'standard'            as standard,
    i.data ->> 'destination_country' as destination_country,
    i.data ->> 'destination_port'    as port_or_city,
    i.data ->> 'incoterms'           as incoterms,
    i.data ->> 'timeline'            as needed_by,
    i.data ->> 'preferred_channel'   as reply_by,
    i.data ->> 'sample_address'      as sample_address,
    i.data ->> 'fedex_account'       as fedex_account,
    -- New column: the reference the buyer was given.
    i.data ->> 'reference'           as reference
from public.inquiries i;

-- The same access as before: signed-in admin only, never the public.
revoke all on public.inquiries_readable from anon;
grant select on public.inquiries_readable to authenticated;


-- ── UNDO, only if ever needed ────────────────────────────────────────────────
-- Removing a column from a view needs the view dropped and created again.
-- Dropping a VIEW deletes no enquiry: the leads live in public.inquiries.
-- To undo, remove the "-- " at the start of each line below and run them.
--
-- drop view if exists public.inquiries_readable;
-- create view public.inquiries_readable as
-- select
--     i.id,
--     i.created_at,
--     i.read,
--     i.data ->> 'type'          as type,
--     i.data ->> 'name'          as name,
--     i.data ->> 'email'         as email,
--     i.data ->> 'phone'         as phone,
--     i.data ->> 'company'       as company,
--     i.data ->> 'page_url'      as came_from_page,
--     i.data ->> 'language'      as language,
--     i.data ->> 'referrer_host' as found_us_via,
--     i.data ->> 'message'       as message,
--     i.data ->> 'product'             as products,
--     i.data -> 'items'                as items,
--     i.data ->> 'annual_volume'       as annual_volume,
--     i.data ->> 'application'         as used_for,
--     i.data ->> 'standard'            as standard,
--     i.data ->> 'destination_country' as destination_country,
--     i.data ->> 'destination_port'    as port_or_city,
--     i.data ->> 'incoterms'           as incoterms,
--     i.data ->> 'timeline'            as needed_by,
--     i.data ->> 'preferred_channel'   as reply_by,
--     i.data ->> 'sample_address'      as sample_address,
--     i.data ->> 'fedex_account'       as fedex_account
-- from public.inquiries i;
-- revoke all on public.inquiries_readable from anon;
-- grant select on public.inquiries_readable to authenticated;
