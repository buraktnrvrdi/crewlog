import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

function saatGoster(iso: string) {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, company_id, role, companies(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/sirket-kur')

  const company = profile.companies as unknown as { name: string }
  const isAdmin = profile.role === 'admin' || !profile.role
  const today = new Date().toISOString().split('T')[0]
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const pazartesi = new Date(now)
  pazartesi.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const weekStart = pazartesi.toISOString().split('T')[0]

  const [
    { count: workerCount },
    { count: siteCount },
    { data: bugunPuantaj },
    { data: aylikPuantaj },
    { data: isciler },
    { data: sonGirisler },
    { data: haftaFM },
    { data: aktifSantiyeler },
    { data: sonHarcamalar },
  ] = await Promise.all([
    admin.from('workers').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id).eq('is_active', true),
    admin.from('sites').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id).eq('is_active', true),
    admin.from('timesheets').select('worker_id, status').eq('company_id', profile.company_id).eq('date', today),
    admin.from('timesheets').select('worker_id, status, overtime_hours').eq('company_id', profile.company_id).gte('date', monthStart).lte('date', today),
    admin.from('workers').select('id, daily_wage').eq('company_id', profile.company_id).eq('is_active', true),
    admin.from('timesheets')
      .select('check_in, check_out, workers(full_name, job_title)')
      .eq('company_id', profile.company_id)
      .eq('date', today)
      .not('check_in', 'is', null)
      .order('check_in', { ascending: false })
      .limit(6),
    admin.from('timesheets')
      .select('check_in, check_out, overtime_hours')
      .eq('company_id', profile.company_id)
      .gte('date', weekStart)
      .lte('date', today)
      .not('check_in', 'is', null)
      .not('check_out', 'is', null),
    admin.from('sites').select('id, name, address').eq('company_id', profile.company_id).eq('is_active', true).order('created_at', { ascending: false }).limit(6),
    admin.from('site_expenses').select('amount, description, date, sites(name)').eq('company_id', profile.company_id).order('date', { ascending: false }).limit(4),
  ])

  const gelenSayisi = bugunPuantaj?.filter(p => p.status === 'present' || p.status === 'overtime' || p.status === 'half_day').length ?? 0
  const gelmeyenSayisi = bugunPuantaj?.filter(p => p.status === 'absent').length ?? 0
  const toplamIsci = workerCount ?? 0
  const katilimYuzde = toplamIsci > 0 ? Math.round((gelenSayisi / toplamIsci) * 100) : 0

  const haftaFMSaat = (haftaFM ?? []).reduce((s, k) => {
    if (k.check_in && k.check_out) {
      const dk = Math.floor((new Date(k.check_out).getTime() - new Date(k.check_in).getTime()) / 60000)
      return s + Math.max(0, (dk - 480) / 60)
    }
    return s + (k.overtime_hours ?? 0)
  }, 0)

  const wageMap = Object.fromEntries((isciler ?? []).map(i => [i.id, i.daily_wage ?? 0]))
  const aylikToplam = (aylikPuantaj ?? []).reduce((sum, p) => {
    const wage = wageMap[p.worker_id] ?? 0
    if (p.status === 'present') return sum + wage
    if (p.status === 'half_day') return sum + wage / 2
    if (p.status === 'overtime') return sum + wage + (p.overtime_hours ?? 0) * (wage / 8) * 1.5
    return sum
  }, 0)

  // Per-site today attendance
  const santiyeKatilimList = await Promise.all(
    (aktifSantiyeler ?? []).map(async (s) => {
      const { count } = await admin
        .from('timesheets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .eq('site_id', s.id)
        .eq('date', today)
        .in('status', ['present', 'overtime', 'half_day'])
      return { ...s, bugunGelen: count ?? 0 }
    })
  )

  const barColor = katilimYuzde >= 80 ? '#10B981' : katilimYuzde >= 50 ? '#F59E0B' : '#F43F5E'

  return (
    <div className="p-8 max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-[family-name:var(--font-outfit)] text-2xl font-semibold tracking-[-0.025em] text-white">
          Genel Bakış
        </h2>
        <p className="text-sm text-[#94A3B8] mt-1">
          {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-6 fade-up delay-50">
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-3">Aktif İşçi</p>
          <p className="font-[family-name:var(--font-mono)] text-3xl font-bold text-white">{toplamIsci}</p>
          <Link href="/isci-listesi" className="text-xs text-orange-500 mt-2 inline-block hover:text-orange-400 transition-glass">
            Listeye git →
          </Link>
        </div>
        <div className="glass-card p-6 fade-up delay-100">
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-3">Aktif Şantiye</p>
          <p className="font-[family-name:var(--font-mono)] text-3xl font-bold text-white">{siteCount ?? 0}</p>
          <Link href="/santiye-listesi" className="text-xs text-orange-500 mt-2 inline-block hover:text-orange-400 transition-glass">
            Listeye git →
          </Link>
        </div>
        <div className="glass-card p-6 fade-up delay-150">
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-3">Bugün Gelen</p>
          <p className="font-[family-name:var(--font-mono)] text-3xl font-bold text-[#10B981]">{gelenSayisi}</p>
          {gelmeyenSayisi > 0 && (
            <p className="text-xs text-white/30 mt-1">{gelmeyenSayisi} gelmedi</p>
          )}
        </div>
        <div className="glass-card p-6 fade-up delay-200">
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-3">Bu Ay Bordro</p>
          <p className="font-[family-name:var(--font-mono)] text-3xl font-bold text-orange-500">
            ₺{aylikToplam.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-white/30 mt-1">tahmini</p>
        </div>
      </div>

      {/* Haftalık fazla mesai */}
      {haftaFMSaat > 0 && (
        <div className="glass-card p-5 flex items-center justify-between fade-up delay-250">
          <div>
            <p className="text-sm font-medium text-white">Bu Hafta Fazla Mesai</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">QR çıkış kaydına göre</p>
          </div>
          <p className="font-[family-name:var(--font-mono)] text-2xl font-bold text-orange-500">
            {Math.round(haftaFMSaat * 10) / 10} saat
          </p>
        </div>
      )}

      {/* Hızlı İşlemler */}
      <div className="fade-up delay-200">
        <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-3">Hızlı İşlemler</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/puantaj" className="glass-card p-5 hover:bg-white/[0.06] transition-glass group">
            <p className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">Puantaj Gir</p>
            <p className="text-xs text-[#94A3B8] mt-1">Günlük yoklama kaydet</p>
          </Link>
          <Link href="/isci-ekle" className="glass-card p-5 hover:bg-white/[0.06] transition-glass group">
            <p className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">İşçi Ekle</p>
            <p className="text-xs text-[#94A3B8] mt-1">Yeni işçi kaydı oluştur</p>
          </Link>
          <Link href="/santiye-ekle" className="glass-card p-5 hover:bg-white/[0.06] transition-glass group">
            <p className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">Şantiye Ekle</p>
            <p className="text-xs text-[#94A3B8] mt-1">Yeni şantiye tanımla</p>
          </Link>
          <Link href="/rapor" className="glass-card p-5 hover:bg-white/[0.06] transition-glass group">
            <p className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">Raporlar</p>
            <p className="text-xs text-[#94A3B8] mt-1">Detaylı analizlere git</p>
          </Link>
        </div>
      </div>

      {/* Bottom 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 fade-up delay-300">
        {/* Left: attendance bar + per-site today list */}
        <div className="space-y-4">
          {toplamIsci > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-white">Bugünkü Katılım</p>
                <p className="font-[family-name:var(--font-mono)] text-sm font-bold text-white">{katilimYuzde}%</p>
              </div>
              <div className="bg-white/[0.06] rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: `${katilimYuzde}%`, background: barColor }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#94A3B8] mt-2">
                <span>{gelenSayisi} geldi</span>
                <span>{toplamIsci - gelenSayisi - gelmeyenSayisi} kayıt yok</span>
                <span>{gelmeyenSayisi} gelmedi</span>
              </div>
            </div>
          )}

          {santiyeKatilimList.length > 0 && (
            <div className="glass-card p-6">
              <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-4">Şantiye Bazlı Bugün</p>
              <div className="space-y-3">
                {santiyeKatilimList.map((s) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <Link href={`/santiye-listesi/${s.id}`} className="text-sm text-white hover:text-orange-400 transition-glass truncate flex-1 mr-3">
                      {s.name}
                    </Link>
                    <span className={`font-[family-name:var(--font-mono)] text-sm font-semibold ${s.bugunGelen > 0 ? 'text-[#10B981]' : 'text-white/30'}`}>
                      {s.bugunGelen} kişi
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: recent QR logins + recent expenses (admin only) */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-3">Bugün Son Girişler</p>
            <div className="glass-card p-6">
              {sonGirisler && sonGirisler.length > 0 ? (
                <div>
                  {sonGirisler.map((kayit: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-orange-500 text-xs font-semibold">
                          {kayit.workers?.full_name?.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{kayit.workers?.full_name}</p>
                          {kayit.workers?.job_title && (
                            <p className="text-xs text-[#94A3B8]">{kayit.workers.job_title}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-[family-name:var(--font-mono)] text-xs text-[#10B981]">
                          ▲ {saatGoster(kayit.check_in)}
                        </p>
                        {kayit.check_out && (
                          <p className="font-[family-name:var(--font-mono)] text-xs text-[#3B82F6] mt-0.5">
                            ▼ {saatGoster(kayit.check_out)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/30">Bugün henüz QR giriş yapılmadı</p>
              )}
            </div>
          </div>

          {isAdmin && sonHarcamalar && sonHarcamalar.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-3">Son Harcamalar</p>
              <div className="glass-card p-6">
                {(sonHarcamalar as any[]).map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm text-white truncate">{h.description || 'Harcama'}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        {h.sites?.name} · {new Date(h.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <p className="font-[family-name:var(--font-mono)] text-sm font-semibold text-orange-500 flex-shrink-0">
                      ₺{Number(h.amount).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
