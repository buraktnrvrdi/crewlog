-- ============================================================
-- CrewLog — Kapsamlı RLS Migration
-- Her tablo için company_id bazlı güvenlik politikaları
-- ============================================================

-- 1. Yardımcı fonksiyon: mevcut kullanıcının company_id'sini döndürür
--    SECURITY DEFINER + STABLE → her sorguda bir kez çalışır, recursive loop olmaz
CREATE OR REPLACE FUNCTION auth_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- 2. COMPANIES
-- ============================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Kendi şirketini gör" ON companies;
DROP POLICY IF EXISTS "company_access" ON companies;
CREATE POLICY "company_access" ON companies
  FOR ALL USING (id = auth_company_id());

-- ============================================================
-- 3. PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Kendi profilini gör" ON profiles;
DROP POLICY IF EXISTS "own_profile_access" ON profiles;
DROP POLICY IF EXISTS "company_profiles_read" ON profiles;

-- Kullanıcı her zaman kendi profilini yönetebilir (sirket-kur akışı için şart)
CREATE POLICY "own_profile_access" ON profiles
  FOR ALL USING (id = auth.uid());

-- Aynı şirketteki profilleri okuyabilir (çalışanlar listesi için)
CREATE POLICY "company_profiles_read" ON profiles
  FOR SELECT USING (company_id = auth_company_id());

-- ============================================================
-- 4. SITES
-- ============================================================
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Şirket içi şantiye erişimi" ON sites;
DROP POLICY IF EXISTS "company_sites_access" ON sites;
CREATE POLICY "company_sites_access" ON sites
  FOR ALL USING (company_id = auth_company_id());

-- ============================================================
-- 5. WORKERS
-- ============================================================
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Şirket içi işçi erişimi" ON workers;
DROP POLICY IF EXISTS "company_workers_access" ON workers;
CREATE POLICY "company_workers_access" ON workers
  FOR ALL USING (company_id = auth_company_id());

-- ============================================================
-- 6. TIMESHEETS
-- ============================================================
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Şirket içi puantaj erişimi" ON timesheets;
DROP POLICY IF EXISTS "company_timesheets_access" ON timesheets;
CREATE POLICY "company_timesheets_access" ON timesheets
  FOR ALL USING (company_id = auth_company_id());

-- ============================================================
-- 7. INVITATIONS
-- ============================================================
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "company_invitations_access" ON invitations;
CREATE POLICY "company_invitations_access" ON invitations
  FOR ALL USING (company_id = auth_company_id());

-- ============================================================
-- 8. ADVANCES
-- ============================================================
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "company_advances_access" ON advances;
CREATE POLICY "company_advances_access" ON advances
  FOR ALL USING (
    worker_id IN (SELECT id FROM workers WHERE company_id = auth_company_id())
  );

-- ============================================================
-- 9. SITE_EXPENSES
-- ============================================================
ALTER TABLE site_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "company_expenses_access" ON site_expenses;
CREATE POLICY "company_expenses_access" ON site_expenses
  FOR ALL USING (
    site_id IN (SELECT id FROM sites WHERE company_id = auth_company_id())
  );

-- ============================================================
-- 10. SITE_LOGS
-- ============================================================
ALTER TABLE site_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "company_logs_access" ON site_logs;
CREATE POLICY "company_logs_access" ON site_logs
  FOR ALL USING (
    site_id IN (SELECT id FROM sites WHERE company_id = auth_company_id())
  );

-- ============================================================
-- 11. SITE_PHOTOS
-- ============================================================
ALTER TABLE site_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "company_photos_access" ON site_photos;
CREATE POLICY "company_photos_access" ON site_photos
  FOR ALL USING (
    site_id IN (SELECT id FROM sites WHERE company_id = auth_company_id())
  );

-- ============================================================
-- 12. WORKER_DOCUMENTS
-- ============================================================
ALTER TABLE worker_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "company_documents_access" ON worker_documents;
CREATE POLICY "company_documents_access" ON worker_documents
  FOR ALL USING (
    worker_id IN (SELECT id FROM workers WHERE company_id = auth_company_id())
  );

-- ============================================================
-- 13. WORKER_SGK
-- ============================================================
ALTER TABLE worker_sgk ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "company_sgk_access" ON worker_sgk;
CREATE POLICY "company_sgk_access" ON worker_sgk
  FOR ALL USING (
    worker_id IN (SELECT id FROM workers WHERE company_id = auth_company_id())
  );

-- ============================================================
-- 14. USER_PERMISSIONS
-- ============================================================
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Şirket içi yetki erişimi" ON user_permissions;
DROP POLICY IF EXISTS "company_permissions_access" ON user_permissions;
CREATE POLICY "company_permissions_access" ON user_permissions
  FOR ALL USING (company_id = auth_company_id());
