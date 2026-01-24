-- ===========================================
-- ADDITIONAL TABLES FOR HOTEL PARK
-- ===========================================
-- Pokrenite ovaj SQL u Supabase SQL Editor
-- za kreiranje dodatnih tabela koje nedostaju

-- ===========================================
-- DEPARTMENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default departments
INSERT INTO departments (name, description) VALUES
  ('recepcija', 'Recepcija hotela'),
  ('tehnicka', 'Tehnička služba'),
  ('domacinstvo', 'Domaćinstvo'),
  ('kuhinja', 'Kuhinja'),
  ('restoran', 'Restoran'),
  ('spa', 'SPA centar'),
  ('bazen', 'Bazen'),
  ('parking', 'Parking'),
  ('sigurnost', 'Sigurnost')
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- EXTERNAL COMPANIES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS external_companies (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone VARCHAR,
  email TEXT,
  specialty TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- TASK ASSIGNMENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS task_assignments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id VARCHAR NOT NULL,
  assigned_to VARCHAR NOT NULL,
  assigned_to_name TEXT,
  assigned_by VARCHAR NOT NULL,
  assigned_by_name TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unassigned_at TIMESTAMPTZ,
  is_current BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_to ON task_assignments(assigned_to);

-- ===========================================
-- TASK COSTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS task_costs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id VARCHAR NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'EUR',
  added_by VARCHAR NOT NULL,
  added_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_costs_task_id ON task_costs(task_id);

-- ===========================================
-- TASK MESSAGES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS task_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_messages_task_id ON task_messages(task_id);
CREATE INDEX IF NOT EXISTS idx_task_messages_created_at ON task_messages(created_at);

-- ===========================================
-- TASK PHOTOS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS task_photos (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id VARCHAR NOT NULL,
  url TEXT NOT NULL,
  uploaded_by VARCHAR NOT NULL,
  uploaded_by_name TEXT,
  photo_type VARCHAR DEFAULT 'before',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_photos_task_id ON task_photos(task_id);

-- ===========================================
-- TASK TEMPLATES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS task_templates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  priority VARCHAR DEFAULT 'medium',
  department TEXT,
  created_by VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- ===========================================
-- TASK TIMELINE TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS task_timeline (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id VARCHAR NOT NULL,
  event_type VARCHAR NOT NULL,
  event_description TEXT,
  user_id VARCHAR,
  user_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_timeline_task_id ON task_timeline(task_id);

-- ===========================================
-- INVENTORY ITEMS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT DEFAULT 'kom',
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  location TEXT,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);

-- ===========================================
-- INVENTORY REQUESTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS inventory_requests (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  item_id VARCHAR NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  requested_by VARCHAR NOT NULL,
  requested_by_name TEXT,
  status VARCHAR DEFAULT 'pending',
  approved_by VARCHAR,
  approved_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- INVENTORY TRANSACTIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  item_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  quantity INTEGER NOT NULL,
  user_id VARCHAR NOT NULL,
  user_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_id ON inventory_transactions(item_id);

-- ===========================================
-- WORK SESSIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS work_sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL,
  user_name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  tasks_completed INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_start_time ON work_sessions(start_time);

-- ===========================================
-- DAILY STATS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS daily_stats (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date DATE NOT NULL UNIQUE,
  tasks_created INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_pending INTEGER DEFAULT 0,
  tasks_in_progress INTEGER DEFAULT 0,
  avg_completion_time_minutes INTEGER,
  active_technicians INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);

-- ===========================================
-- GUEST REPORTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS guest_reports (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  room_number VARCHAR,
  guest_name TEXT,
  report_type VARCHAR,
  description TEXT NOT NULL,
  status VARCHAR DEFAULT 'new',
  priority VARCHAR DEFAULT 'medium',
  task_id VARCHAR,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- SERVICE RATINGS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS service_ratings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id VARCHAR NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  rated_by VARCHAR,
  rated_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_ratings_task_id ON service_ratings(task_id);

-- ===========================================
-- USER ACTIVITY LOG TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS user_activity_log (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);

-- ===========================================
-- USER SESSIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL,
  token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);

-- ===========================================
-- MAINTENANCE PLANS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS maintenance_plans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  frequency VARCHAR NOT NULL,
  last_executed_at TIMESTAMPTZ,
  next_scheduled_at TIMESTAMPTZ,
  assigned_to VARCHAR,
  assigned_to_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- SESSION TABLE (Express sessions)
-- ===========================================
CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);

-- ===========================================
-- ENABLE ROW LEVEL SECURITY
-- ===========================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE session ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS POLICIES - Service role full access
-- ===========================================
CREATE POLICY "Service role full access on departments" ON departments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on external_companies" ON external_companies FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on task_assignments" ON task_assignments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on task_costs" ON task_costs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on task_messages" ON task_messages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on task_photos" ON task_photos FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on task_templates" ON task_templates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on task_timeline" ON task_timeline FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on inventory_items" ON inventory_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on inventory_requests" ON inventory_requests FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on inventory_transactions" ON inventory_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on work_sessions" ON work_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on daily_stats" ON daily_stats FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on guest_reports" ON guest_reports FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on service_ratings" ON service_ratings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on user_activity_log" ON user_activity_log FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on user_sessions" ON user_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on maintenance_plans" ON maintenance_plans FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access on session" ON session FOR ALL USING (auth.role() = 'service_role');

-- ===========================================
-- VERIFIKACIJA
-- ===========================================
-- Pokrenite ovo da provjerite sve tabele:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
