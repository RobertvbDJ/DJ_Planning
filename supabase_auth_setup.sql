-- 1. Create a profiles table to track roles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  role text DEFAULT 'staff' CHECK (role IN ('admin', 'staff'))
);

-- 2. Enable RLS on all tables
ALTER TABLE klanten ENABLE ROW LEVEL SECURITY;
ALTER TABLE apparatuur ENABLE ROW LEVEL SECURITY;
ALTER TABLE taken ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for Profiles
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Create RLS Policies for Klanten
CREATE POLICY "Allow select for authenticated users" ON klanten FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert for authenticated users" ON klanten FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON klanten FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON klanten FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Create RLS Policies for Apparatuur
CREATE POLICY "Allow select for authenticated users" ON apparatuur FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert for authenticated users" ON apparatuur FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON apparatuur FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON apparatuur FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Create RLS Policies for Taken
CREATE POLICY "Allow select for authenticated users" ON taken FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow insert for authenticated users" ON taken FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON taken FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON taken FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Create RLS Policies for Settings
CREATE POLICY "Allow select for authenticated users" ON settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON settings FOR UPDATE USING (auth.role() = 'authenticated');

-- 8. Function to handle new user signup and create a profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'staff');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
