import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import SantiyeKartlari from './SantiyeKartlari'

export const dynamic = 'force-dynamic'

export default async function SantiyeListesiPage() {
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

  const { data: santiyeler } = await admin
    .from('sites')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8 fade-up">
        <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)] tracking-[-0.025em]">
          Şantiyeler
        </h1>
        <Link
          href="/santiye-ekle"
          className="bg-orange-500 hover:bg-orange-400 text-white font-semibold py-2.5 px-5 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)] text-sm"
        >
          + Şantiye Ekle
        </Link>
      </div>

      {santiyeler && santiyeler.length > 0 ? (
        <div className="fade-up delay-50">
          <SantiyeKartlari santiyeler={santiyeler} />
        </div>
      ) : (
        <div className="text-center py-16 fade-up delay-50">
          <p className="text-4xl mb-4">🏗️</p>
          <p className="text-[#94A3B8] mb-6">Henüz şantiye eklenmemiş</p>
          <Link
            href="/santiye-ekle"
            className="bg-orange-500 hover:bg-orange-400 text-white font-semibold py-2.5 px-5 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)] text-sm inline-block"
          >
            İlk Şantiyeni Ekle
          </Link>
        </div>
      )}
    </div>
  )
}
