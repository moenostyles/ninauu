-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_weight_g integer NOT NULL DEFAULT 0,
  memo text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all" ON trips
  FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS trip_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  gear_name text NOT NULL,
  brand text NOT NULL DEFAULT '',
  weight_g integer NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'Others',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trip_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all" ON trip_items
  FOR ALL USING (true) WITH CHECK (true);
