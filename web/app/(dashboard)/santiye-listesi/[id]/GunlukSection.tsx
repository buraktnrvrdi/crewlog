'use client'

import { useState } from 'react'
import { gunlukEkle, gunlukSil } from '@/app/actions/gunluk'

type Gunluk = {
  id: string
  date: string
  weather: string
  worker_count: number
  notes: string | null
}

const HAVA_EMOJI: Record<string, string> = {
  'Güneşli': '☀️',
  'Bulutlu': '🌤️',
  'Yağmurlu': '🌧️',
  'Karlı': '❄️',
  'Rüzgarlı': '💨',
}

export default function GunlukSection({ siteId, gunlukler }: {
  siteId: string
  gunlukler: Gunluk[]
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
    const result = await gunlukEkle(formData)
    setYukleniyor(false)
    if (result.error) { setHata(result.error); return }
    setAcik(false);
    (e.target as HTMLFormElement).reset()
  }

  async function handleSil(id: string) {
    if (!confirm('Bu günlük kaydı silinsin mi?')) return
    await gunlukSil(id, siteId)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest">Şantiye Günlüğü</p>
        <button
          onClick={() => setAcik(!acik)}
          className="text-sm font-medium text-orange-500 hover:text-orange-400 transition-glass"
        >
          + Günlük Ekle
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
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Hava Durumu *</label>
              <select name="weather" required
                className="glass rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full appearance-none">
                <option value="">Seçin...</option>
                <option value="Güneşli">☀️ Güneşli</option>
                <option value="Bulutlu">🌤️ Bulutlu</option>
                <option value="Yağmurlu">🌧️ Yağmurlu</option>
                <option value="Karlı">❄️ Karlı</option>
                <option value="Rüzgarlı">💨 Rüzgarlı</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">İşçi Sayısı</label>
            <input name="worker_count" type="number" min="0"
              className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
              placeholder="0" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Notlar</label>
            <textarea name="notes" rows={3}
              className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full resize-none"
              placeholder="Günün özeti, yapılan işler, dikkat edilecek hususlar..." />
          </div>
          {hata && <p className="bg-[#F43F5E]/10 text-[#F43F5E] text-xs px-4 py-2.5 rounded-xl">{hata}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setAcik(false)}
              className="flex-1 glass rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-glass">
              İptal
            </button>
            <button type="submit" disabled={yukleniyor}
              className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold py-2.5 px-5 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)] text-sm">
              {yukleniyor ? 'Kaydediliyor...' : 'Günlük Ekle'}
            </button>
          </div>
        </form>
      )}

      <div className="glass-card overflow-hidden">
        {gunlukler.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-5 py-3">Tarih</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-4 py-3">Hava</th>
                <th className="text-center text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-4 py-3">İşçi</th>
                <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-4 py-3">Notlar</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {gunlukler.map(g => (
                <tr key={g.id} className="hover:bg-white/[0.02] transition-glass">
                  <td className="px-5 py-3 text-[#94A3B8] text-xs whitespace-nowrap">
                    {new Date(g.date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="flex items-center gap-1.5">
                      <span>{HAVA_EMOJI[g.weather] ?? '🌡️'}</span>
                      <span className="text-xs text-[#94A3B8]">{g.weather}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-medium text-white font-[family-name:var(--font-mono)]">{g.worker_count}</td>
                  <td className="px-4 py-3 text-xs text-white/30 max-w-xs truncate">{g.notes ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleSil(g.id)} className="text-xs text-white/30 hover:text-[#F43F5E] transition-glass">Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-10 text-center text-[#94A3B8] text-sm">Son 60 günde günlük kaydı yok</div>
        )}
      </div>
    </div>
  )
}
