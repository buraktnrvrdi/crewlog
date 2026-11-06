'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function harcamaEkle(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı' }

  const { data: profile } = await admin
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return { error: 'Şirket bulunamadı' }

  const siteId = formData.get('site_id') as string
  const date = formData.get('date') as string
  const category = formData.get('category') as string
  const description = formData.get('description') as string
  const amount = parseFloat(formData.get('amount') as string)

  if (!siteId || !date || !category || !amount || amount <= 0) return { error: 'Geçersiz veri' }

  const { data: site } = await admin
    .from('sites').select('id').eq('id', siteId).eq('company_id', profile.company_id).single()
  if (!site) return { error: 'Şantiye bulunamadı' }

  const { error } = await admin.from('site_expenses').insert({
    company_id: profile.company_id,
    site_id: siteId,
    date,
    category,
    description: description || null,
    amount,
  })

  if (error) return { error: error.message }

  revalidatePath('/harcamalar')
  revalidatePath(`/santiye-listesi/${siteId}`)
  return { success: true }
}

export async function harcamalariGetir(yil: number, ay: number) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı' }

  const { data: profile } = await admin
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return { error: 'Şirket bulunamadı' }

  const ayBaslangic = new Date(yil, ay - 1, 1).toISOString().split('T')[0]
  const aySonu = new Date(yil, ay, 0).toISOString().split('T')[0]

  const { data } = await admin
    .from('site_expenses')
    .select('*, sites(name)')
    .eq('company_id', profile.company_id)
    .gte('date', ayBaslangic)
    .lte('date', aySonu)
    .order('date', { ascending: false })

  return { data: data ?? [] }
}

export async function harcamaSil(id: string, siteId?: string) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı' }

  const { data: profile } = await admin
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return { error: 'Şirket bulunamadı' }

  await admin.from('site_expenses')
    .delete()
    .eq('id', id)
    .eq('company_id', profile.company_id)

  revalidatePath('/harcamalar')
  if (siteId) revalidatePath(`/santiye-listesi/${siteId}`)
  return { success: true }
}
