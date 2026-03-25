-- ユーザー分離マイグレーション
-- gears / wishlist / trips / saved_packs に user_id を追加し RLS を修正する

-- ── gears ──────────────────────────────────────────────
ALTER TABLE gears
  ADD COLUMN IF NOT EXISTS user_id uuid references auth.users(id) on delete cascade;

DROP POLICY IF EXISTS "allow all" ON gears;

CREATE POLICY "own data only" ON gears
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── wishlist ────────────────────────────────────────────
ALTER TABLE wishlist
  ADD COLUMN IF NOT EXISTS user_id uuid references auth.users(id) on delete cascade;

DROP POLICY IF EXISTS "allow all" ON wishlist;

CREATE POLICY "own data only" ON wishlist
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── trips ───────────────────────────────────────────────
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS user_id uuid references auth.users(id) on delete cascade;

DROP POLICY IF EXISTS "allow all" ON trips;

CREATE POLICY "own data only" ON trips
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── saved_packs ─────────────────────────────────────────
ALTER TABLE saved_packs
  ADD COLUMN IF NOT EXISTS user_id uuid references auth.users(id) on delete cascade;

DROP POLICY IF EXISTS "allow all" ON saved_packs;

CREATE POLICY "own data only" ON saved_packs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
