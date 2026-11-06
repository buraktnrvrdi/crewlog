-- 1. Tüm check constraint'leri temizle (eski isimli olanlar dahil)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'profiles'::regclass AND contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT ' || r.conname;
  END LOOP;
END $$;

-- 2. Doğru rolleri içeren constraint ekle
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'admin', 'foreman', 'worker'));

-- 3. Kolon default'unu güncelle
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'owner';

-- 4. Eski rolleri yeni sisteme taşı
UPDATE profiles SET role = 'admin' WHERE role = 'manager';
UPDATE profiles SET role = 'admin' WHERE role = 'accountant';

-- 5. Trigger fonksiyonunu RLS bypass edecek şekilde yeniden oluştur
--    SECURITY DEFINER SET search_path = public → auth.uid() NULL olsa bile INSERT çalışır
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Kullanıcı'),
    'owner'
  );
  RETURN NEW;
END;
$$;

-- 6. Trigger'ı yeniden oluştur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
