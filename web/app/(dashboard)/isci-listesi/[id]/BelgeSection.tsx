'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { belgeKaydet, belgeSil } from '@/app/actions/belge'

type Belge = {
  id: string
  type: string
  name: string
  file_url: string
  expires_at: string | null
  created_at: string
}

const TIP_LABEL: Record<string, string> = {
  kimlik: 'Kimlik',
  sigorta: 'Sigorta',
  ehliyet: 'Ehliyet',
  sertifika: 'Sertifika',
  diger: 'Diğer',
}

const TIP_RENK: Record<string, string> = {
  kimlik: 'bg-[#3B82F6]/10 text-[#3B82F6]',
  sigorta: 'bg-[#10B981]/10 text-[#10B981]',
  ehliyet: 'bg-amber-500/10 text-amber-400',
  sertifika: 'bg-orange-500/10 text-orange-400',
  diger: 'bg-white/5 text-white/30',
}

function yakindaMiBitiyor(expiresAt: string): boolean {
  const kalan = new Date(expiresAt).getTime() - Date.now()
  return kalan > 0 && kalan < 30 * 86400000
}

function bitmismi(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now()
}

export default function BelgeSection({ workerId, companyId, belgeler }: {
  workerId: string
  companyId: string
  belgeler: Belge[]
}) {
  const [acik, setAcik] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [tip, setTip] = useState('kimlik')
  const [dosya, setDosya] = useState<File | null>(null)
  const [ad, setAd] = useState('')
  const [bitis, setBitis] = useState('')

  async function handleYukle(e: React.FormEvent) {
    e.preventDefault()
    if (!dosya) { setHata('Dosya seçin'); return }
    setYukleniyor(true)
    setHata('')

    const supabase = createClient()
    const path = `${companyId}/${workerId}/${Date.now()}-${dosya.name}`
    const { data, error } = await supabase.storage.from('worker-documents').upload(path, dosya)

    if (error) { setHata(error.message); setYukleniyor(false); return }

    const { data: { publicUrl } } = supabase.storage.from('worker-documents').getPublicUrl(data.path)

    const result = await belgeKaydet(workerId, tip, ad || dosya.name, publicUrl, bitis || undefined)
    setYukleniyor(false)
    if (result.error) { setHata(result.error); return }

    setAcik(false)
    setDosya(null)
    setAd('')
    setBitis('')
    setTip('kimlik')
  }

  async function handleSil(id: string, fileUrl: string) {
    if (!confirm('Bu belge silinsin mi?')) return
    await belgeSil(id, workerId, fileUrl)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest">Belgeler</p>
        <button onClick={() => setAcik(!acik)} className="text-sm font-medium text-orange-500 hover:text-orange-400 transition-glass">
          + Belge Ekle
        </button>
      </div>

      {acik && (
        <form onSubmit={handleYukle} className="glass-card p-5 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Belge Tipi</label>
              <select value={tip} onChange={e => setTip(e.target.value)}
                className="glass rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full appearance-none">
                {Object.entries(TIP_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Son Geçerlilik (opsiyonel)</label>
              <input type="date" value={bitis} onChange={e => setBitis(e.target.value)}
                className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Belge Adı (opsiyonel)</label>
            <input type="text" value={ad} onChange={e => setAd(e.target.value)} placeholder="Kimlik ön yüz, İş makinesi ehliyeti..."
              className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Dosya *</label>
            <input type="file" accept="image/*,.pdf" onChange={e => setDosya(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-[#94A3B8] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/[0.08] file:text-white/70 hover:file:bg-white/[0.12]" />
          </div>
          {hata && <p className="bg-[#F43F5E]/10 text-[#F43F5E] text-xs px-4 py-2.5 rounded-xl">{hata}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setAcik(false)}
              className="flex-1 glass rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-glass">İptal</button>
            <button type="submit" disabled={yukleniyor}
              className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold py-2.5 px-5 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)] text-sm">
              {yukleniyor ? 'Yükleniyor...' : 'Belge Yükle'}
            </button>
          </div>
        </form>
      )}

      <div className="glass-card overflow-hidden">
        {belgeler.length > 0 ? (
          <div className="divide-y divide-white/[0.06]">
            {belgeler.map(b => {
              const bitti = b.expires_at ? bitmismi(b.expires_at) : false
              const yakin = b.expires_at && !bitti ? yakindaMiBitiyor(b.expires_at) : false
              return (
                <div key={b.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-glass">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${TIP_RENK[b.type] ?? TIP_RENK.diger}`}>
                    {TIP_LABEL[b.type] ?? b.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{b.name}</p>
                    {b.expires_at && (
                      <p className={`text-xs mt-0.5 ${bitti ? 'text-[#F43F5E] font-medium' : yakin ? 'text-amber-400' : 'text-white/30'}`}>
                        {bitti ? '⚠ Süresi doldu' : yakin ? '⚠ 30 gün içinde doluyor' : ''}
                        {!bitti && !yakin && `Geçerlilik: ${new Date(b.expires_at + 'T00:00:00').toLocaleDateString('tr-TR')}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <a href={b.file_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#3B82F6] hover:text-[#3B82F6]/70 font-medium transition-glass">
                      Görüntüle
                    </a>
                    <button onClick={() => handleSil(b.id, b.file_url)} className="text-xs text-white/30 hover:text-[#F43F5E] transition-glass">
                      Sil
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-10 text-center text-[#94A3B8] text-sm">Belge yüklenmemiş</div>
        )}
      </div>
    </div>
  )
}
