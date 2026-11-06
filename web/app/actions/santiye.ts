'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

export async function santiyeEkle(formData: FormData) {
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

  const name = formData.get('name') as string
  const address = formData.get('address') as string

  if (!name) return { error: 'Şantiye adı zorunludur' }

  const { error } = await admin
    .from('sites')
    .insert({ name, address, company_id: profile.company_id })

  if (error) return { error: error.message }

  return { success: true }
}

export async function santiyeleriGetir(companyId: string) {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('sites')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

export async function santiyeGuncelle(siteId: string, formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı' }

  const { data: profile } = await admin.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return { error: 'Şirket bulunamadı' }

  const { data: site } = await admin.from('sites').select('company_id').eq('id', siteId).single()
  if (!site || site.company_id !== profile.company_id) return { error: 'Yetkisiz işlem' }

  const name = formData.get('name') as string
  if (!name) return { error: 'Şantiye adı zorunludur' }

  const { error } = await admin
    .from('sites')
    .update({ name, address: formData.get('address') as string || null })
    .eq('id', siteId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function santiyeDurumGuncelle(siteId: string, isActive: boolean) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('sites')
    .update({ is_active: isActive })
    .eq('id', siteId)

  if (error) return { error: error.message }
  return { success: true }
}
