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
  if (!['owner', 'admin'].includes(profile.role ?? '')) return { error: 'Yetkiniz yok' }

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
    max_uses: rol === 'worker' ? 1 : 20,
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

  const { data: mevcutProfil } = await admin
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .single()

  if (mevcutProfil?.company_id) return { error: 'Zaten bir şirkete kayıtlısınız' }

  const { data: davet } = await admin
    .from('invitations')
    .select('*')
    .eq('code', kod.toUpperCase().trim())
    .single()

  if (!davet) return { error: 'Geçersiz davet kodu' }
  if (new Date(davet.expires_at) < new Date()) return { error: 'Davet kodunun süresi dolmuş' }

  // Atomik artırım: use_count < max_uses koşulu sağlanırsa güncelle
  const { data: updated } = await admin
    .from('invitations')
    .update({ use_count: davet.use_count + 1 })
    .eq('id', davet.id)
    .lt('use_count', davet.max_uses)
    .select('id')

  if (!updated || updated.length === 0) return { error: 'Bu davet kodu maksimum kullanım sayısına ulaştı' }

  const rolMap: Record<string, string> = { admin: 'admin', foreman: 'foreman', worker: 'worker' }
  const dbRol = rolMap[davet.role] ?? davet.role

  // Profil yoksa oluştur, varsa güncelle (trigger kapalıyken kayıt olanlar için)
  const { data: authUser } = await admin.auth.admin.getUserById(userId)
  const fullName = authUser?.user?.user_metadata?.full_name ?? 'Kullanıcı'

  const { error } = await admin
    .from('profiles')
    .upsert({
      id: userId,
      full_name: fullName,
      company_id: davet.company_id,
      role: dbRol,
      worker_id: davet.worker_id ?? null,
    }, { onConflict: 'id' })

  if (error) {
    await admin.from('invitations').update({ use_count: davet.use_count }).eq('id', davet.id)
    return { error: error.message }
  }

  return { success: true }
}
