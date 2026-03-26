-- Share URL: saved_packs に share_id を追加
-- https://ninauu.vercel.app/shared/{share_id} でログイン不要閲覧を想定

ALTER TABLE saved_packs
  ADD COLUMN IF NOT EXISTS share_id TEXT UNIQUE DEFAULT NULL;

-- share_id が設定された pack は誰でも読める（ログイン不要）
CREATE POLICY "Public read by share_id" ON saved_packs
  FOR SELECT USING (share_id IS NOT NULL);

-- trips にも同様に share_id を追加
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS share_id TEXT UNIQUE DEFAULT NULL;

CREATE POLICY "Public read trips by share_id" ON trips
  FOR SELECT USING (share_id IS NOT NULL);

-- share_id 生成用の関数（nanoid 風、7文字）
CREATE OR REPLACE FUNCTION generate_share_id() RETURNS TEXT LANGUAGE sql AS $$
  SELECT substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 7);
$$;
