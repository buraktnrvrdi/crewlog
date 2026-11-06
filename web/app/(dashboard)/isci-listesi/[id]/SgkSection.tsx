'use client'

import { useState } from 'react'
import { sgkKayitEkle, sgkCikisBelirle } from '@/app/actions/sgk'

type SgkKayit = {
  id: string
  start_date: string
  end_date: string | null
  sgk_no: string | null
  notes: string | null
}

export default function SgkSection({ workerId, kayitlar }: {
  workerId: string
  kayitlar: SgkKayit[]
}) {
  const [acik, setAcik] = useState(false)
  const [cikisAcik, setCikisAcik] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [cikisTarihi, setCikisTarihi] = useState('')

  const aktifKayit = kayitlar.find(k => !k.end_date)

  async function handleEkle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setYukleniyor(true)
    setHata('')
    const formData = new FormData(e.currentTarget)
    formData.set('worker_id', workerId)
    const result = await sgkKayitEkle(formData)
    setYukleniyor(false)
    if (result.error) { setHata(result.error); return }
    setAcik(false)
  }

  async function handleCikis(id: string) {
    if (!cikisTarihi) return
    setYukleniyor(true)
    await sgkCikisBelirle(id, workerId, cikisTarihi)
    setYukleniyor(false)
    setCikisAcik(null)
    setCikisTarihi('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest">SGK Takibi</p>
        {!aktifKayit && (
          <button onClick={() => setAcik(!acik)} className="text-sm font-medium text-orange-500 hover:text-orange-400 transition-glass">
            + SGK Girişi Ekle
          </button>
        )}
      </div>

      {acik && (
        <form onSubmit={handleEkle} className="glass-card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">İşe Giriş Tarihi *</label>
              <input name="start_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]}
                className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">SGK Sicil No</label>
              <input name="sgk_no" type="text" placeholder="1234567890"
                className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Not</label>
            <input name="notes" type="text" placeholder="Muhasebe notu..."
              className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full" />
          </div>
          {hata && <p className="bg-[#F43F5E]/10 text-[#F43F5E] text-xs px-4 py-2.5 rounded-xl">{hata}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setAcik(false)}
              className="flex-1 glass rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-glass">İptal</button>
            <button type="submit" disabled={yukleniyor}
              className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold py-2.5 px-5 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)] text-sm">
              {yukleniyor ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      )}

      <div className="glass-card overflow-hidden">
        {kayitlar.length > 0 ? (
          <div className="divide-y divide-white/[0.06]">
            {kayitlar.map(k => (
              <div key={k.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${k.end_date ? 'bg-white/5 text-white/30' : 'bg-[#10B981]/10 text-[#10B981]'}`}>
                      {k.end_date ? 'Çıkış Yapıldı' : 'Aktif'}
                    </span>
                    <div>
                      <p className="text-sm text-white/70">
                        <span className="font-medium text-white">Giriş:</span>{' '}
                        {new Date(k.start_date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {k.end_date && (
                        <p className="text-sm text-[#94A3B8] mt-0.5">
                          <span className="font-medium">Çıkış:</span>{' '}
                          {new Date(k.end_date + 'T00:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                      {k.sgk_no && <p className="text-xs text-white/30 mt-0.5">SGK No: {k.sgk_no}</p>}
                      {k.notes && <p className="text-xs text-white/30 mt-0.5">{k.notes}</p>}
                    </div>
                  </div>
                  {!k.end_date && (
                    <button onClick={() => setCikisAcik(cikisAcik === k.id ? null : k.id)}
                      className="text-xs text-[#F43F5E] hover:text-[#F43F5E]/70 font-medium border border-white/[0.06] px-3 py-1.5 rounded-xl hover:border-[#F43F5E]/30 transition-glass">
                      İşten Çıkış
                    </button>
                  )}
                </div>
                {cikisAcik === k.id && (
                  <div className="mt-3 flex items-center gap-3 glass p-3 rounded-xl">
                    <input type="date" value={cikisTarihi} onChange={e => setCikisTarihi(e.target.value)}
                      className="glass rounded-xl px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass" />
                    <button onClick={() => handleCikis(k.id)} disabled={!cikisTarihi || yukleniyor}
                      className="bg-[#F43F5E]/80 hover:bg-[#F43F5E] disabled:opacity-40 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-glass">
                      Çıkışı Kaydet
                    </button>
                    <button onClick={() => setCikisAcik(null)} className="text-sm text-white/30 hover:text-white transition-glass">İptal</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-[#94A3B8] text-sm">SGK kaydı yok</div>
        )}
      </div>
    </div>
  )
}
