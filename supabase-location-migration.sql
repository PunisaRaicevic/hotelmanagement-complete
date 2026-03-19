-- =========================================================
-- MIGRACIJA: Dodavanje GPS lokacije korisnicima
-- =========================================================
-- Pokrenuti u Supabase SQL Editoru

ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;

-- Indeks za brže pretraživanje korisnika sa lokacijom
CREATE INDEX IF NOT EXISTS idx_users_location ON users (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
