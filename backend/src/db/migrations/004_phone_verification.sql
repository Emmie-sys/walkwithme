CREATE TABLE IF NOT EXISTS phone_verification_challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_e164 TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_phone_challenges_expiry
  ON phone_verification_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_phone_challenges_user_created
  ON phone_verification_challenges(user_id, created_at DESC);
