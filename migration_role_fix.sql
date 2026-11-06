-- Mevcut role check constraint'i kaldır, yeni rolleri ekle
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'admin', 'foreman', 'worker'));

-- Eski rolleri yeni sisteme taşı
UPDATE profiles SET role = 'admin'   WHERE role = 'manager';
UPDATE profiles SET role = 'admin'   WHERE role = 'accountant';

-- handle_new_user trigger: yeni kayıt = role NULL (sirket-kur'da set edilecek)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Kullanıcı'), NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
