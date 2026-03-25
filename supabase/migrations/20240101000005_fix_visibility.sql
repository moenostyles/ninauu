ALTER TABLE saved_packs DROP CONSTRAINT IF EXISTS saved_packs_visibility_check;
ALTER TABLE saved_packs ADD CONSTRAINT saved_packs_visibility_check
  CHECK (visibility IN ('public', 'followers', 'private'));

ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_visibility_check;
ALTER TABLE trips ADD CONSTRAINT trips_visibility_check
  CHECK (visibility IN ('public', 'followers', 'private'));
