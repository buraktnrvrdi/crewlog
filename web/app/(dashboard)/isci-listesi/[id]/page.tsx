import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import AvansSection from './AvansSection'
import BelgeSection from './BelgeSection'
import SgkSection from './SgkSection'

export const dynamic = 'force-dynamic'

function saatGoster(iso: string) {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function sureyiHesapla(baslangic: string, bitis: string): string {
  const dk = Math.floor((new Date(bitis).getTime() - new Date(baslangic).getTime()) / 60000)
  return `${Math.floor(dk / 60)}s ${dk % 60}dk`
}

const DURUM_LABEL: Record<string, string> = {
  present: 'Geldi',
  absent: 'Gelmedi',
  half_day: 'Yarım Gün',
  overtime: 'Fazla Mesai',
}

const DURUM_RENK: Record<string, string> = {
  present: 'bg-[#10B981]/10 text-[#10B981]',
  absent: 'bg-[#F43F5E]/10 text-[#F43F5E]',
  half_day: 'bg-amber-500/10 text-amber-400',
  overtime: 'bg-[#3B82F6]/10 text-[#3B82F6]',
}

export default async function IsciProfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await admin
    .from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) redirect('/sirket-kur')

  const { data: worker } = await admin
    .from('workers')
    .select('id, full_name, phone, tc_no, job_title, daily_wage, is_active, created_at')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (!worker) redirect('/isci-listesi')

  const now = new Date()
  const ayBaslangic = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const otuzGunOnce = new Date()
  otuzGunOnce.setDate(otuzGunOnce.getDate() - 30)

  const { data: aylikKayitlar } = await admin
    .from('timesheets')
    .select('status, overtime_hours, check_in, check_out')
    .eq('worker_id', id)
    .gte('date', ayBaslangic)

  const { data: gecmisKayitlar } = await admin
    .from('timesheets')
    .select('id, date, status, check_in, check_out, sites(name)')
    .eq('worker_id', id)
    .gte('date', otuzGunOnce.toISOString().split('T')[0])
    .order('date', { ascending: false })

  const gelenGun = aylikKayitlar?.filter(k => k.status === 'present' || k.status === 'overtime').length ?? 0
  const yarimGun = aylikKayitlar?.filter(k => k.status === 'half_day').length ?? 0
  const gelmeyenGun = aylikKayitlar?.filter(k => k.status === 'absent').length ?? 0
  const toplamGun = aylikKayitlar?.length ?? 0

  const fazlaMesaiSaat = (aylikKayitlar ?? []).reduce((sum, k) => {
    if (k.check_in && k.check_out) {
      const calisma = (new Date(k.check_out).getTime() - new Date(k.check_in).getTime()) / 3600000
      return sum + Math.max(0, calisma - 8)
    }
    if (k.status === 'overtime') return sum + (k.overtime_hours ?? 0)
    return sum
  }, 0)

  const saatlikUcret = worker.daily_wage / 8
  const aylikKazanc =
    gelenGun * worker.daily_wage +
    yarimGun * (worker.daily_wage / 2) +
    fazlaMesaiSaat * saatlikUcret * 1.5

  const katilimOrani = toplamGun > 0 ? Math.round(((gelenGun + yarimGun * 0.5) / toplamGun) * 100) : 0

  const [{ data: avanslar }, { data: belgeler }, { data: sgkKayitlar }] = await Promise.all([
    admin.from('advances').select('id, amount, description, date').eq('worker_id', id).eq('company_id', profile.company_id).gte('date', ayBaslangic).order('date', { ascending: false }),
    admin.from('worker_documents').select('id, type, name, file_url, expires_at, created_at').eq('worker_id', id).eq('company_id', profile.company_id).order('created_at', { ascending: false }),
    admin.from('worker_sgk').select('id, start_date, end_date, sgk_no, notes').eq('worker_id', id).eq('company_id', profile.company_id).order('start_date', { ascending: false }),
  ])

  const toplamAvans = avanslar?.reduce((s, a) => s + a.amount, 0) ?? 0

  return (
    <div className="p-8 max-w-5xl">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-8 fade-up">
        <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)] tracking-[-0.025em]">
          {worker.full_name}
        </h1>
        <div className="flex gap-2">
          <Link
            href={`/isci-listesi/qr/${worker.id}`}
            className="glass rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-glass"
          >
            QR Kart
          </Link>
          <Link
            href={`/isci-listesi/${worker.id}/duzenle`}
            className="bg-orange-500 hover:bg-orange-400 text-white font-semibold py-2.5 px-5 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)] text-sm"
          >
            Düzenle
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* İşçi bilgi kartı */}
        <div className="glass-card p-6 fade-up delay-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 text-2xl font-bold font-[family-name:var(--font-outfit)]">
                {worker.full_name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-[family-name:var(--font-outfit)] tracking-[-0.025em]">
                  {worker.full_name}
                </h2>
                <p className="text-sm text-[#94A3B8] mt-0.5">{worker.job_title ?? 'Unvan belirtilmemiş'}</p>
                <div className="flex items-center gap-3 mt-2">
                  {worker.phone && <span className="text-xs text-white/30">{worker.phone}</span>}
                  {worker.tc_no && <span className="text-xs text-white/30">TC: {worker.tc_no}</span>}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white font-[family-name:var(--font-mono)]">
                ₺{worker.daily_wage.toLocaleString('tr-TR')}
              </p>
              <p className="text-xs text-white/30 mt-0.5">günlük yevmiye</p>
              <span className={`inline-block mt-2 text-xs font-medium px-2.5 py-0.5 rounded-full ${worker.is_active ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-white/5 text-white/30'}`}>
                {worker.is_active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </div>
        </div>

        {/* Bu ay istatistikler */}
        <div className="fade-up delay-100">
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-3">Bu Ay</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-[#10B981] font-[family-name:var(--font-mono)]">{gelenGun}</p>
              <p className="text-xs text-[#94A3B8] mt-1">Geldi</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-amber-400 font-[family-name:var(--font-mono)]">{yarimGun}</p>
              <p className="text-xs text-[#94A3B8] mt-1">Yarım Gün</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-[#F43F5E] font-[family-name:var(--font-mono)]">{gelmeyenGun}</p>
              <p className="text-xs text-[#94A3B8] mt-1">Gelmedi</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-[#3B82F6] font-[family-name:var(--font-mono)]">{fazlaMesaiSaat.toFixed(1)}</p>
              <p className="text-xs text-[#94A3B8] mt-1">FM Saat</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-orange-400 font-[family-name:var(--font-mono)]">
                ₺{aylikKazanc.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-[#94A3B8] mt-1">Tahmini Kazanç</p>
            </div>
          </div>
        </div>

        {/* Katılım oranı */}
        {toplamGun > 0 && (
          <div className="glass-card p-6 fade-up delay-150">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium text-white">Bu Ay Katılım Oranı</p>
              <p className="text-sm font-bold text-white font-[family-name:var(--font-mono)]">%{katilimOrani}</p>
            </div>
            <div className="w-full bg-white/[0.06] rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all ${katilimOrani >= 80 ? 'bg-[#10B981]' : katilimOrani >= 50 ? 'bg-amber-400' : 'bg-[#F43F5E]'}`}
                style={{ width: `${katilimOrani}%` }}
              />
            </div>
          </div>
        )}

        {/* SGK Takibi */}
        <div className="fade-up delay-200">
          <SgkSection workerId={id} kayitlar={sgkKayitlar ?? []} />
        </div>

        {/* Avanslar */}
        <div className="fade-up delay-200">
          <AvansSection workerId={id} avanslar={avanslar ?? []} toplamAvans={toplamAvans} />
        </div>

        {/* Belgeler */}
        <div className="fade-up delay-250">
          <BelgeSection workerId={id} companyId={profile.company_id} belgeler={belgeler ?? []} />
        </div>

        {/* Son 30 gün geçmiş */}
        <div className="fade-up delay-300">
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-3">Son 30 Gün</p>
          {gecmisKayitlar && gecmisKayitlar.length > 0 ? (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-6 py-3">Tarih</th>
                    <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-6 py-3">Şantiye</th>
                    <th className="text-center text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-6 py-3">Giriş / Çıkış</th>
                    <th className="text-center text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-6 py-3">Süre</th>
                    <th className="text-center text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-6 py-3">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {(gecmisKayitlar as any[]).map((kayit) => (
                    <tr key={kayit.id} className="hover:bg-white/[0.02] transition-glass">
                      <td className="px-6 py-4 text-sm text-white font-medium">
                        {new Date(kayit.date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#94A3B8]">{kayit.sites?.name ?? '—'}</td>
                      <td className="px-6 py-4 text-center">
                        {kayit.check_in ? (
                          <div className="text-xs space-y-0.5 font-[family-name:var(--font-mono)]">
                            <div className="text-[#10B981]">▲ {saatGoster(kayit.check_in)}</div>
                            {kayit.check_out && <div className="text-[#3B82F6]">▼ {saatGoster(kayit.check_out)}</div>}
                          </div>
                        ) : <span className="text-white/30 text-xs">—</span>}
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-[#94A3B8] font-[family-name:var(--font-mono)]">
                        {kayit.check_in && kayit.check_out ? sureyiHesapla(kayit.check_in, kayit.check_out) : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${DURUM_RENK[kayit.status] ?? 'bg-white/5 text-white/30'}`}>
                          {DURUM_LABEL[kayit.status] ?? kayit.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-card p-10 text-center">
              <p className="text-[#94A3B8] text-sm">Son 30 günde kayıt bulunamadı</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
