'use client'

import { useState } from 'react'
import { bordroHesapla } from '@/app/actions/bordro'
import * as XLSX from 'xlsx'

const AYLAR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

type BordroSatir = {
  isci_id: string
  ad_soyad: string
  unvan: string | null
  gunluk_ucret: number
  gelen_gun: number
  yarim_gun: number
  gelmeyen_gun: number
  fazla_mesai_saat: number
  normal_kazanc: number
  fazla_mesai_kazanc: number
  avans: number
  toplam_kazanc: number
}

export default function BordroIstemci({ varsayilanYil, varsayilanAy }: { varsayilanYil: number; varsayilanAy: number }) {
  const [yil, setYil] = useState(varsayilanYil)
  const [ay, setAy] = useState(varsayilanAy)
  const [satirlar, setSatirlar] = useState<BordroSatir[]>([])
  const [loading, setLoading] = useState(false)
  const [hesaplandi, setHesaplandi] = useState(false)

  async function hesapla() {
    setLoading(true)
    const result = await bordroHesapla(yil, ay)
    if (result.data) {
      setSatirlar(result.data)
      setHesaplandi(true)
    }
    setLoading(false)
  }

  function excelIndir() {
    const baslik = `${AYLAR[ay - 1]} ${yil} Bordrosu`

    const satirVerisi = satirlar.map(s => ({
      'Ad Soyad': s.ad_soyad,
      'Unvan': s.unvan ?? '',
      'Günlük Yevmiye (₺)': s.gunluk_ucret,
      'Geldiği Gün': s.gelen_gun,
      'Yarım Gün': s.yarim_gun,
      'Gelmediği Gün': s.gelmeyen_gun,
      'Fazla Mesai (saat)': Number(s.fazla_mesai_saat.toFixed(2)),
      'Normal Kazanç (₺)': Number(s.normal_kazanc.toFixed(2)),
      'FM Ücreti (₺)': Number(s.fazla_mesai_kazanc.toFixed(2)),
      'Avans (₺)': Number(s.avans.toFixed(2)),
      'Toplam Kazanç (₺)': Number(s.toplam_kazanc.toFixed(2)),
    }))

    const toplamOdeme = satirlar.reduce((sum, s) => sum + s.toplam_kazanc, 0)
    satirVerisi.push({
      'Ad Soyad': 'TOPLAM',
      'Unvan': '',
      'Günlük Yevmiye (₺)': 0,
      'Geldiği Gün': satirlar.reduce((sum, s) => sum + s.gelen_gun, 0),
      'Yarım Gün': satirlar.reduce((sum, s) => sum + s.yarim_gun, 0),
      'Gelmediği Gün': satirlar.reduce((sum, s) => sum + s.gelmeyen_gun, 0),
      'Fazla Mesai (saat)': Number(satirlar.reduce((sum, s) => sum + s.fazla_mesai_saat, 0).toFixed(2)),
      'Normal Kazanç (₺)': Number(satirlar.reduce((sum, s) => sum + s.normal_kazanc, 0).toFixed(2)),
      'FM Ücreti (₺)': Number(satirlar.reduce((sum, s) => sum + s.fazla_mesai_kazanc, 0).toFixed(2)),
      'Avans (₺)': Number(satirlar.reduce((sum, s) => sum + s.avans, 0).toFixed(2)),
      'Toplam Kazanç (₺)': Number(toplamOdeme.toFixed(2)),
    })

    const ws = XLSX.utils.json_to_sheet(satirVerisi)
    ws['!cols'] = [
      { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 12 },
      { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 18 },
      { wch: 14 }, { wch: 14 }, { wch: 18 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, baslik)
    XLSX.writeFile(wb, `${baslik}.xlsx`)
  }

  function pdfYazdir() {
    const baslik = `${AYLAR[ay - 1]} ${yil} Bordrosu`
    const toplamOdeme = satirlar.reduce((sum, s) => sum + s.toplam_kazanc, 0)

    const satirHTML = satirlar.map(s => `
      <tr>
        <td>${s.ad_soyad}${s.unvan ? `<br><small>${s.unvan}</small>` : ''}</td>
        <td class="center">${s.gelen_gun}</td>
        <td class="center">${s.yarim_gun}</td>
        <td class="center">${s.gelmeyen_gun}</td>
        <td class="center">${s.fazla_mesai_saat.toFixed(1)}</td>
        <td class="right">₺${s.normal_kazanc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
        <td class="right">₺${s.fazla_mesai_kazanc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
        <td class="right red">${s.avans > 0 ? `-₺${s.avans.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '—'}</td>
        <td class="right bold">₺${s.toplam_kazanc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('')

    const pencere = window.open('', '_blank')
    if (!pencere) return

    pencere.document.write(`
      <html>
        <head>
          <title>${baslik}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; }
            .ust { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
            .logo { font-size: 15px; font-weight: 800; color: #DC2626; }
            .baslik { font-size: 18px; font-weight: 700; margin-bottom: 2px; }
            .alt { font-size: 12px; color: #6B7280; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { background: #F3F4F6; text-align: left; padding: 8px 10px; font-size: 10px; color: #6B7280; border-bottom: 2px solid #E5E7EB; }
            td { padding: 8px 10px; border-bottom: 1px solid #F3F4F6; vertical-align: middle; }
            td small { color: #9CA3AF; font-size: 9px; }
            .center { text-align: center; }
            .right { text-align: right; }
            .red { color: #DC2626; }
            .bold { font-weight: 700; }
            tfoot td { background: #FFF7ED; font-weight: 700; border-top: 2px solid #FED7AA; color: #B91C1C; }
            tr:last-child td { border-bottom: none; }
          </style>
        </head>
        <body>
          <div class="ust">
            <div>
              <div class="logo">CrewLog</div>
              <div class="baslik">${baslik}</div>
              <div class="alt">Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}</div>
            </div>
            <div class="alt right">
              Toplam Ödeme<br>
              <span style="font-size:18px;font-weight:700;color:#111">₺${toplamOdeme.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>İşçi</th>
                <th class="center">Geldi</th>
                <th class="center">Yarım</th>
                <th class="center">Gelmedi</th>
                <th class="center">FM Saat</th>
                <th class="right">Normal</th>
                <th class="right">FM Ücreti</th>
                <th class="right">Avans</th>
                <th class="right">Toplam</th>
              </tr>
            </thead>
            <tbody>${satirHTML}</tbody>
            <tfoot>
              <tr>
                <td colspan="8">Toplam (${satirlar.length} işçi)</td>
                <td class="right">₺${toplamOdeme.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `)
    pencere.document.close()
    setTimeout(() => { pencere.print(); pencere.close() }, 400)
  }

  const toplamOdeme = satirlar.reduce((sum, s) => sum + s.toplam_kazanc, 0)
  const toplamIsci = satirlar.length
  const toplamFazlaMesai = satirlar.reduce((sum, s) => sum + s.fazla_mesai_saat, 0)

  return (
    <div className="space-y-5">
      {/* Dönem seçici */}
      <div className="glass-card p-5 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-1.5 block">Yıl</label>
          <select
            value={yil}
            onChange={e => { setYil(Number(e.target.value)); setHesaplandi(false) }}
            className="glass rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass"
          >
            {[varsayilanYil - 1, varsayilanYil].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-1.5 block">Ay</label>
          <select
            value={ay}
            onChange={e => { setAy(Number(e.target.value)); setHesaplandi(false) }}
            className="glass rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass"
          >
            {AYLAR.map((a, i) => (
              <option key={i + 1} value={i + 1}>{a}</option>
            ))}
          </select>
        </div>
        <button
          onClick={hesapla}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold py-2.5 px-5 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)] text-sm"
        >
          {loading ? 'Hesaplanıyor...' : 'Bordroyu Hesapla'}
        </button>

        {hesaplandi && satirlar.length > 0 && (
          <div className="ml-auto flex gap-2">
            <button
              onClick={excelIndir}
              className="glass rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-glass"
            >
              Excel İndir
            </button>
            <button
              onClick={pdfYazdir}
              className="glass rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-glass"
            >
              PDF / Yazdır
            </button>
          </div>
        )}
      </div>

      {/* Özet kartlar */}
      {hesaplandi && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-5">
              <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest">Toplam Ödeme</p>
              <p className="text-2xl font-bold text-white mt-2 font-[family-name:var(--font-mono)]">
                ₺{toplamOdeme.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest">İşçi Sayısı</p>
              <p className="text-2xl font-bold text-white mt-2 font-[family-name:var(--font-mono)]">{toplamIsci}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest">Toplam Fazla Mesai</p>
              <p className="text-2xl font-bold text-white mt-2 font-[family-name:var(--font-mono)]">{toplamFazlaMesai.toFixed(1)} saat</p>
            </div>
          </div>

          {/* Bordro tablosu */}
          {satirlar.length > 0 ? (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-5 py-3">İşçi</th>
                    <th className="text-center text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-4 py-3">Geldi</th>
                    <th className="text-center text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-4 py-3">Yarım</th>
                    <th className="text-center text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-4 py-3">Gelmedi</th>
                    <th className="text-center text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-4 py-3">FM Saat</th>
                    <th className="text-right text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-4 py-3">Normal</th>
                    <th className="text-right text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-4 py-3">FM Ücreti</th>
                    <th className="text-right text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-4 py-3">Avans</th>
                    <th className="text-right text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-5 py-3">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {satirlar.map((satir) => (
                    <tr key={satir.isci_id} className="hover:bg-white/[0.02] transition-glass">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 text-xs font-semibold">
                            {satir.ad_soyad.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{satir.ad_soyad}</p>
                            {satir.unvan && <p className="text-xs text-[#94A3B8]">{satir.unvan}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-[#10B981] font-medium font-[family-name:var(--font-mono)]">{satir.gelen_gun}</td>
                      <td className="px-4 py-4 text-center text-amber-400 font-medium font-[family-name:var(--font-mono)]">{satir.yarim_gun}</td>
                      <td className="px-4 py-4 text-center text-[#F43F5E] font-medium font-[family-name:var(--font-mono)]">{satir.gelmeyen_gun}</td>
                      <td className="px-4 py-4 text-center text-[#3B82F6] font-medium font-[family-name:var(--font-mono)]">{satir.fazla_mesai_saat.toFixed(1)}</td>
                      <td className="px-4 py-4 text-right text-white/70 font-[family-name:var(--font-mono)]">₺{satir.normal_kazanc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-4 text-right text-[#3B82F6] font-[family-name:var(--font-mono)]">₺{satir.fazla_mesai_kazanc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-4 text-right text-[#F43F5E] font-[family-name:var(--font-mono)]">
                        {satir.avans > 0 ? `-₺${satir.avans.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-white font-[family-name:var(--font-mono)]">
                        ₺{satir.toplam_kazanc.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/[0.06] bg-white/[0.02]">
                    <td colSpan={8} className="px-5 py-3 text-sm font-medium text-[#94A3B8]">Toplam</td>
                    <td className="px-5 py-3 text-right font-bold text-orange-400 font-[family-name:var(--font-mono)]">
                      ₺{toplamOdeme.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <p className="text-[#94A3B8]">Bu dönemde puantaj kaydı bulunamadı</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
