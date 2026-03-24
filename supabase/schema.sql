-- Run this in Supabase SQL Editor

create table if not exists gears (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null default '',
  weight_g integer not null default 0,
  category text not null default 'Others',
  price_krw integer not null default 0,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (optional for local dev)
alter table gears enable row level security;

-- Allow all operations without auth (for MVP / local dev)
create policy "allow all" on gears
  for all using (true) with check (true);
