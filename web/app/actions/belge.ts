'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function belgeKaydet(workerId: string, type: string, name: string, fileUrl: string, expiresAt?: string) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı' }

  const { data: profile } = await admin
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return { error: 'Şirket bulunamadı' }

  const { data: worker } = await admin
    .from('workers').select('id').eq('id', workerId).eq('company_id', profile.company_id).single()
  if (!worker) return { error: 'İşçi bulunamadı' }

  const { error } = await admin.from('worker_documents').insert({
    company_id: profile.company_id,
    worker_id: workerId,
    type,
    name,
    file_url: fileUrl,
    expires_at: expiresAt || null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/isci-listesi/${workerId}`)
  return { success: true }
}

export async function belgeSil(id: string, workerId: string, fileUrl: string) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı' }

  const { data: profile } = await admin
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return { error: 'Şirket bulunamadı' }

  await admin.from('worker_documents')
    .delete()
    .eq('id', id)
    .eq('company_id', profile.company_id)

  // Storage'dan da sil
  try {
    const path = fileUrl.split('/worker-documents/')[1]
    if (path) await admin.storage.from('worker-documents').remove([path])
  } catch {}

  revalidatePath(`/isci-listesi/${workerId}`)
  return { success: true }
}
