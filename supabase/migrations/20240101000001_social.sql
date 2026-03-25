-- ── Profiles table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    text UNIQUE,
  display_name text,
  avatar_url  text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ── Auto-create profile on signup ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Follows table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  follower_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ── Update visibility CHECK constraints to include 'followers' ───────────────
ALTER TABLE saved_packs
  DROP CONSTRAINT IF EXISTS saved_packs_visibility_check;
ALTER TABLE saved_packs
  ADD CONSTRAINT saved_packs_visibility_check
  CHECK (visibility IN ('public', 'followers', 'private'));

ALTER TABLE trips
  DROP CONSTRAINT IF EXISTS trips_visibility_check;
ALTER TABLE trips
  ADD CONSTRAINT trips_visibility_check
  CHECK (visibility IN ('public', 'followers', 'private'));

-- ── Update RLS for saved_packs (followers visibility) ───────────────────────
DROP POLICY IF EXISTS "Users can view their own saved packs" ON saved_packs;
DROP POLICY IF EXISTS "Public packs are visible to all" ON saved_packs;

CREATE POLICY "saved_packs_select"
  ON saved_packs FOR SELECT USING (
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

-- ── Update RLS for trips (followers visibility) ──────────────────────────────
DROP POLICY IF EXISTS "Users can view their own trips" ON trips;
DROP POLICY IF EXISTS "Public trips are visible to all" ON trips;

CREATE POLICY "trips_select"
  ON trips FOR SELECT USING (
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

-- ── Backfill profiles for existing users ────────────────────────────────────
INSERT INTO public.profiles (id, display_name, avatar_url)
SELECT
  id,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
