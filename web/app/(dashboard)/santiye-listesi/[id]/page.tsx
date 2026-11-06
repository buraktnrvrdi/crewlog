import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import GunlukSection from './GunlukSection'
import HarcamaSection from './HarcamaSection'
import FotoSection from './FotoSection'

export const dynamic = 'force-dynamic'

export default async function SantiyeDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await admin
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/sirket-kur')

  const { data: santiye } = await admin
    .from('sites')
    .select('*')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (!santiye) notFound()

  const altmisGunOnce = new Date()
  altmisGunOnce.setDate(altmisGunOnce.getDate() - 60)

  const { data: gunlukler } = await admin
    .from('site_logs')
    .select('*')
    .eq('site_id', id)
    .eq('company_id', profile.company_id)
    .gte('date', altmisGunOnce.toISOString().split('T')[0])
    .order('date', { ascending: false })

  const bugun = new Date()
  const ayBaslangic = new Date(bugun.getFullYear(), bugun.getMonth(), 1).toISOString().split('T')[0]
  const aySonu = new Date(bugun.getFullYear(), bugun.getMonth() + 1, 0).toISOString().split('T')[0]

  const { data: harcamalar } = await admin
    .from('site_expenses')
    .select('*')
    .eq('site_id', id)
    .eq('company_id', profile.company_id)
    .gte('date', ayBaslangic)
    .lte('date', aySonu)
    .order('date', { ascending: false })

  const { data: fotolar } = await admin
    .from('site_photos')
    .select('*')
    .eq('site_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-5xl">
      {/* Başlık */}
      <div className="flex items-start justify-between mb-8 fade-up">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/santiye-listesi" className="text-sm text-[#94A3B8] hover:text-orange-400 transition-glass">
              Şantiyeler
            </Link>
            <span className="text-white/30">/</span>
            <span className="text-sm text-white/70">{santiye.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)] tracking-[-0.025em]">
            {santiye.name}
          </h1>
          {santiye.address && (
            <p className="text-sm text-[#94A3B8] mt-0.5">{santiye.address}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
            santiye.is_active
              ? 'bg-[#10B981]/10 text-[#10B981]'
              : 'bg-white/5 text-white/30'
          }`}>
            {santiye.is_active ? 'Aktif' : 'Pasif'}
          </span>
          <Link
            href={`/santiye-listesi/${id}/duzenle`}
            className="glass rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-glass"
          >
            Düzenle
          </Link>
        </div>
      </div>

      {/* İçerik */}
      <div className="space-y-8">
        <div className="fade-up delay-50">
          <GunlukSection siteId={id} gunlukler={gunlukler ?? []} />
        </div>
        <div className="fade-up delay-100">
          <HarcamaSection siteId={id} harcamalar={harcamalar ?? []} />
        </div>
        <div className="fade-up delay-150">
          <FotoSection siteId={id} fotolar={(fotolar ?? []) as { id: string; url: string; caption: string | null; created_at: string }[]} />
        </div>
      </div>
    </div>
  )
}
