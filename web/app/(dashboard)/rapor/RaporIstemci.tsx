'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import * as XLSX from 'xlsx'

type Santiye = { id: string; name: string }
type Isci = { id: string; full_name: string; job_title: string | null; daily_wage: number | null }

type IsciRapor = {
  worker_id: string
  full_name: string
  job_title: string | null
  daily_wage: number
  geldi: number
  yarim: number
  gelmedi: number
  qr_gun: number
  toplam_saat: number
  fazla_mesai_saat: number
  toplam_kazanc: number
}

type Donem = 'bu_hafta' | 'bu_ay' | 'gecen_ay' | 'ozel'

function donemeGore(donem: Donem, baslangic: string, bitis: string): [string, string] {
  const bugun = new Date()
  if (donem === 'bu_hafta') {
    const pazartesi = new Date(bugun)
    pazartesi.setDate(bugun.getDate() - ((bugun.getDay() + 6) % 7))
    return [pazartesi.toISOString().split('T')[0], bugun.toISOString().split('T')[0]]
  }
  if (donem === 'bu_ay') {
    const bas = `${bugun.getFullYear()}-${String(bugun.getMonth() + 1).padStart(2, '0')}-01`
    return [bas, bugun.toISOString().split('T')[0]]
  }
  if (donem === 'gecen_ay') {
    const gecen = new Date(bugun.getFullYear(), bugun.getMonth() - 1, 1)
    const gecenSon = new Date(bugun.getFullYear(), bugun.getMonth(), 0)
    return [gecen.toISOString().split('T')[0], gecenSon.toISOString().split('T')[0]]
  }
  return [baslangic, bitis]
}

function dakikaToSaat(dk: number): number {
  return Math.round(dk / 6) / 10
}

export default function RaporIstemci({
  companyId, santiyeler, isciler
}: {
  companyId: string
  santiyeler: Santiye[]
  isciler: Isci[]
}) {
  const [donem, setDonem] = useState<Donem>('bu_ay')
  const [baslangic, setBaslangic] = useState('')
  const [bitis, setBitis] = useState('')
  const [santiyeId, setSantiyeId] = useState<string>('tumu')
  const [rapor, setRapor] = useState<IsciRapor[] | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)

  const getir = useCallback(async () => {
    setYukleniyor(true)
    const supabase = createClient()
    const [startDate, endDate] = donemeGore(donem, baslangic, bitis)

    let query = supabase
      .from('timesheets')
      .select('worker_id, status, overtime_hours, check_in, check_out, site_id')
      .eq('company_id', companyId)
      .gte('date', startDate)
      .lte('date', endDate)

    if (santiyeId !== 'tumu') query = query.eq('site_id', santiyeId)

    const { data: kayitlar } = await query
    setYukleniyor(false)
    if (!kayitlar) return

    const toplamlar: Record<string, IsciRapor> = {}

    for (const isci of isciler) {
      toplamlar[isci.id] = {
        worker_id: isci.id,
        full_name: isci.full_name,
        job_title: isci.job_title,
        daily_wage: isci.daily_wage ?? 0,
        geldi: 0, yarim: 0, gelmedi: 0,
        qr_gun: 0, toplam_saat: 0, fazla_mesai_saat: 0,
        toplam_kazanc: 0,
      }
    }

    for (const k of kayitlar) {
      const t = toplamlar[k.worker_id]
      if (!t) continue

      if (k.status === 'present') t.geldi++
      else if (k.status === 'half_day') t.yarim++
      else if (k.status === 'absent') t.gelmedi++

      if (k.check_in && k.check_out) {
        t.qr_gun++
        const dk = Math.floor((new Date(k.check_out).getTime() - new Date(k.check_in).getTime()) / 60000)
        t.toplam_saat += dk
        const fm = Math.max(0, dk - 480)
        t.fazla_mesai_saat += fm
      } else if (k.overtime_hours) {
        t.fazla_mesai_saat += k.overtime_hours * 60
      }
    }

    for (const t of Object.values(toplamlar)) {
      const w = t.daily_wage
      const saatlikUcret = w / 8
      t.toplam_kazanc =
        t.geldi * w +
        t.yarim * (w / 2) +
        dakikaToSaat(t.fazla_mesai_saat) * saatlikUcret * 1.5
      t.toplam_saat = dakikaToSaat(t.toplam_saat)
      t.fazla_mesai_saat = dakikaToSaat(t.fazla_mesai_saat)
    }

    setRapor(Object.values(toplamlar).filter(t => t.geldi + t.yarim + t.gelmedi > 0 || isciler.some(i => i.id === t.worker_id)))
  }, [donem, baslangic, bitis, santiyeId, companyId, isciler])

  function excelIndir() {
    if (!rapor) return
    const [startDate, endDate] = donemeGore(donem, baslangic, bitis)
    const baslik = `CrewLog Raporu ${startDate} – ${endDate}`

    const satirlar = rapor.map(r => ({
      'İşçi': r.full_name,
      'Unvan': r.job_title ?? '',
      'Geldi': r.geldi,
      'Yarım': r.yarim,
      'Gelmedi': r.gelmedi,
      'QR Kayıtlı Gün': r.qr_gun,
      'Toplam Çalışma (saat)': r.toplam_saat,
      'Fazla Mesai (saat)': r.fazla_mesai_saat,
      'Toplam Kazanç (₺)': r.toplam_kazanc.toFixed(2),
    }))

    const ws = XLSX.utils.json_to_sheet(satirlar)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rapor')
    XLSX.writeFile(wb, `${baslik}.xlsx`)
  }

  const toplamGeldi = rapor?.reduce((s, r) => s + r.geldi, 0) ?? 0
  const toplamFM = rapor?.reduce((s, r) => s + r.fazla_mesai_saat, 0) ?? 0
  const toplamKazanc = rapor?.reduce((s, r) => s + r.toplam_kazanc, 0) ?? 0

  return (
    <div className="space-y-5">
      {/* Filtreler */}
      <div className="glass-card p-5 flex flex-wrap gap-4 items-end">
        <div>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-2">Dönem</p>
          <div className="flex gap-1.5">
            {([
              ['bu_hafta', 'Bu Hafta'],
              ['bu_ay', 'Bu Ay'],
              ['gecen_ay', 'Geçen Ay'],
              ['ozel', 'Özel'],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setDonem(val)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-glass ${
                  donem === val
                    ? 'bg-orange-500 text-white shadow-[0_4px_12px_-2px_rgba(220,38,38,0.4)]'
                    : 'glass text-white/70 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {donem === 'ozel' && (
          <div className="flex gap-2 items-end">
            <div>
              <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-1.5 block">Başlangıç</label>
              <input type="date" value={baslangic} onChange={e => setBaslangic(e.target.value)}
                className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-1.5 block">Bitiş</label>
              <input type="date" value={bitis} onChange={e => setBitis(e.target.value)}
                className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass" />
            </div>
          </div>
        )}

        {santiyeler.length > 1 && (
          <div>
            <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-1.5 block">Şantiye</label>
            <select
              value={santiyeId}
              onChange={e => setSantiyeId(e.target.value)}
              className="glass rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass"
            >
              <option value="tumu">Tüm Şantiyeler</option>
              {santiyeler.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        <button
          onClick={getir}
          disabled={yukleniyor || (donem === 'ozel' && (!baslangic || !bitis))}
          className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold py-2.5 px-5 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)] text-sm"
        >
          {yukleniyor ? 'Yükleniyor...' : 'Raporu Getir'}
        </button>
      </div>

      {/* Özet kartlar */}
      {rapor && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-5">
              <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-2">Toplam Gelen</p>
              <p className="text-2xl font-bold text-[#10B981] font-[family-name:var(--font-mono)]">{toplamGeldi}</p>
              <p className="text-xs text-white/30 mt-1">gün</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-2">Toplam Fazla Mesai</p>
              <p className="text-2xl font-bold text-orange-400 font-[family-name:var(--font-mono)]">{toplamFM.toFixed(1)}</p>
              <p className="text-xs text-white/30 mt-1">saat</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-2">Toplam Kazanç</p>
              <p className="text-2xl font-bold text-white font-[family-name:var(--font-mono)]">
                ₺{toplamKazanc.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Tablo */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <p className="text-sm font-medium text-white">{rapor.length} işçi</p>
              <button
                onClick={excelIndir}
                className="glass rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-glass"
              >
                ↓ Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-5 py-3">İşçi</th>
                    <th className="text-center text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-3 py-3">Geldi</th>
                    <th className="text-center text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-3 py-3">Yarım</th>
                    <th className="text-center text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-3 py-3">Gelmedi</th>
                    <th className="text-center text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-3 py-3">QR Gün</th>
                    <th className="text-center text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-3 py-3">Çalışma</th>
                    <th className="text-center text-xs font-medium text-orange-400 uppercase tracking-widest px-3 py-3">Fazla Mesai</th>
                    <th className="text-right text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-5 py-3">Kazanç</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {rapor.map(r => (
                    <tr key={r.worker_id} className="hover:bg-white/[0.02] transition-glass">
                      <td className="px-5 py-3">
                        <p className="font-medium text-white">{r.full_name}</p>
                        {r.job_title && <p className="text-xs text-[#94A3B8]">{r.job_title}</p>}
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className="text-[#10B981] font-semibold font-[family-name:var(--font-mono)]">{r.geldi}</span>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className="text-amber-400 font-semibold font-[family-name:var(--font-mono)]">{r.yarim}</span>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className="text-[#F43F5E] font-semibold font-[family-name:var(--font-mono)]">{r.gelmedi}</span>
                      </td>
                      <td className="text-center px-3 py-3 text-[#94A3B8] font-[family-name:var(--font-mono)]">{r.qr_gun}</td>
                      <td className="text-center px-3 py-3 text-white/70 font-[family-name:var(--font-mono)]">
                        {r.toplam_saat > 0 ? `${r.toplam_saat}s` : '—'}
                      </td>
                      <td className="text-center px-3 py-3 font-[family-name:var(--font-mono)]">
                        {r.fazla_mesai_saat > 0 ? (
                          <span className="text-orange-400 font-semibold">{r.fazla_mesai_saat}s</span>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                      <td className="text-right px-5 py-3 font-semibold text-white font-[family-name:var(--font-mono)]">
                        ₺{r.toplam_kazanc.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/[0.06] bg-white/[0.02] font-semibold text-sm">
                    <td className="px-5 py-3 text-[#94A3B8]">TOPLAM</td>
                    <td className="text-center px-3 py-3 text-[#10B981] font-[family-name:var(--font-mono)]">{toplamGeldi}</td>
                    <td className="text-center px-3 py-3 text-amber-400 font-[family-name:var(--font-mono)]">
                      {rapor.reduce((s, r) => s + r.yarim, 0)}
                    </td>
                    <td className="text-center px-3 py-3 text-[#F43F5E] font-[family-name:var(--font-mono)]">
                      {rapor.reduce((s, r) => s + r.gelmedi, 0)}
                    </td>
                    <td className="text-center px-3 py-3 text-[#94A3B8] font-[family-name:var(--font-mono)]">
                      {rapor.reduce((s, r) => s + r.qr_gun, 0)}
                    </td>
                    <td className="text-center px-3 py-3 text-white/70 font-[family-name:var(--font-mono)]">
                      {rapor.reduce((s, r) => s + r.toplam_saat, 0).toFixed(1)}s
                    </td>
                    <td className="text-center px-3 py-3 text-orange-400 font-[family-name:var(--font-mono)]">
                      {toplamFM.toFixed(1)}s
                    </td>
                    <td className="text-right px-5 py-3 text-orange-400 font-[family-name:var(--font-mono)]">
                      ₺{toplamKazanc.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {!rapor && !yukleniyor && (
        <div className="glass-card p-16 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm text-[#94A3B8]">Dönem seçip "Raporu Getir"e tıklayın</p>
        </div>
      )}
    </div>
  )
}
