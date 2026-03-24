-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS saved_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE saved_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all" ON saved_packs
  FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS saved_pack_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid NOT NULL REFERENCES saved_packs(id) ON DELETE CASCADE,
  gear_id uuid,
  gear_name text NOT NULL,
  brand text NOT NULL DEFAULT '',
  weight_g integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'Others',
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE saved_pack_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all" ON saved_pack_items
  FOR ALL USING (true) WITH CHECK (true);
