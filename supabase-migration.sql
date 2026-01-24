-- ===========================================
-- SUPABASE MIGRATION - HGBRTehnickaSluzba
-- ===========================================
-- Pokrenite ovaj SQL u Supabase SQL Editor
-- za kreiranje svih potrebnih tabela

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- USERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role VARCHAR NOT NULL,
  job_title TEXT,
  department TEXT,
  phone VARCHAR,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  shift TEXT,
  push_token TEXT,
  onesignal_player_id TEXT,
  fcm_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index za brze pretrage
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ===========================================
-- USER DEVICE TOKENS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS user_device_tokens (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL,
  fcm_token TEXT NOT NULL UNIQUE,
  platform TEXT,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_user_device_tokens_user_id ON user_device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_device_tokens_fcm_token ON user_device_tokens(fcm_token);

-- ===========================================
-- TASKS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  room_number VARCHAR,
  priority VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  created_by VARCHAR NOT NULL,
  created_by_name TEXT NOT NULL,
  created_by_department TEXT NOT NULL,
  operator_id VARCHAR,
  operator_name TEXT,
  assigned_to TEXT,
  assigned_to_name TEXT,
  assigned_to_type VARCHAR,
  receipt_confirmed_at TIMESTAMPTZ,
  receipt_confirmed_by VARCHAR,
  receipt_confirmed_by_name TEXT,
  sef_id VARCHAR,
  sef_name TEXT,
  external_company_id VARCHAR,
  external_company_name TEXT,
  deadline_at TIMESTAMPTZ,
  is_overdue BOOLEAN NOT NULL DEFAULT false,
  estimated_arrival_time TIMESTAMPTZ,
  actual_arrival_time TIMESTAMPTZ,
  estimated_completion_time TIMESTAMPTZ,
  actual_completion_time TIMESTAMPTZ,
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  completed_by VARCHAR,
  completed_by_name TEXT,
  images TEXT[],
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_pattern VARCHAR DEFAULT 'once',
  recurrence_start_date TIMESTAMPTZ,
  next_occurrence TIMESTAMPTZ,
  recurrence_week_days INTEGER[],
  recurrence_month_days INTEGER[],
  recurrence_year_dates JSONB,
  execution_hour INTEGER,
  execution_minute INTEGER,
  parent_task_id VARCHAR,
  scheduled_for TIMESTAMPTZ,
  worker_report TEXT,
  worker_images TEXT[]
);

-- Indexi za tasks
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_sef_id ON tasks(sef_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_for ON tasks(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_tasks_is_recurring ON tasks(is_recurring);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);

-- ===========================================
-- TASK HISTORY TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS task_history (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  original_message TEXT,
  notes TEXT,
  status_from VARCHAR,
  status_to VARCHAR,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_to TEXT,
  assigned_to_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_user_id ON task_history(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_timestamp ON task_history(timestamp);

-- ===========================================
-- NOTIFICATIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL,
  task_id VARCHAR,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_task_id ON notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================
-- Omogucite RLS za sve tabele
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politika: Service role ima pun pristup (za backend)
CREATE POLICY "Service role full access on users" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on user_device_tokens" ON user_device_tokens
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on tasks" ON tasks
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on task_history" ON task_history
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on notifications" ON notifications
  FOR ALL USING (auth.role() = 'service_role');

-- ===========================================
-- TRIGGER ZA UPDATED_AT
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- KREIRANJE ADMIN KORISNIKA
-- ===========================================
-- VAZNO: Promijenite lozinku prije pokretanja!
-- Generisete hash sa: https://bcrypt-generator.com/
-- ili koristite bcrypt.hashSync('VasaLozinka', 10)

-- Primjer za lozinku "Admin123!" (PROMIJENITE!)
-- Hash za "Admin123!": $2a$10$rQnM1vF8y5h5Z5Z5Z5Z5ZOxxxxxxxxxxxxxxxxxxxxxxxxxxx

/*
INSERT INTO users (username, email, full_name, role, department, password_hash, is_active)
VALUES (
  'admin',
  'admin@hotel.com',
  'Administrator Sistema',
  'admin',
  'tehnicka',
  '$2a$10$ZAMIJENITE_SA_PRAVIM_HASH',
  true
);
*/

-- ===========================================
-- VERIFIKACIJA
-- ===========================================
-- Pokrenite ovo da provjerite da li su tabele kreirane:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
