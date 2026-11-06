'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

async function getProfile() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await admin
    .from('profiles')
    .select('company_id, id, role')
    .eq('id', user.id)
    .single()
  return profile
}

function kodUret(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let kod = ''
  for (let i = 0; i < 6; i++) kod += chars[Math.floor(Math.random() * chars.length)]
  return kod
}

export async function davetOlustur(rol: 'admin' | 'foreman' | 'worker', workerId?: string) {
  const profile = await getProfile()
  if (!profile?.company_id) return { error: 'Oturum bulunamadı' }

  const admin = createAdminClient()

  let kod = kodUret()
  let deneme = 0
  while (deneme < 5) {
    const { data: mevcut } = await admin.from('invitations').select('id').eq('code', kod).single()
    if (!mevcut) break
    kod = kodUret()
    deneme++
  }

  const { data, error } = await admin.from('invitations').insert({
    company_id: profile.company_id,
    code: kod,
    role: rol,
    created_by: profile.id,
    worker_id: workerId ?? null,
  }).select().single()

  if (error) return { error: error.message }
  return { success: true, kod: data.code }
}

export async function davetleriGetir() {
  const profile = await getProfile()
  if (!profile?.company_id) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('invitations')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })
    .limit(20)

  return data ?? []
}

export async function davetSil(id: string) {
  const profile = await getProfile()
  if (!profile?.company_id) return { error: 'Oturum bulunamadı' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('invitations')
    .delete()
    .eq('id', id)
    .eq('company_id', profile.company_id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function davetKullan(kod: string, userId: string) {
  const admin = createAdminClient()

  const { data: davet } = await admin
    .from('invitations')
    .select('*')
    .eq('code', kod.toUpperCase().trim())
    .single()

  if (!davet) return { error: 'Geçersiz davet kodu' }
  if (new Date(davet.expires_at) < new Date()) return { error: 'Davet kodunun süresi dolmuş' }
  if (davet.use_count >= davet.max_uses) return { error: 'Bu davet kodu maksimum kullanım sayısına ulaştı' }

  const { error } = await admin
    .from('profiles')
    .update({
      company_id: davet.company_id,
      role: davet.role,
      worker_id: davet.worker_id ?? null,
    })
    .eq('id', userId)

  if (error) return { error: error.message }

  // Kullanım sayısını artır
  await admin
    .from('invitations')
    .update({ use_count: davet.use_count + 1 })
    .eq('id', davet.id)

  return { success: true }
}
