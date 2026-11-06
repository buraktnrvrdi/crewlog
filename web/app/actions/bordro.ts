'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

export async function bordroHesapla(yil: number, ay: number) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı' }

  const { data: profile } = await admin
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return { error: 'Şirket bulunamadı' }

  const baslangic = `${yil}-${String(ay).padStart(2, '0')}-01`
  const bitis = new Date(yil, ay, 0).toISOString().split('T')[0]

  const { data: isciler } = await admin
    .from('workers')
    .select('id, full_name, job_title, daily_wage')
    .eq('company_id', profile.company_id)
    .eq('is_active', true)

  if (!isciler?.length) return { data: [] }

  const { data: puantajlar } = await admin
    .from('timesheets')
    .select('worker_id, status, overtime_hours, date, check_in, check_out')
    .eq('company_id', profile.company_id)
    .gte('date', baslangic)
    .lte('date', bitis)

  const { data: avanslar } = await admin
    .from('advances')
    .select('worker_id, amount')
    .eq('company_id', profile.company_id)
    .gte('date', baslangic)
    .lte('date', bitis)

  const bordro = isciler.map(isci => {
    const kayitlar = puantajlar?.filter(p => p.worker_id === isci.id) ?? []

    const gelenGun = kayitlar.filter(k => k.status === 'present').length
    const fazlaMesaiGun = kayitlar.filter(k => k.status === 'overtime').length
    const yarimGun = kayitlar.filter(k => k.status === 'half_day').length
    const gelmeyenGun = kayitlar.filter(k => k.status === 'absent').length

    // check_in/check_out varsa gerçek saatten fazla mesaiyi hesapla (8 saat üzeri)
    const toplamFazlaMesaiSaat = kayitlar.reduce((sum, k) => {
      if (k.check_in && k.check_out) {
        const calisma = (new Date(k.check_out).getTime() - new Date(k.check_in).getTime()) / 3600000
        return sum + Math.max(0, calisma - 8)
      }
      // QR yoksa manuel girilen overtime_hours kullan
      if (k.status === 'overtime') return sum + (k.overtime_hours ?? 0)
      return sum
    }, 0)

    const gunlukUcret = isci.daily_wage ?? 0
    const saatlikUcret = gunlukUcret / 8

    const normalKazanc = (gelenGun + fazlaMesaiGun) * gunlukUcret
    const yarimGunKazanc = yarimGun * (gunlukUcret / 2)
    const fazlaMesaiKazanc = toplamFazlaMesaiSaat * saatlikUcret * 1.5
    const toplamAvans = avanslar?.filter(a => a.worker_id === isci.id).reduce((s, a) => s + a.amount, 0) ?? 0
    const toplamKazanc = normalKazanc + yarimGunKazanc + fazlaMesaiKazanc - toplamAvans

    return {
      isci_id: isci.id,
      ad_soyad: isci.full_name,
      unvan: isci.job_title,
      gunluk_ucret: gunlukUcret,
      gelen_gun: gelenGun + fazlaMesaiGun,
      yarim_gun: yarimGun,
      gelmeyen_gun: gelmeyenGun,
      fazla_mesai_saat: toplamFazlaMesaiSaat,
      normal_kazanc: normalKazanc + yarimGunKazanc,
      fazla_mesai_kazanc: fazlaMesaiKazanc,
      avans: toplamAvans,
      toplam_kazanc: toplamKazanc,
    }
  })

  return { data: bordro }
}
