import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import RaporIstemci from './RaporIstemci'

export const dynamic = 'force-dynamic'

export default async function RaporPage() {
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
  if (profile.role === 'foreman') redirect('/dashboard')

  const { data: santiyeler } = await admin
    .from('sites')
    .select('id, name')
    .eq('company_id', profile.company_id)
    .eq('is_active', true)
    .order('name')

  const { data: isciler } = await admin
    .from('workers')
    .select('id, full_name, job_title, daily_wage')
    .eq('company_id', profile.company_id)
    .eq('is_active', true)
    .order('full_name')

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 fade-up">
        <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)] tracking-[-0.025em]">
          Raporlar
        </h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">Dönem ve şantiye bazlı devam analizi</p>
      </div>
      <div className="fade-up delay-50">
        <RaporIstemci
          companyId={profile.company_id}
          santiyeler={santiyeler ?? []}
          isciler={isciler ?? []}
        />
      </div>
    </div>
  )
}
