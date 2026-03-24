-- Run this in Supabase SQL Editor

-- 1. Add is_verified flag to gear_catalog
alter table gear_catalog
  add column if not exists is_verified boolean not null default true;

-- Allow users to insert unverified items into gear_catalog
create policy "allow insert unverified" on gear_catalog
  for insert with check (is_verified = false);

-- 2. Create wishlist table
create table if not exists wishlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null default '',
  weight_g integer not null default 0,
  category text not null default 'Others',
  price_krw integer not null default 0,
  memo text not null default '',
  catalog_id uuid references gear_catalog(id),
  created_at timestamptz not null default now()
);

alter table wishlist enable row level security;

create policy "allow all" on wishlist
  for all using (true) with check (true);
