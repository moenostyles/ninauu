-- ── notifications テーブル ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text NOT NULL,           -- 'follow'
  actor_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read       boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark own notifications as read"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ── フォロー時に通知を自動作成するトリガー ────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, actor_id)
  VALUES (NEW.following_id, 'follow', NEW.follower_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_created ON follows;
CREATE TRIGGER on_follow_created
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION handle_new_follow();

-- ── アンフォロー時に通知を削除 ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_delete_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE user_id = OLD.following_id
    AND actor_id = OLD.follower_id
    AND type = 'follow';
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_deleted ON follows;
CREATE TRIGGER on_follow_deleted
  AFTER DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION handle_delete_follow();
