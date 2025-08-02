
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'officer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE issue_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#ef4444',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE issue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES issue_categories(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_anonymous BOOLEAN DEFAULT false,
  evidence_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_reports ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_select" ON issue_categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_only" ON issue_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);


CREATE POLICY "reports_select" ON issue_reports FOR SELECT USING (true);
CREATE POLICY "reports_insert" ON issue_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reports_update" ON issue_reports FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('officer', 'admin'))
);

CREATE POLICY "reports_delete" ON issue_reports FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('officer', 'admin'))
);


CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON issue_reports
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

INSERT INTO issue_categories (name, description, color) VALUES
  ('Roads', 'Potholes, obstructions, damaged surfaces', '#ef4444'),
  ('Lighting', 'Broken or flickering street lights', '#f59e0b'),
  ('Water Supply', 'Leaks, low pressure, contamination', '#3b82f6'),
  ('Cleanliness', 'Overflowing bins, garbage, litter', '#10b981'),
  ('Public Safety', 'Open manholes, exposed wiring, hazards', '#dc2626'),
  ('Obstructions', 'Fallen trees, debris, blocked paths', '#8b5cf6'),
  ('Drainage', 'Blocked drains, flooding, sewage issues', '#6366f1'),
  ('Public Facilities', 'Broken benches, damaged signs, park issues', '#f97316'),
  ('Other', 'Other infrastructure problems', '#6b7280');

ALTER TABLE issue_reports REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE issue_reports;