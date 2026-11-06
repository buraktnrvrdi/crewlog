import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import SantiyeDuzenleForm from './SantiyeDuzenleForm'

export const dynamic = 'force-dynamic'

export default async function SantiyeDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await admin
    .from('profiles').select('company_id').eq('id', user.id).single()

  if (!profile?.company_id) redirect('/sirket-kur')

  const { data: site } = await admin
    .from('sites')
    .select('id, name, address')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (!site) redirect('/santiye-listesi')

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 fade-up">
        <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)] tracking-[-0.025em]">
          Şantiye Düzenle
        </h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">{site.name} bilgilerini güncelle</p>
      </div>
      <div className="fade-up delay-50">
        <SantiyeDuzenleForm site={site} />
      </div>
    </div>
  )
}
