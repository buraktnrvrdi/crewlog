'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function profilGuncelle(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı' }

  const full_name = (formData.get('full_name') as string)?.trim()
  if (!full_name) return { error: 'Ad Soyad boş olamaz' }

  const avatar_color = (formData.get('avatar_color') as string) || 'red'

  const { error } = await admin
    .from('profiles')
    .update({ full_name, avatar_color })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profil')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function sifreDegistir(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı' }

  const yeni = formData.get('yeni_sifre') as string
  const tekrar = formData.get('yeni_sifre_tekrar') as string

  if (!yeni || yeni.length < 6) return { error: 'Şifre en az 6 karakter olmalıdır' }
  if (yeni !== tekrar) return { error: 'Şifreler eşleşmiyor' }

  const { error } = await supabase.auth.updateUser({ password: yeni })
  if (error) return { error: error.message }

  return { success: true }
}
