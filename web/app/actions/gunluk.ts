'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function gunlukEkle(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı' }

  const { data: profile } = await admin
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return { error: 'Şirket bulunamadı' }

  const siteId = formData.get('site_id') as string
  const date = formData.get('date') as string
  const weather = formData.get('weather') as string
  const workerCount = parseInt(formData.get('worker_count') as string)
  const notes = formData.get('notes') as string

  if (!siteId || !date || !weather) return { error: 'Geçersiz veri' }

  const { data: site } = await admin
    .from('sites').select('id').eq('id', siteId).eq('company_id', profile.company_id).single()
  if (!site) return { error: 'Şantiye bulunamadı' }

  const { error } = await admin.from('site_logs').insert({
    company_id: profile.company_id,
    site_id: siteId,
    date,
    weather,
    worker_count: isNaN(workerCount) ? 0 : workerCount,
    notes: notes || null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/santiye-listesi/${siteId}`)
  return { success: true }
}

export async function gunlukSil(id: string, siteId: string) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı' }

  const { data: profile } = await admin
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return { error: 'Şirket bulunamadı' }

  await admin.from('site_logs')
    .delete()
    .eq('id', id)
    .eq('company_id', profile.company_id)

  revalidatePath(`/santiye-listesi/${siteId}`)
  return { success: true }
}
