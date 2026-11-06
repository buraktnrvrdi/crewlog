'use client'

import { useState } from 'react'
import { avansEkle, avansSil } from '@/app/actions/avans'

type Avans = {
  id: string
  amount: number
  description: string | null
  date: string
}

export default function AvansSection({ workerId, avanslar, toplamAvans }: {
  workerId: string
  avanslar: Avans[]
  toplamAvans: number
}) {
  const [acik, setAcik] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')

  async function handleEkle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')
    const formData = new FormData(e.currentTarget)
    formData.set('worker_id', workerId)
    const result = await avansEkle(formData)
    setYukleniyor(false)
    if (result.error) { setHata(result.error); return }
    setAcik(false);
    (e.target as HTMLFormElement).reset()
  }

  async function handleSil(id: string) {
    if (!confirm('Bu avans kaydı silinsin mi?')) return
    await avansSil(id, workerId)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest">Avanslar</p>
        <button
          onClick={() => setAcik(!acik)}
          className="text-sm font-medium text-orange-500 hover:text-orange-400 transition-glass"
        >
          + Avans Ekle
        </button>
      </div>

      {acik && (
        <form onSubmit={handleEkle} className="glass-card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Tutar (₺) *</label>
              <input name="amount" type="number" min="1" step="0.01" required
                className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
                placeholder="500" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Tarih</label>
              <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]}
                className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Açıklama</label>
            <input name="description" type="text"
              className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
              placeholder="Ramazan avansı, acil ihtiyaç..." />
          </div>
          {hata && <p className="bg-[#F43F5E]/10 text-[#F43F5E] text-xs px-4 py-2.5 rounded-xl">{hata}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setAcik(false)}
              className="flex-1 glass rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-glass">
              İptal
            </button>
            <button type="submit" disabled={yukleniyor}
              className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold py-2.5 px-5 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)] text-sm">
              {yukleniyor ? 'Kaydediliyor...' : 'Avans Ekle'}
            </button>
          </div>
        </form>
      )}

      <div className="glass-card overflow-hidden">
        {avanslar.length > 0 ? (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-6 py-3">Tarih</th>
                  <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-6 py-3">Açıklama</th>
                  <th className="text-right text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-6 py-3">Tutar</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {avanslar.map(a => (
                  <tr key={a.id} className="hover:bg-white/[0.02] transition-glass">
                    <td className="px-6 py-4 text-[#94A3B8] text-xs">
                      {new Date(a.date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-white/30 text-xs">{a.description ?? '—'}</td>
                    <td className="px-6 py-4 text-right font-semibold text-[#F43F5E] font-[family-name:var(--font-mono)]">
                      -₺{a.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleSil(a.id)} className="text-xs text-white/30 hover:text-[#F43F5E] transition-glass">Sil</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/[0.06] bg-white/[0.02]">
                  <td colSpan={2} className="px-6 py-3 text-sm font-medium text-[#94A3B8]">Toplam Avans (bu ay)</td>
                  <td className="px-6 py-3 text-right font-bold text-[#F43F5E] font-[family-name:var(--font-mono)]">
                    -₺{toplamAvans.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </>
        ) : (
          <div className="p-10 text-center text-[#94A3B8] text-sm">Bu ay avans kaydı yok</div>
        )}
      </div>
    </div>
  )
}
