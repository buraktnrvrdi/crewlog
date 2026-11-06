-- Kullanıcı yetkileri tablosu
CREATE TABLE IF NOT EXISTS user_permissions (
  profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Yönetici kendi şirketindeki yetkileri yönetebilir
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Şirket içi yetki erişimi" ON user_permissions
  FOR ALL USING (
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );
