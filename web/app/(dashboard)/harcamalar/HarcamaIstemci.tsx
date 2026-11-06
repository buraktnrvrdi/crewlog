'use client'

import { useState } from 'react'
import { harcamaEkle, harcamaSil, harcamalariGetir } from '@/app/actions/harcama'
import * as XLSX from 'xlsx'

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

const KATEGORILER = ['Malzeme', 'Yakıt', 'Alet-Ekipman', 'Nakliye', 'İşçilik', 'Diğer'] as const

const KATEGORI_RENK: Record<string, string> = {
  'Malzeme': 'bg-[#3B82F6]/10 text-[#3B82F6]',
  'Yakıt': 'bg-amber-500/10 text-amber-400',
  'Alet-Ekipman': 'bg-purple-500/10 text-purple-400',
  'Nakliye': 'bg-[#10B981]/10 text-[#10B981]',
  'İşçilik': 'bg-[#F43F5E]/10 text-[#F43F5E]',
  'Diğer': 'bg-white/5 text-white/30',
}

type Santiye = {
  id: string
  name: string
}

type Harcama = {
  id: string
  date: string
  category: string
  description: string | null
  amount: number
  site_id: string
  sites?: { name: string } | null
}

export default function HarcamaIstemci({
  santiyeler,
  baslangicHarcamalari,
  varsayilanYil,
  varsayilanAy,
}: {
  santiyeler: Santiye[]
  baslangicHarcamalari: Harcama[]
  varsayilanYil: number
  varsayilanAy: number
}) {
  const [yil, setYil] = useState(varsayilanYil)
  const [ay, setAy] = useState(varsayilanAy)
  const [seciliSantiye, setSeciliSantiye] = useState('')
  const [harcamalar, setHarcamalar] = useState<Harcama[]>(baslangicHarcamalari)
  const [acik, setAcik] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [donemYukleniyor, setDonemYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  async function donemDegistir(yeniYil: number, yeniAy: number) {
    setYil(yeniYil)
    setAy(yeniAy)
    setDonemYukleniyor(true)
    const result = await harcamalariGetir(yeniYil, yeniAy)
    if (result.data) setHarcamalar(result.data)
    setDonemYukleniyor(false)
  }

  async function handleEkle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')
    const formData = new FormData(e.currentTarget)
    const result = await harcamaEkle(formData)
    setYukleniyor(false)
    if (result.error) { setHata(result.error); return }
    setAcik(false);
    (e.target as HTMLFormElement).reset()
    await donemDegistir(yil, ay)
  }

  async function handleSil(id: string, siteId: string) {
    if (!confirm('Bu harcama kaydı silinsin mi?')) return
    await harcamaSil(id, siteId)
    setHarcamalar(prev => prev.filter(h => h.id !== id))
  }

  const filtreliHarcamalar = harcamalar.filter(h =>
    !seciliSantiye || h.site_id === seciliSantiye
  )

  const toplam = filtreliHarcamalar.reduce((sum, h) => sum + h.amount, 0)

  const kategoriToplam: Record<string, number> = {}
  filtreliHarcamalar.forEach(h => {
    kategoriToplam[h.category] = (kategoriToplam[h.category] ?? 0) + h.amount
  })
  const enYuksekKategori = Object.entries(kategoriToplam).sort((a, b) => b[1] - a[1])[0]

  function excelIndir() {
    const baslik = `${AYLAR[ay - 1]} ${yil} Harcamaları`
    const veri = filtreliHarcamalar.map(h => ({
      'Tarih': new Date(h.date + 'T00:00:00').toLocaleDateString('tr-TR'),
      'Şantiye': (h.sites as { name: string } | null)?.name ?? '',
      'Kategori': h.category,
      'Açıklama': h.description ?? '',
      'Tutar (₺)': h.amount,
    }))

    veri.push({
      'Tarih': 'TOPLAM',
      'Şantiye': '',
      'Kategori': '',
      'Açıklama': '',
      'Tutar (₺)': toplam,
    })

    const ws = XLSX.utils.json_to_sheet(veri)
    ws['!cols'] = [{ wch: 14 }, { wch: 24 }, { wch: 16 }, { wch: 30 }, { wch: 14 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, baslik)
    XLSX.writeFile(wb, `${baslik}.xlsx`)
  }

  return (
    <div className="space-y-5">
      {/* Dönem + Filtre */}
      <div className="glass-card p-5 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-1.5 block">Yıl</label>
          <select
            value={yil}
            onChange={e => donemDegistir(Number(e.target.value), ay)}
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
            onChange={e => donemDegistir(yil, Number(e.target.value))}
            className="glass rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass"
          >
            {AYLAR.map((a, i) => (
              <option key={i + 1} value={i + 1}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-1.5 block">Şantiye</label>
          <select
            value={seciliSantiye}
            onChange={e => setSeciliSantiye(e.target.value)}
            className="glass rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass"
          >
            <option value="">Tüm Şantiyeler</option>
            {santiyeler.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex gap-2">
          {filtreliHarcamalar.length > 0 && (
            <button
              onClick={excelIndir}
              className="glass rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-glass"
            >
              Excel İndir
            </button>
          )}
          <button
            onClick={() => setAcik(!acik)}
            className="bg-orange-500 hover:bg-orange-400 text-white font-semibold py-2.5 px-5 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)] text-sm"
          >
            + Harcama Ekle
          </button>
        </div>
      </div>

      {/* Harcama Ekleme Formu */}
      {acik && (
        <form onSubmit={handleEkle} className="glass-card p-5 space-y-3">
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-2">Yeni Harcama</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Şantiye *</label>
              <select name="site_id" required
                className="glass rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full appearance-none">
                <option value="">Seçin...</option>
                {santiyeler.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Tarih *</label>
              <input name="date" type="date" required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Kategori *</label>
              <select name="category" required
                className="glass rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full appearance-none">
                <option value="">Seçin...</option>
                {KATEGORILER.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Tutar (₺) *</label>
              <input name="amount" type="number" min="0.01" step="0.01" required
                className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
                placeholder="0.00" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Açıklama</label>
              <input name="description" type="text"
                className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
                placeholder="Çimento, kum, demir, nakliye faturası..." />
            </div>
          </div>
          {hata && <p className="bg-[#F43F5E]/10 text-[#F43F5E] text-xs px-4 py-2.5 rounded-xl">{hata}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setAcik(false)}
              className="glass rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-glass">
              İptal
            </button>
            <button type="submit" disabled={yukleniyor}
              className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold py-2.5 px-5 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)] text-sm">
              {yukleniyor ? 'Kaydediliyor...' : 'Harcama Ekle'}
            </button>
          </div>
        </form>
      )}

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest">Toplam Harcama</p>
          <p className="text-2xl font-bold text-white mt-2 font-[family-name:var(--font-mono)]">
            ₺{toplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-white/30 mt-1">{AYLAR[ay - 1]} {yil}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest">En Yüksek Kategori</p>
          {enYuksekKategori ? (
            <>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${KATEGORI_RENK[enYuksekKategori[0]] ?? 'bg-white/5 text-white/30'}`}>
                  {enYuksekKategori[0]}
                </span>
                <p className="text-xl font-bold text-white font-[family-name:var(--font-mono)]">
                  ₺{enYuksekKategori[1].toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <p className="text-xs text-white/30 mt-1">
                Toplamın %{toplam > 0 ? Math.round((enYuksekKategori[1] / toplam) * 100) : 0}'i
              </p>
            </>
          ) : (
            <p className="text-sm text-[#94A3B8] mt-2">Veri yok</p>
          )}
        </div>
      </div>

      {/* Harcama Tablosu */}
      <div className="glass-card overflow-hidden">
        {donemYukleniyor ? (
          <div className="p-12 text-center text-[#94A3B8] text-sm">Yükleniyor...</div>
        ) : filtreliHarcamalar.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-5 py-3">Tarih</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-4 py-3">Şantiye</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-4 py-3">Kategori</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-4 py-3">Açıklama</th>
                <th className="text-right text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-5 py-3">Tutar</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filtreliHarcamalar.map(h => (
                <tr key={h.id} className="hover:bg-white/[0.02] transition-glass">
                  <td className="px-5 py-3 text-[#94A3B8] text-xs whitespace-nowrap">
                    {new Date(h.date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                  </td>
                  <td className="px-4 py-3 text-xs text-white font-medium">
                    {(h.sites as { name: string } | null)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${KATEGORI_RENK[h.category] ?? 'bg-white/5 text-white/30'}`}>
                      {h.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/30">{h.description ?? '—'}</td>
                  <td className="px-5 py-3 text-right font-semibold text-white font-[family-name:var(--font-mono)]">
                    ₺{h.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleSil(h.id, h.site_id)} className="text-xs text-white/30 hover:text-[#F43F5E] transition-glass">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/[0.06] bg-white/[0.02]">
                <td colSpan={4} className="px-5 py-3 text-sm font-medium text-[#94A3B8]">Toplam</td>
                <td className="px-5 py-3 text-right font-bold text-orange-400 font-[family-name:var(--font-mono)]">
                  ₺{toplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        ) : (
          <div className="p-12 text-center text-[#94A3B8] text-sm">
            {AYLAR[ay - 1]} {yil} döneminde harcama kaydı bulunamadı
          </div>
        )}
      </div>
    </div>
  )
}
