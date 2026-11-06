import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import HarcamaIstemci from './HarcamaIstemci'

export const dynamic = 'force-dynamic'

export default async function HarcamalarPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await admin
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/sirket-kur')

  const { data: santiyeler } = await admin
    .from('sites')
    .select('id, name')
    .eq('company_id', profile.company_id)
    .order('name', { ascending: true })

  const bugun = new Date()
  const ayBaslangic = new Date(bugun.getFullYear(), bugun.getMonth(), 1).toISOString().split('T')[0]
  const aySonu = new Date(bugun.getFullYear(), bugun.getMonth() + 1, 0).toISOString().split('T')[0]

  const { data: harcamalar } = await admin
    .from('site_expenses')
    .select('*, sites(name)')
    .eq('company_id', profile.company_id)
    .gte('date', ayBaslangic)
    .lte('date', aySonu)
    .order('date', { ascending: false })

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8 fade-up">
        <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)] tracking-[-0.025em]">
          Harcama Takibi
        </h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">Şantiye bazlı harcamalarınızı takip edin</p>
      </div>
      <div className="fade-up delay-50">
        <HarcamaIstemci
          santiyeler={santiyeler ?? []}
          baslangicHarcamalari={harcamalar ?? []}
          varsayilanYil={bugun.getFullYear()}
          varsayilanAy={bugun.getMonth() + 1}
        />
      </div>
    </div>
  )
}
