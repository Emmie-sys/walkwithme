-- Kept separate so existing local databases receive the automatic stop deadline.
ALTER TABLE walks ADD COLUMN location_sharing_ends_at TEXT;
