DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id != auth.uid()
  );
