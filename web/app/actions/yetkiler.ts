'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import type { Permissions } from '@/lib/yetkiler-types'

async function getAdminProfile() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await admin
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()
  if (!profile?.company_id) return null
  if (!['owner', 'admin'].includes(profile.role ?? '')) return null
  return { ...profile, id: user.id }
}

export async function yetkiGetir(profileId: string): Promise<Permissions | null> {
  const calisan = await getAdminProfile()
  if (!calisan) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('user_permissions')
    .select('permissions')
    .eq('profile_id', profileId)
    .eq('company_id', calisan.company_id)
    .maybeSingle()

  return (data?.permissions as Permissions) ?? null
}

export async function yetkiGuncelle(profileId: string, permissions: Permissions) {
  const calisan = await getAdminProfile()
  if (!calisan) return { error: 'Yetkiniz yok' }

  const admin = createAdminClient()

  const { error } = await admin
    .from('user_permissions')
    .upsert({
      profile_id: profileId,
      company_id: calisan.company_id,
      permissions,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' })

  if (error) return { error: error.message }
  return { success: true }
}
