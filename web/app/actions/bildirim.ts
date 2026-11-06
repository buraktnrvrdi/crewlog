'use server'
import { createAdminClient } from '@/lib/supabase-admin'

export type Bildirim = { id: string; tip: 'uyari' | 'bilgi'; mesaj: string }

export async function getBildirimler(companyId: string): Promise<Bildirim[]> {
  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const bildirimler: Bildirim[] = []

  // Check if today has any timesheet records
  const { count: bugunKayit } = await admin.from('timesheets').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('date', today)
  if ((bugunKayit ?? 0) === 0) {
    bildirimler.push({ id: 'no-puantaj', tip: 'uyari', mesaj: 'Bugün henüz puantaj girilmedi' })
  }

  // Check workers with no timesheet in last 7 days
  const yediGunOnce = new Date()
  yediGunOnce.setDate(yediGunOnce.getDate() - 7)
  const { data: aktifIsciler } = await admin.from('workers').select('id').eq('company_id', companyId).eq('is_active', true)
  const { data: haftaKayitlar } = await admin.from('timesheets').select('worker_id').eq('company_id', companyId).gte('date', yediGunOnce.toISOString().split('T')[0])
  const kayitliIds = new Set((haftaKayitlar ?? []).map(k => k.worker_id))
  const kayitsizSayisi = (aktifIsciler ?? []).filter(i => !kayitliIds.has(i.id)).length
  if (kayitsizSayisi > 0) {
    bildirimler.push({ id: 'missing-workers', tip: 'uyari', mesaj: `${kayitsizSayisi} işçi bu hafta hiç kayıt yok` })
  }

  // Check sites with no activity last 7 days
  const { data: aktifSites } = await admin.from('sites').select('id, name').eq('company_id', companyId).eq('is_active', true)
  const { data: siteActivity } = await admin.from('timesheets').select('site_id').eq('company_id', companyId).gte('date', yediGunOnce.toISOString().split('T')[0])
  const aktifSiteIds = new Set((siteActivity ?? []).map(s => s.site_id))
  const sessizSantiye = (aktifSites ?? []).filter(s => !aktifSiteIds.has(s.id))
  if (sessizSantiye.length > 0) {
    bildirimler.push({ id: 'inactive-sites', tip: 'bilgi', mesaj: `${sessizSantiye.length} şantiyede son 7 günde işlem yok` })
  }

  return bildirimler
}
