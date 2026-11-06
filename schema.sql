-- ============================================
-- ŞantiyeApp — Veritabanı Şeması (MVP v1)
-- ============================================

-- Şirketler (her müteahhit = bir tenant)
CREATE TABLE companies (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT,
  address    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kullanıcı profilleri (Supabase auth ile bağlantılı)
CREATE TABLE profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  full_name  TEXT NOT NULL,
  phone      TEXT,
  role       TEXT CHECK (role IN ('owner', 'admin', 'foreman', 'worker')) DEFAULT 'worker',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Şantiyeler
CREATE TABLE sites (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  address    TEXT,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- İşçiler
CREATE TABLE workers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  full_name   TEXT NOT NULL,
  phone       TEXT,
  tc_no       TEXT,
  job_title   TEXT DEFAULT 'İşçi',
  daily_wage  NUMERIC(10,2) DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  qr_code     TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Puantaj kayıtları
CREATE TABLE timesheets (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  site_id      UUID REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  worker_id    UUID REFERENCES workers(id) ON DELETE CASCADE NOT NULL,
  date         DATE NOT NULL,
  check_in     TIMESTAMPTZ,
  check_out    TIMESTAMPTZ,
  status       TEXT CHECK (status IN ('present', 'absent', 'half_day', 'overtime')) DEFAULT 'present',
  overtime_hours NUMERIC(4,2) DEFAULT 0,
  approved_by  UUID REFERENCES profiles(id),
  approved_at  TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, date, site_id)
);

-- ============================================
-- Row Level Security (çok kiracılı güvenlik)
-- ============================================

ALTER TABLE companies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites       ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets  ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi şirketini görebilir
CREATE POLICY "Kendi şirketini gör" ON companies
  FOR ALL USING (
    id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Kullanıcı kendi profilini yönetir
CREATE POLICY "Kendi profilini gör" ON profiles
  FOR ALL USING (id = auth.uid());

-- Aynı şirketteki kullanıcılar aynı şantiyeyi görebilir
CREATE POLICY "Şirket içi şantiye erişimi" ON sites
  FOR ALL USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Aynı şirketteki kullanıcılar işçileri görebilir
CREATE POLICY "Şirket içi işçi erişimi" ON workers
  FOR ALL USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Aynı şirketteki kullanıcılar puantajı görebilir
CREATE POLICY "Şirket içi puantaj erişimi" ON timesheets
  FOR ALL USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================
-- Yeni kayıt sonrası otomatik profil oluştur
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Kullanıcı'), 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
