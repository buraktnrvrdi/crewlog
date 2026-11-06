import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import IsciKartlari from './IsciKartlari'

export const dynamic = 'force-dynamic'

export default async function IsciListesiPage() {
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

  const { data: isciler } = await admin
    .from('workers')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  const aktif = isciler?.filter(i => i.is_active).length ?? 0
  const pasif = isciler?.filter(i => !i.is_active).length ?? 0

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-[family-name:var(--font-outfit)] text-2xl font-semibold tracking-[-0.025em] text-white">
            İşçiler
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            <span className="text-[#10B981]">{aktif} aktif</span>
            <span className="text-white/30"> · </span>
            <span>{pasif} pasif</span>
          </p>
        </div>
        <Link
          href="/isci-ekle"
          className="bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3 px-6 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.5)] text-sm"
        >
          + İşçi Ekle
        </Link>
      </div>

      {isciler && isciler.length > 0 ? (
        <IsciKartlari isciler={isciler} />
      ) : (
        <div className="glass-card p-16 text-center fade-up">
          <p className="text-4xl mb-4">👷</p>
          <p className="text-[#94A3B8] mb-6">Henüz işçi eklenmemiş</p>
          <Link
            href="/isci-ekle"
            className="bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3 px-6 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.5)] text-sm inline-block"
          >
            İlk İşçiyi Ekle
          </Link>
        </div>
      )}
    </div>
  )
}
