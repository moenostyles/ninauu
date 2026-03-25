-- Auth migration: user_id, visibility, RLS policies
-- Run in Supabase SQL Editor

-- ── gears ──────────────────────────────────────────────────────────────
ALTER TABLE gears ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE gears ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private'));

ALTER TABLE gears ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users can view own gears" ON gears;
DROP POLICY IF EXISTS "users can insert own gears" ON gears;
DROP POLICY IF EXISTS "users can update own gears" ON gears;
DROP POLICY IF EXISTS "users can delete own gears" ON gears;
CREATE POLICY "users can view own gears" ON gears FOR SELECT USING (auth.uid() = user_id OR visibility = 'public');
CREATE POLICY "users can insert own gears" ON gears FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own gears" ON gears FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete own gears" ON gears FOR DELETE USING (auth.uid() = user_id);

-- ── wishlist ────────────────────────────────────────────────────────────
ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users can view own wishlist" ON wishlist;
DROP POLICY IF EXISTS "users can insert own wishlist" ON wishlist;
DROP POLICY IF EXISTS "users can update own wishlist" ON wishlist;
DROP POLICY IF EXISTS "users can delete own wishlist" ON wishlist;
CREATE POLICY "users can view own wishlist" ON wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can insert own wishlist" ON wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own wishlist" ON wishlist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete own wishlist" ON wishlist FOR DELETE USING (auth.uid() = user_id);

-- ── trips ───────────────────────────────────────────────────────────────
ALTER TABLE trips ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE trips ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private'));

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users can view own trips" ON trips;
DROP POLICY IF EXISTS "users can insert own trips" ON trips;
DROP POLICY IF EXISTS "users can update own trips" ON trips;
DROP POLICY IF EXISTS "users can delete own trips" ON trips;
CREATE POLICY "users can view own trips" ON trips FOR SELECT USING (auth.uid() = user_id OR visibility = 'public');
CREATE POLICY "users can insert own trips" ON trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own trips" ON trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete own trips" ON trips FOR DELETE USING (auth.uid() = user_id);

-- ── saved_packs ─────────────────────────────────────────────────────────
ALTER TABLE saved_packs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE saved_packs ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private'));

ALTER TABLE saved_packs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users can view own saved_packs" ON saved_packs;
DROP POLICY IF EXISTS "users can insert own saved_packs" ON saved_packs;
DROP POLICY IF EXISTS "users can update own saved_packs" ON saved_packs;
DROP POLICY IF EXISTS "users can delete own saved_packs" ON saved_packs;
CREATE POLICY "users can view own saved_packs" ON saved_packs FOR SELECT USING (auth.uid() = user_id OR visibility = 'public');
CREATE POLICY "users can insert own saved_packs" ON saved_packs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own saved_packs" ON saved_packs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users can delete own saved_packs" ON saved_packs FOR DELETE USING (auth.uid() = user_id);

-- ── saved_pack_items ────────────────────────────────────────────────────
ALTER TABLE saved_pack_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users can manage own pack items" ON saved_pack_items;
CREATE POLICY "users can manage own pack items" ON saved_pack_items
  USING (pack_id IN (SELECT id FROM saved_packs WHERE user_id = auth.uid() OR visibility = 'public'))
  WITH CHECK (pack_id IN (SELECT id FROM saved_packs WHERE user_id = auth.uid()));

-- ── trip_items ──────────────────────────────────────────────────────────
ALTER TABLE trip_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users can manage own trip items" ON trip_items;
CREATE POLICY "users can manage own trip items" ON trip_items
  USING (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid() OR visibility = 'public'))
  WITH CHECK (trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid()));
