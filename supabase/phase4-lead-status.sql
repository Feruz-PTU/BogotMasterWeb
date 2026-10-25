-- ════════════════════════════════════════════════════════════════════════════
-- PHASE 4 — LEAD STATUS AND REPLY TIME (FOLDER 25)
-- ════════════════════════════════════════════════════════════════════════════
-- Gives every enquiry a place in the sales pipeline, so the admin can show
-- which leads still wait for a reply and whether the 24-hour promise is kept.
--
-- WHAT IT ADDS to public.inquiries (five new columns; nothing is removed):
--   status            new | replied | quoted | sample_sent | won | lost
--                     (every enquiry, old and new, starts as 'new')
--   lost_reason       price | spec | timing | no_reply | other (only for 'lost')
--   first_reply_at    when the buyer first got an answer
--   status_updated_at when the status last changed
--   status_history    the list of changes, e.g.
--                     [{"status":"replied","at":"…"},{"follow_up":true,"at":"…"}]
-- The admin dashboard writes all five; the website's forms never do.
--
-- WHO MAY CHANGE THEM: only the admin. The rule that already lets the admin
-- read, update and delete enquiries (inquiries_admin, from
-- phase2-migration.sql) covers the new columns too, and visitors have no
-- update rule at all. Visitors may still only ADD an enquiry; a small trigger
-- makes sure such a new enquiry always starts as 'new' with an empty history,
-- whatever a script might send. The trigger never refuses an enquiry.
--
-- SAFE TO RUN: everything is inside one transaction (begin … commit). If any
-- step failed, Postgres would undo the others and leave the table as it was.
-- No enquiry is deleted or changed, except that each gets status 'new' and an
-- empty history. Running it twice is harmless.
-- (Checked on 25 Oct 2026: the live table has the columns id, created_at,
-- read and data, and the live view has the 25 columns below.)
--
-- HOW TO RUN: Supabase → SQL Editor → New query → paste this whole file → Run.
-- The last statement lists the table's access rules: you should see
-- inquiries_admin (ALL) and inquiries_insert (INSERT).
--
-- UNDO: the commented block at the end.

begin;

-- 1. The five columns.
alter table public.inquiries
    add column if not exists status            text  not null default 'new',
    add column if not exists lost_reason       text,
    add column if not exists first_reply_at    timestamptz,
    add column if not exists status_updated_at timestamptz,
    add column if not exists status_history    jsonb not null default '[]'::jsonb;

-- 2. Only the allowed values, and a history of sensible size (about 200 changes).
alter table public.inquiries drop constraint if exists inquiries_status_allowed;
alter table public.inquiries add constraint inquiries_status_allowed
    check (status in ('new', 'replied', 'quoted', 'sample_sent', 'won', 'lost'));

alter table public.inquiries drop constraint if exists inquiries_lost_reason_allowed;
alter table public.inquiries add constraint inquiries_lost_reason_allowed
    check (lost_reason is null or lost_reason in ('price', 'spec', 'timing', 'no_reply', 'other'));

alter table public.inquiries drop constraint if exists inquiries_status_history_shape;
alter table public.inquiries add constraint inquiries_status_history_shape
    check (jsonb_typeof(status_history) = 'array' and pg_column_size(status_history) < 16384);

-- 3. A visitor's new enquiry always starts as 'new'. The trigger resets the
--    five fields rather than refusing the row, so no enquiry can be lost here.
create or replace function public.inquiries_new_lead_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if not coalesce(public.is_admin(), false) then
        new.status            := 'new';
        new.lost_reason       := null;
        new.first_reply_at    := null;
        new.status_updated_at := null;
        new.status_history    := '[]'::jsonb;
    end if;
    return new;
end;
$$;

revoke all on function public.inquiries_new_lead_defaults() from public;

drop trigger if exists inquiries_new_lead_defaults on public.inquiries;
create trigger inquiries_new_lead_defaults
    before insert on public.inquiries
    for each row execute function public.inquiries_new_lead_defaults();

-- 4. The readable view: its 25 columns of today keep their names and order,
--    and the four status columns come after them.
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
    i.data ->> 'reference'           as reference,
    -- New columns:
    i.status,
    i.lost_reason,
    i.first_reply_at,
    i.status_updated_at
from public.inquiries i;

-- The same access as before: signed-in admin only, never the public.
revoke all on public.inquiries_readable from anon;
grant select on public.inquiries_readable to authenticated;

commit;

-- Tells the database's web interface to pick up the new columns now.
notify pgrst, 'reload schema';

-- Shows who may do what with enquiries (a read, changes nothing).
select policyname, cmd, roles, qual as may_touch_rows_where
from pg_policies
where schemaname = 'public' and tablename = 'inquiries'
order by policyname;


-- ── UNDO, only if ever needed ────────────────────────────────────────────────
-- WARNING: the last line deletes the five columns and every status, reply time
-- and history entered in the admin (the enquiries themselves stay). Back up
-- first: Table Editor → inquiries → Export to CSV.
-- To undo, remove the "-- " at the start of each line below and run them.
--
-- begin;
-- drop trigger if exists inquiries_new_lead_defaults on public.inquiries;
-- drop function if exists public.inquiries_new_lead_defaults();
-- drop view if exists public.inquiries_readable;
-- create view public.inquiries_readable as
-- select
--     i.id, i.created_at, i.read,
--     i.data ->> 'type' as type, i.data ->> 'name' as name, i.data ->> 'email' as email,
--     i.data ->> 'phone' as phone, i.data ->> 'company' as company,
--     i.data ->> 'page_url' as came_from_page, i.data ->> 'language' as language,
--     i.data ->> 'referrer_host' as found_us_via, i.data ->> 'message' as message,
--     i.data ->> 'product' as products, i.data -> 'items' as items,
--     i.data ->> 'annual_volume' as annual_volume, i.data ->> 'application' as used_for,
--     i.data ->> 'standard' as standard, i.data ->> 'destination_country' as destination_country,
--     i.data ->> 'destination_port' as port_or_city, i.data ->> 'incoterms' as incoterms,
--     i.data ->> 'timeline' as needed_by, i.data ->> 'preferred_channel' as reply_by,
--     i.data ->> 'sample_address' as sample_address, i.data ->> 'fedex_account' as fedex_account,
--     i.data ->> 'reference' as reference
-- from public.inquiries i;
-- revoke all on public.inquiries_readable from anon;
-- grant select on public.inquiries_readable to authenticated;
-- alter table public.inquiries
--     drop constraint if exists inquiries_status_allowed,
--     drop constraint if exists inquiries_lost_reason_allowed,
--     drop constraint if exists inquiries_status_history_shape;
-- alter table public.inquiries
--     drop column if exists status, drop column if exists lost_reason,
--     drop column if exists first_reply_at, drop column if exists status_updated_at,
--     drop column if exists status_history;
-- commit;
