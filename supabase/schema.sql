-- ───────────────────────────────────────────────────────────────────────────
-- Bogot Master — Supabase backend schema
-- Run ONCE in the Supabase Dashboard → SQL Editor (idempotent — safe to re-run).
-- After running: create the `products` + `gallery` storage buckets (public read,
-- authenticated write) and add one admin user under Authentication → Users.
--
-- SECURITY — REQUIRED: the write policies below grant access to ANY signed-in
-- user. This app has a single admin and no public sign-up flow, so you MUST turn
-- OFF public signups, otherwise anyone could register via the anon key and edit
-- content:  Authentication → Providers → Email → disable "Allow new users to
-- sign up"  (a.k.a. Authentication → Settings → "Enable signups" = off).
-- Create the admin account yourself under Authentication → Users.
-- ───────────────────────────────────────────────────────────────────────────

-- ─── Tables ─────────────────────────────────────────────────────────────────

create table if not exists public.products (
    slug    text primary key,
    "order" integer not null default 0,
    data    jsonb   not null default '{}'::jsonb
);

create table if not exists public.settings (
    id   text primary key,            -- 'main' | 'translations'
    data jsonb not null default '{}'::jsonb
);

create table if not exists public.inquiries (
    id         uuid primary key default gen_random_uuid(),
    data       jsonb not null default '{}'::jsonb,
    read       boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.stats (
    id    text primary key,           -- 'pageviews'
    total integer not null default 0,
    paths jsonb   not null default '{}'::jsonb
);

-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table public.products  enable row level security;
alter table public.settings  enable row level security;
alter table public.inquiries enable row level security;
alter table public.stats     enable row level security;

-- Products: anyone reads, only signed-in admin writes.
drop policy if exists products_read  on public.products;
drop policy if exists products_write on public.products;
create policy products_read  on public.products for select using (true);
create policy products_write on public.products for all
    to authenticated using (true) with check (true);

-- Settings: anyone reads, only signed-in admin writes.
drop policy if exists settings_read  on public.settings;
drop policy if exists settings_write on public.settings;
create policy settings_read  on public.settings for select using (true);
create policy settings_write on public.settings for all
    to authenticated using (true) with check (true);

-- Inquiries: anyone (contact form) inserts; only admin reads / updates / deletes.
drop policy if exists inquiries_insert on public.inquiries;
drop policy if exists inquiries_admin  on public.inquiries;
create policy inquiries_insert on public.inquiries for insert
    to anon, authenticated with check (true);
create policy inquiries_admin on public.inquiries for all
    to authenticated using (true) with check (true);

-- Stats: only admin reads directly. Increments go through the RPC below.
drop policy if exists stats_read on public.stats;
create policy stats_read on public.stats for select
    to authenticated using (true);

-- ─── Atomic page-view counter (replaces Firestore increment()) ──────────────
-- SECURITY DEFINER lets anonymous visitors be counted without table write grants.

create or replace function public.increment_pageview(p_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    -- Reject malformed keys so anonymous callers can't bloat the jsonb blob.
    if p_key is null or length(p_key) > 80 or p_key !~ '^[a-zA-Z0-9_-]+$' then
        return;
    end if;

    insert into public.stats (id, total, paths)
    values ('pageviews', 1, jsonb_build_object(p_key, 1))
    on conflict (id) do update set
        total = public.stats.total + 1,
        paths = jsonb_set(
            public.stats.paths,
            array[p_key],
            to_jsonb(coalesce((public.stats.paths ->> p_key)::int, 0) + 1),
            true
        );
end;
$$;

grant execute on function public.increment_pageview(text) to anon, authenticated;
