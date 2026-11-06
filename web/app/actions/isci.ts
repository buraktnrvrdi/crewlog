'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

async function getCompanyId() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await admin
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()
  return profile?.company_id ?? null
}

export async function isciEkle(formData: FormData) {
  const companyId = await getCompanyId()
  if (!companyId) return { error: 'Oturum bulunamadı' }

  const name = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const tc_no = formData.get('tc_no') as string
  const job_title = formData.get('job_title') as string
  const daily_wage = parseFloat(formData.get('daily_wage') as string) || 0

  if (!name) return { error: 'Ad soyad zorunludur' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('workers')
    .insert({ full_name: name, phone, tc_no, job_title, daily_wage, company_id: companyId })

  if (error) return { error: error.message }
  return { success: true }
}

export async function isciGuncelle(workerId: string, formData: FormData) {
  const companyId = await getCompanyId()
  if (!companyId) return { error: 'Oturum bulunamadı' }

  const admin = createAdminClient()

  const { data: worker } = await admin
    .from('workers')
    .select('company_id')
    .eq('id', workerId)
    .single()

  if (!worker || worker.company_id !== companyId) return { error: 'Yetkisiz işlem' }

  const name = formData.get('full_name') as string
  if (!name) return { error: 'Ad soyad zorunludur' }

  const { error } = await admin
    .from('workers')
    .update({
      full_name: name,
      phone: formData.get('phone') as string || null,
      tc_no: formData.get('tc_no') as string || null,
      job_title: formData.get('job_title') as string || null,
      daily_wage: parseFloat(formData.get('daily_wage') as string) || 0,
    })
    .eq('id', workerId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function isciDurumGuncelle(workerId: string, isActive: boolean) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('workers')
    .update({ is_active: isActive })
    .eq('id', workerId)
  if (error) return { error: error.message }
  return { success: true }
}
