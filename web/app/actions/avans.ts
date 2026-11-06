'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function avansEkle(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı' }

  const { data: profile } = await admin
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return { error: 'Şirket bulunamadı' }

  const workerId = formData.get('worker_id') as string
  const amount = parseFloat(formData.get('amount') as string)
  const description = formData.get('description') as string
  const date = formData.get('date') as string

  if (!workerId || !amount || amount <= 0) return { error: 'Geçersiz veri' }

  const { data: worker } = await admin
    .from('workers').select('id').eq('id', workerId).eq('company_id', profile.company_id).single()
  if (!worker) return { error: 'İşçi bulunamadı' }

  const { error } = await admin.from('advances').insert({
    company_id: profile.company_id,
    worker_id: workerId,
    amount,
    description: description || null,
    date: date || new Date().toISOString().split('T')[0],
    created_by: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath(`/isci-listesi/${workerId}`)
  revalidatePath('/bordro')
  return { success: true }
}

export async function avansSil(id: string, workerId: string) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı' }

  const { data: profile } = await admin
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return { error: 'Şirket bulunamadı' }

  await admin.from('advances')
    .delete()
    .eq('id', id)
    .eq('company_id', profile.company_id)

  revalidatePath(`/isci-listesi/${workerId}`)
  revalidatePath('/bordro')
  return { success: true }
}
