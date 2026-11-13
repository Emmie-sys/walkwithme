-- Add user roles and the data required by safety, discovery, and ride workflows.
-- Live GPS is deliberately not stored on users. Active walk fixes have explicit expiry.
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student'
  CHECK (role IN ('student', 'transporter', 'admin'));
ALTER TABLE users ADD COLUMN phone_e164 TEXT;
ALTER TABLE users ADD COLUMN phone_verified_at TEXT;
ALTER TABLE users ADD COLUMN saved_start_label TEXT;
ALTER TABLE users ADD COLUMN saved_start_latitude REAL;
ALTER TABLE users ADD COLUMN saved_start_longitude REAL;
ALTER TABLE walks ADD COLUMN origin_label TEXT;
ALTER TABLE walks ADD COLUMN origin_latitude REAL;
ALTER TABLE walks ADD COLUMN origin_longitude REAL;
ALTER TABLE walks ADD COLUMN destination_label TEXT;
ALTER TABLE walks ADD COLUMN destination_latitude REAL;
ALTER TABLE walks ADD COLUMN destination_longitude REAL;
ALTER TABLE walks ADD COLUMN arrived_at TEXT;
ALTER TABLE walks ADD COLUMN location_sharing_ends_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_verified_phone
  ON users(phone_e164) WHERE phone_e164 IS NOT NULL AND phone_verified_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS location_updates (
  id TEXT PRIMARY KEY,
  walk_id TEXT NOT NULL REFERENCES walks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180),
  accuracy_meters REAL,
  captured_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_location_updates_walk_expiry
  ON location_updates(walk_id, expires_at, captured_at DESC);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role_label TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  availability TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_development_fixture INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS safe_spots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180),
  address TEXT,
  contact_phone TEXT,
  hours TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','closed','rejected')),
  is_development_fixture INTEGER NOT NULL DEFAULT 0,
  verified_by TEXT REFERENCES users(id),
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_safe_spots_status ON safe_spots(status, name);

CREATE TABLE IF NOT EXISTS unsafe_reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK(report_type IN ('place','route','area')),
  category TEXT NOT NULL,
  description TEXT,
  geometry_json TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'friends' CHECK(visibility IN ('friends','campus')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','expired')),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TEXT,
  review_note TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_unsafe_reports_status_time
  ON unsafe_reports(status, created_at DESC);
CREATE TABLE IF NOT EXISTS unsafe_report_events (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL REFERENCES unsafe_reports(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transporters (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  vehicle_description TEXT NOT NULL,
  service_area TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','suspended','rejected')),
  is_available INTEGER NOT NULL DEFAULT 0,
  is_development_fixture INTEGER NOT NULL DEFAULT 0,
  verified_by TEXT REFERENCES users(id),
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ride_bookings (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id),
  transporter_id TEXT NOT NULL REFERENCES users(id),
  pickup_label TEXT NOT NULL,
  pickup_latitude REAL NOT NULL CHECK(pickup_latitude BETWEEN -90 AND 90),
  pickup_longitude REAL NOT NULL CHECK(pickup_longitude BETWEEN -180 AND 180),
  destination_label TEXT NOT NULL,
  destination_latitude REAL NOT NULL CHECK(destination_latitude BETWEEN -90 AND 90),
  destination_longitude REAL NOT NULL CHECK(destination_longitude BETWEEN -180 AND 180),
  pickup_at TEXT NOT NULL,
  passenger_count INTEGER NOT NULL DEFAULT 1 CHECK(passenger_count BETWEEN 1 AND 8),
  note TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','accepted','declined','cancelled','completed')),
  accepted_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rides_student_time ON ride_bookings(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rides_transporter_status ON ride_bookings(transporter_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS ride_booking_events (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES ride_bookings(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);
