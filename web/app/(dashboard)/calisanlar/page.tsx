import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import CalisanlarIstemci from './CalisanlarIstemci'

export const dynamic = 'force-dynamic'

export default async function CalisanlarPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await admin
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/sirket-kur')
  if (!['owner', 'admin'].includes(profile.role ?? '')) redirect('/dashboard')

  const { data: calisanlar } = await admin
    .from('profiles')
    .select('id, full_name, role, avatar_color')
    .eq('company_id', profile.company_id)
    .neq('id', user.id)
    .order('full_name')

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Çalışanlar</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Kullanıcıların yetki ve erişim haklarını yönetin</p>
      </div>
      <CalisanlarIstemci calisanlar={calisanlar ?? []} />
    </div>
  )
}
