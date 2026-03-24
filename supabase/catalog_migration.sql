-- Run this in Supabase SQL Editor
-- Creates the master gear catalog (read-only reference DB)

create table if not exists gear_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null default '',
  description text not null default '',
  weight_g integer not null default 0,
  category text not null default 'Others',
  price_krw integer not null default 0,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table gear_catalog enable row level security;

-- Read-only for all users
create policy "allow read" on gear_catalog
  for select using (true);
