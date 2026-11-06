import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import PuantajFormu from './PuantajFormu'

export const dynamic = 'force-dynamic'

export default async function PuantajPage() {
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

  const [{ data: santiyeler }, { data: isciler }] = await Promise.all([
    admin.from('sites').select('id, name').eq('company_id', profile.company_id).eq('is_active', true).order('name'),
    admin.from('workers').select('id, full_name, job_title').eq('company_id', profile.company_id).eq('is_active', true).order('full_name'),
  ])

  if (!santiyeler?.length) {
    return (
      <div className="p-8 max-w-5xl flex items-center justify-center py-24">
        <div className="glass-card p-12 text-center fade-up">
          <p className="text-4xl mb-4">🏗️</p>
          <p className="text-[#94A3B8] font-medium mb-6">Önce bir şantiye eklemelisiniz</p>
          <a
            href="/santiye-ekle"
            className="bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3 px-6 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.5)] text-sm inline-block"
          >
            Şantiye Ekle
          </a>
        </div>
      </div>
    )
  }

  if (!isciler?.length) {
    return (
      <div className="p-8 max-w-5xl flex items-center justify-center py-24">
        <div className="glass-card p-12 text-center fade-up">
          <p className="text-4xl mb-4">👷</p>
          <p className="text-[#94A3B8] font-medium mb-6">Önce işçi eklemelisiniz</p>
          <a
            href="/isci-ekle"
            className="bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3 px-6 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.5)] text-sm inline-block"
          >
            İşçi Ekle
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h2 className="font-[family-name:var(--font-outfit)] text-2xl font-semibold tracking-[-0.025em] text-white">
          Günlük Puantaj
        </h2>
        <p className="text-sm text-[#94A3B8] mt-1">
          {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
        </p>
      </div>

      <PuantajFormu
        santiyeler={santiyeler}
        isciler={isciler}
        companyId={profile.company_id}
      />
    </div>
  )
}
