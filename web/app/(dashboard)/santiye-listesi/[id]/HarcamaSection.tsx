'use client'

import { useState } from 'react'
import { harcamaEkle, harcamaSil } from '@/app/actions/harcama'

type Harcama = {
  id: string
  date: string
  category: string
  description: string | null
  amount: number
}

const KATEGORI_RENK: Record<string, string> = {
  'Malzeme': 'bg-[#3B82F6]/10 text-[#3B82F6]',
  'Yakıt': 'bg-amber-500/10 text-amber-400',
  'Alet-Ekipman': 'bg-purple-500/10 text-purple-400',
  'Nakliye': 'bg-[#10B981]/10 text-[#10B981]',
  'İşçilik': 'bg-[#F43F5E]/10 text-[#F43F5E]',
  'Diğer': 'bg-white/5 text-white/30',
}

export default function HarcamaSection({ siteId, harcamalar }: {
  siteId: string
  harcamalar: Harcama[]
}) {
  const [acik, setAcik] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  async function handleEkle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')
    const formData = new FormData(e.currentTarget)
    formData.set('site_id', siteId)
    const result = await harcamaEkle(formData)
    setYukleniyor(false)
    if (result.error) { setHata(result.error); return }
    setAcik(false);
    (e.target as HTMLFormElement).reset()
  }

  async function handleSil(id: string) {
    if (!confirm('Bu harcama kaydı silinsin mi?')) return
    await harcamaSil(id, siteId)
  }

  const toplam = harcamalar.reduce((sum, h) => sum + h.amount, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest">Bu Ay Harcamalar</p>
        <button
          onClick={() => setAcik(!acik)}
          className="text-sm font-medium text-orange-500 hover:text-orange-400 transition-glass"
        >
          + Harcama Ekle
        </button>
      </div>

      {acik && (
        <form onSubmit={handleEkle} className="glass-card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
                <option value="Malzeme">Malzeme</option>
                <option value="Yakıt">Yakıt</option>
                <option value="Alet-Ekipman">Alet-Ekipman</option>
                <option value="Nakliye">Nakliye</option>
                <option value="İşçilik">İşçilik</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Tutar (₺) *</label>
              <input name="amount" type="number" min="0.01" step="0.01" required
                className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
                placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Açıklama</label>
              <input name="description" type="text"
                className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
                placeholder="Çimento, kum, demir..." />
            </div>
          </div>
          {hata && <p className="bg-[#F43F5E]/10 text-[#F43F5E] text-xs px-4 py-2.5 rounded-xl">{hata}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setAcik(false)}
              className="flex-1 glass rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-glass">
              İptal
            </button>
            <button type="submit" disabled={yukleniyor}
              className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold py-2.5 px-5 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)] text-sm">
              {yukleniyor ? 'Kaydediliyor...' : 'Harcama Ekle'}
            </button>
          </div>
        </form>
      )}

      <div className="glass-card overflow-hidden">
        {harcamalar.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-5 py-3">Tarih</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-4 py-3">Kategori</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-4 py-3">Açıklama</th>
                <th className="text-right text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-5 py-3">Tutar</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {harcamalar.map(h => (
                <tr key={h.id} className="hover:bg-white/[0.02] transition-glass">
                  <td className="px-5 py-3 text-[#94A3B8] text-xs whitespace-nowrap">
                    {new Date(h.date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
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
                    <button onClick={() => handleSil(h.id)} className="text-xs text-white/30 hover:text-[#F43F5E] transition-glass">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/[0.06] bg-white/[0.02]">
                <td colSpan={3} className="px-5 py-3 text-sm font-medium text-[#94A3B8]">Toplam (bu ay)</td>
                <td className="px-5 py-3 text-right font-bold text-orange-400 font-[family-name:var(--font-mono)]">
                  ₺{toplam.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        ) : (
          <div className="p-10 text-center text-[#94A3B8] text-sm">Bu ay harcama kaydı yok</div>
        )}
      </div>
    </div>
  )
}
