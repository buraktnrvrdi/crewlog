'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

async function getUser() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await admin
    .from('profiles')
    .select('company_id, id')
    .eq('id', user.id)
    .single()
  return profile
}

export async function puantajKaydet(entries: {
  worker_id: string
  site_id: string
  date: string
  status: 'present' | 'absent' | 'half_day' | 'overtime'
  overtime_hours?: number
}[]) {
  const profile = await getUser()
  if (!profile?.company_id) return { error: 'Oturum bulunamadı' }

  const admin = createAdminClient()

  const rows = entries.map(e => ({
    ...e,
    company_id: profile.company_id,
    approved_by: profile.id,
    approved_at: new Date().toISOString(),
  }))

  const { error } = await admin
    .from('timesheets')
    .upsert(rows, { onConflict: 'worker_id,date,site_id' })

  if (error) return { error: error.message }
  return { success: true }
}

export async function puantajGetir(companyId: string, siteId: string, date: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('timesheets')
    .select('worker_id, status, overtime_hours, check_in, check_out')
    .eq('company_id', companyId)
    .eq('site_id', siteId)
    .eq('date', date)
  return data ?? []
}

export async function puantajAylikOzet(companyId: string, siteId: string, year: number, month: number) {
  const admin = createAdminClient()
  const start = `${year}-${String(month).padStart(2,'0')}-01`
  const end = new Date(year, month, 0).toISOString().split('T')[0] // last day of month
  const { data } = await admin
    .from('timesheets')
    .select('date')
    .eq('company_id', companyId)
    .eq('site_id', siteId)
    .gte('date', start)
    .lte('date', end)
  return [...new Set((data ?? []).map(r => r.date))] as string[]
}
