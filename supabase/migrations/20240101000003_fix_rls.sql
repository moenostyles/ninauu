-- ── user_id が NULL のデータを削除（シードデータ・移行前データ） ─────────────
DELETE FROM saved_pack_items
WHERE pack_id IN (
  SELECT id FROM saved_packs WHERE user_id IS NULL
);

DELETE FROM trip_items
WHERE trip_id IN (
  SELECT id FROM trips WHERE user_id IS NULL
);

DELETE FROM saved_packs WHERE user_id IS NULL;
DELETE FROM trips       WHERE user_id IS NULL;
DELETE FROM wishlist    WHERE user_id IS NULL;
DELETE FROM gears       WHERE user_id IS NULL;

-- ── gears: SELECT を自分のデータのみに制限 ────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own gears" ON gears;
DROP POLICY IF EXISTS "gears_select" ON gears;

CREATE POLICY "gears_select"
  ON gears FOR SELECT
  USING (user_id = auth.uid());

-- ── wishlist: SELECT を自分のデータのみに制限 ─────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own wishlist" ON wishlist;
DROP POLICY IF EXISTS "wishlist_select" ON wishlist;

CREATE POLICY "wishlist_select"
  ON wishlist FOR SELECT
  USING (user_id = auth.uid());

-- ── saved_packs: SELECT を自分 or public or followers に制限（既存を上書き） ──
DROP POLICY IF EXISTS "saved_packs_select" ON saved_packs;

CREATE POLICY "saved_packs_select"
  ON saved_packs FOR SELECT
  USING (
    user_id = auth.uid()
    OR visibility = 'public'
    OR (
      visibility = 'followers'
      AND EXISTS (
        SELECT 1 FROM follows
        WHERE follower_id = auth.uid() AND following_id = saved_packs.user_id
      )
    )
  );

-- ── saved_pack_items: SELECT を自分のパック or 公開パックに制限 ───────────────
DROP POLICY IF EXISTS "Users can view their own saved pack items" ON saved_pack_items;
DROP POLICY IF EXISTS "saved_pack_items_select" ON saved_pack_items;

CREATE POLICY "saved_pack_items_select"
  ON saved_pack_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM saved_packs sp
      WHERE sp.id = saved_pack_items.pack_id
        AND (
          sp.user_id = auth.uid()
          OR sp.visibility = 'public'
          OR (
            sp.visibility = 'followers'
            AND EXISTS (
              SELECT 1 FROM follows
              WHERE follower_id = auth.uid() AND following_id = sp.user_id
            )
          )
        )
    )
  );

-- ── trips: SELECT を自分 or public or followers に制限（既存を上書き） ─────────
DROP POLICY IF EXISTS "trips_select" ON trips;

CREATE POLICY "trips_select"
  ON trips FOR SELECT
  USING (
    user_id = auth.uid()
    OR visibility = 'public'
    OR (
      visibility = 'followers'
      AND EXISTS (
        SELECT 1 FROM follows
        WHERE follower_id = auth.uid() AND following_id = trips.user_id
      )
    )
  );

-- ── trip_items: SELECT を自分のトリップ or 公開トリップに制限 ─────────────────
DROP POLICY IF EXISTS "Users can view their own trip items" ON trip_items;
DROP POLICY IF EXISTS "trip_items_select" ON trip_items;

CREATE POLICY "trip_items_select"
  ON trip_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id = trip_items.trip_id
        AND (
          t.user_id = auth.uid()
          OR t.visibility = 'public'
          OR (
            t.visibility = 'followers'
            AND EXISTS (
              SELECT 1 FROM follows
              WHERE follower_id = auth.uid() AND following_id = t.user_id
            )
          )
        )
    )
  );
