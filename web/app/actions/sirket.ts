'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

export async function sirketOlustur(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı' }

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string

  if (!name) return { error: 'Şirket adı zorunludur' }

  const { data: company, error: companyError } = await admin
    .from('companies')
    .insert({ name, phone, address })
    .select()
    .single()

  if (companyError) return { error: companyError.message }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ company_id: company.id, role: 'owner' })
    .eq('id', user.id)

  if (profileError) return { error: profileError.message }

  return { success: true }
}
