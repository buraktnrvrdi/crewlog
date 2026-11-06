'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function sgkKayitEkle(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı' }

  const { data: profile } = await admin
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return { error: 'Şirket bulunamadı' }

  const workerId = formData.get('worker_id') as string
  const startDate = formData.get('start_date') as string
  const endDate = formData.get('end_date') as string || null
  const sgkNo = formData.get('sgk_no') as string || null
  const notes = formData.get('notes') as string || null

  if (!workerId || !startDate) return { error: 'Zorunlu alanlar eksik' }

  const { data: worker } = await admin
    .from('workers').select('id').eq('id', workerId).eq('company_id', profile.company_id).single()
  if (!worker) return { error: 'İşçi bulunamadı' }

  const { error } = await admin.from('worker_sgk').upsert({
    company_id: profile.company_id,
    worker_id: workerId,
    start_date: startDate,
    end_date: endDate,
    sgk_no: sgkNo,
    notes,
  }, { onConflict: 'worker_id,start_date' })

  if (error) return { error: error.message }

  revalidatePath(`/isci-listesi/${workerId}`)
  revalidatePath('/sgk')
  return { success: true }
}

export async function sgkCikisBelirle(id: string, workerId: string, endDate: string) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı' }

  const { data: profile } = await admin
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return { error: 'Şirket bulunamadı' }

  await admin.from('worker_sgk')
    .update({ end_date: endDate })
    .eq('id', id)
    .eq('company_id', profile.company_id)

  revalidatePath(`/isci-listesi/${workerId}`)
  revalidatePath('/sgk')
  return { success: true }
}
