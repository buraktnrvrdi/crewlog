import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import IsciDuzenleForm from './IsciDuzenleForm'

export const dynamic = 'force-dynamic'

export default async function IsciDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await admin
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/sirket-kur')

  const { data: worker } = await admin
    .from('workers')
    .select('id, full_name, phone, tc_no, job_title, daily_wage')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (!worker) redirect('/isci-listesi')

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 fade-up">
        <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)] tracking-[-0.025em]">
          İşçi Düzenle
        </h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">{worker.full_name} bilgilerini güncelle</p>
      </div>
      <div className="fade-up delay-50">
        <IsciDuzenleForm worker={worker} />
      </div>
    </div>
  )
}
