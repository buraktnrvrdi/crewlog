'use server'
// RUN THIS SQL IN SUPABASE:
// CREATE TABLE IF NOT EXISTS site_photos (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   site_id uuid REFERENCES sites(id) ON DELETE CASCADE,
//   company_id uuid REFERENCES companies(id),
//   url text NOT NULL,
//   caption text,
//   created_at timestamptz DEFAULT now()
// );
// CREATE STORAGE BUCKET "site-photos" (public) in Supabase dashboard

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function fotoGetir(siteId: string) {
  const admin = createAdminClient()
  const { data } = await admin.from('site_photos').select('*').eq('site_id', siteId).order('created_at', { ascending: false })
  return data ?? []
}

export async function fotoKaydet(siteId: string, url: string, caption: string) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı' }
  const { data: profile } = await admin.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return { error: 'Şirket bulunamadı' }
  const { error } = await admin.from('site_photos').insert({ site_id: siteId, company_id: profile.company_id, url, caption: caption || null })
  if (error) return { error: error.message }
  revalidatePath(`/santiye-listesi/${siteId}`)
  return { success: true }
}

export async function fotoSil(id: string, siteId: string) {
  const admin = createAdminClient()
  await admin.from('site_photos').delete().eq('id', id)
  revalidatePath(`/santiye-listesi/${siteId}`)
  return { success: true }
}
