import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import ProfilForm from './ProfilForm'

export const dynamic = 'force-dynamic'

export default async function ProfilSayfasi() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, role, avatar_color')
    .eq('id', user.id)
    .single()

  const rolLabel =
    profile?.role === 'admin' || !profile?.role ? 'Yönetici'
    : profile?.role === 'foreman' ? 'Şef'
    : 'Kullanıcı'

  return (
    <div className="min-h-full flex flex-col items-center py-8 px-4 fade-up">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)]">Profil</h1>
          <p className="text-sm text-[#6B7280] mt-1">Hesap bilgilerini ve şifreni yönet</p>
        </div>

        <ProfilForm
          full_name={profile?.full_name ?? ''}
          email={user.email ?? ''}
          rolLabel={rolLabel}
          avatar_color={profile?.avatar_color ?? null}
        />
      </div>
    </div>
  )
}
