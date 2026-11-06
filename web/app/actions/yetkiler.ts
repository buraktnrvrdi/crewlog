'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

export type Permissions = {
  isci_goruntule: boolean
  isci_duzenle: boolean
  isci_sil: boolean
  santiye_goruntule: boolean
  santiye_duzenle: boolean
  santiye_sil: boolean
  puantaj_goruntule: boolean
  puantaj_gir: boolean
  qr_tara: boolean
  avans_goruntule: boolean
  avans_yonet: boolean
  belge_goruntule: boolean
  belge_yonet: boolean
  sgk_goruntule: boolean
  harcama_goruntule: boolean
  harcama_ekle: boolean
  bordro_goruntule: boolean
  rapor_goruntule: boolean
  davet_olustur: boolean
}

export const VARSAYILAN_FOREMAN: Permissions = {
  isci_goruntule: true,
  isci_duzenle: false,
  isci_sil: false,
  santiye_goruntule: true,
  santiye_duzenle: false,
  santiye_sil: false,
  puantaj_goruntule: true,
  puantaj_gir: true,
  qr_tara: true,
  avans_goruntule: true,
  avans_yonet: false,
  belge_goruntule: true,
  belge_yonet: false,
  sgk_goruntule: false,
  harcama_goruntule: true,
  harcama_ekle: true,
  bordro_goruntule: false,
  rapor_goruntule: true,
  davet_olustur: false,
}

export const VARSAYILAN_WORKER: Permissions = {
  isci_goruntule: false,
  isci_duzenle: false,
  isci_sil: false,
  santiye_goruntule: true,
  santiye_duzenle: false,
  santiye_sil: false,
  puantaj_goruntule: true,
  puantaj_gir: false,
  qr_tara: true,
  avans_goruntule: true,
  avans_yonet: false,
  belge_goruntule: true,
  belge_yonet: false,
  sgk_goruntule: false,
  harcama_goruntule: false,
  harcama_ekle: false,
  bordro_goruntule: false,
  rapor_goruntule: false,
  davet_olustur: false,
}

async function getAdminProfile() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await admin
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.company_id) return null
  if (!['owner', 'admin'].includes(profile.role ?? '')) return null
  return { ...profile, id: user.id }
}

export async function calısanlarGetir() {
  const admin = createAdminClient()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await admin
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id || !['owner', 'admin'].includes(profile.role ?? '')) return []

  const { data } = await admin
    .from('profiles')
    .select('id, full_name, role, avatar_color')
    .eq('company_id', profile.company_id)
    .neq('id', user.id)
    .order('full_name')

  return data ?? []
}

export async function yetkiGetir(profileId: string): Promise<Permissions | null> {
  const calisan = await getAdminProfile()
  if (!calisan) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('user_permissions')
    .select('permissions')
    .eq('profile_id', profileId)
    .eq('company_id', calisan.company_id)
    .single()

  return (data?.permissions as Permissions) ?? null
}

export async function yetkiGuncelle(profileId: string, permissions: Permissions) {
  const calisan = await getAdminProfile()
  if (!calisan) return { error: 'Yetkiniz yok' }

  const admin = createAdminClient()

  const { error } = await admin
    .from('user_permissions')
    .upsert({
      profile_id: profileId,
      company_id: calisan.company_id,
      permissions,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' })

  if (error) return { error: error.message }
  return { success: true }
}
