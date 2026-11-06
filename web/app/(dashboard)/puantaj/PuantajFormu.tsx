'use client'

import { useState, useEffect } from 'react'
import { puantajKaydet, puantajGetir } from '@/app/actions/puantaj'
import { useRouter } from 'next/navigation'
import PuantajTakvim from './PuantajTakvim'

type Santiye = { id: string; name: string }
type Isci = { id: string; full_name: string; job_title: string | null }
type Durum = 'present' | 'absent' | 'half_day' | 'overtime'

const DURUM_LABEL: Record<Durum, string> = {
  present: 'Geldi',
  absent: 'Gelmedi',
  half_day: 'Yarım Gün',
  overtime: 'Fazla Mesai',
}

const DURUM_AKTIF_RENK: Record<Durum, string> = {
  present: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30',
  absent: 'bg-[#F43F5E]/10 text-[#F43F5E] border-[#F43F5E]/30',
  half_day: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  overtime: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30',
}

export default function PuantajFormu({
  santiyeler, isciler, companyId
}: {
  santiyeler: Santiye[]
  isciler: Isci[]
  companyId: string
}) {
  const router = useRouter()
  const bugun = new Date().toISOString().split('T')[0]

  const [seciliSantiye, setSeciliSantiye] = useState(santiyeler[0].id)
  const [seciliTarih, setSeciliTarih] = useState(bugun)
  const [durumlar, setDurumlar] = useState<Record<string, Durum>>({})
  const [fazlaMesai, setFazlaMesai] = useState<Record<string, number>>({})
  const [saatler, setSaatler] = useState<Record<string, { check_in?: string; check_out?: string }>>({})
  const [loading, setLoading] = useState(false)
  const [kayitliSayisi, setKayitliSayisi] = useState(0)
  const [takvimAcik, setTakvimAcik] = useState(false)

  useEffect(() => {
    const varsayilan: Record<string, Durum> = {}
    isciler.forEach(i => { varsayilan[i.id] = 'absent' })
    setDurumlar(varsayilan)
  }, [isciler])

  useEffect(() => {
    async function mevcutKayitlariGetir() {
      const kayitlar = await puantajGetir(companyId, seciliSantiye, seciliTarih)
      if (kayitlar.length > 0) {
        const yeniDurumlar: Record<string, Durum> = {}
        const yeniFazla: Record<string, number> = {}
        const yeniSaatler: Record<string, { check_in?: string; check_out?: string }> = {}
        kayitlar.forEach((k: { worker_id: string; status: Durum; overtime_hours: number; check_in?: string; check_out?: string }) => {
          yeniDurumlar[k.worker_id] = k.status
          if (k.overtime_hours) yeniFazla[k.worker_id] = k.overtime_hours
          if (k.check_in || k.check_out) yeniSaatler[k.worker_id] = { check_in: k.check_in, check_out: k.check_out }
        })
        setDurumlar(prev => ({ ...prev, ...yeniDurumlar }))
        setFazlaMesai(yeniFazla)
        setSaatler(yeniSaatler)
        setKayitliSayisi(kayitlar.length)
      } else {
        setKayitliSayisi(0)
      }
    }
    mevcutKayitlariGetir()
  }, [seciliSantiye, seciliTarih, companyId])

  function durumDegistir(isciId: string, durum: Durum) {
    setDurumlar(prev => ({ ...prev, [isciId]: durum }))
  }

  async function handleKaydet() {
    setLoading(true)
    const entries = isciler.map(isci => ({
      worker_id: isci.id,
      site_id: seciliSantiye,
      date: seciliTarih,
      status: durumlar[isci.id] ?? 'present',
      overtime_hours: fazlaMesai[isci.id] ?? 0,
    }))

    const result = await puantajKaydet(entries)
    setLoading(false)

    if (result.success) {
      setKayitliSayisi(entries.length)
      router.refresh()
    }
  }

  const gelenSayisi = Object.values(durumlar).filter(d => d === 'present' || d === 'overtime').length
  const gelmeyenSayisi = Object.values(durumlar).filter(d => d === 'absent').length

  return (
    <div className="space-y-5">
      {/* Filtre satırı */}
      <div className="glass-card p-5 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-[#94A3B8] mb-2 uppercase tracking-widest">Şantiye</label>
          <select
            value={seciliSantiye}
            onChange={e => setSeciliSantiye(e.target.value)}
            className="glass rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass bg-transparent"
          >
            {santiyeler.map(s => (
              <option key={s.id} value={s.id} className="bg-[#0a0a0a] text-white">{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#94A3B8] mb-2 uppercase tracking-widest">Tarih</label>
          <input
            type="date"
            value={seciliTarih}
            onChange={e => setSeciliTarih(e.target.value)}
            className="glass rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass bg-transparent"
          />
        </div>
        <div className="flex gap-3 ml-auto items-center">
          {kayitliSayisi > 0 && (
            <span className="text-xs bg-[#10B981]/10 text-[#10B981] px-3 py-1.5 rounded-full font-medium">
              ✓ {kayitliSayisi} kayıt mevcut
            </span>
          )}
          <div className="font-[family-name:var(--font-mono)] text-xs text-[#94A3B8]">
            <span className="text-[#10B981] font-medium">{gelenSayisi} geldi</span>
            {' · '}
            <span className="text-[#F43F5E] font-medium">{gelmeyenSayisi} gelmedi</span>
          </div>
          <button
            onClick={() => setTakvimAcik(v => !v)}
            className="glass rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-glass"
          >
            {takvimAcik ? 'Takvimi Kapat' : 'Takvim Görünümü'}
          </button>
        </div>
      </div>

      {takvimAcik && (
        <PuantajTakvim
          companyId={companyId}
          santiyeler={santiyeler}
          onTarihSec={(t) => { setSeciliTarih(t); setTakvimAcik(false) }}
          secilenTarih={seciliTarih}
        />
      )}

      {/* İşçi listesi */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-5 py-3">İşçi</th>
              <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-5 py-3">Durum</th>
              <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-5 py-3">Giriş / Çıkış</th>
              <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-5 py-3">Fazla Mesai (saat)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {isciler.map((isci) => (
              <tr key={isci.id} className="hover:bg-white/[0.03] transition-glass">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-orange-500 text-sm font-semibold flex-shrink-0">
                      {isci.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{isci.full_name}</p>
                      {isci.job_title && <p className="text-xs text-[#94A3B8]">{isci.job_title}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(DURUM_LABEL) as Durum[]).map(d => (
                      <button
                        key={d}
                        onClick={() => durumDegistir(isci.id, d)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-glass ${
                          durumlar[isci.id] === d
                            ? DURUM_AKTIF_RENK[d]
                            : 'glass text-white/30 border-white/10 hover:text-white/60'
                        }`}
                      >
                        {DURUM_LABEL[d]}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4">
                  {saatler[isci.id] ? (
                    <div className="font-[family-name:var(--font-mono)] text-xs space-y-0.5">
                      <div>
                        <span className="text-[#10B981] font-medium">▲</span>{' '}
                        <span className="text-[#94A3B8]">
                          {saatler[isci.id].check_in
                            ? new Date(saatler[isci.id].check_in!).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#3B82F6] font-medium">▼</span>{' '}
                        <span className="text-[#94A3B8]">
                          {saatler[isci.id].check_out
                            ? new Date(saatler[isci.id].check_out!).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-white/30">QR bekleniyor</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  {durumlar[isci.id] === 'overtime' && (
                    <input
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      value={fazlaMesai[isci.id] ?? ''}
                      onChange={e => setFazlaMesai(prev => ({ ...prev, [isci.id]: parseFloat(e.target.value) || 0 }))}
                      className="w-24 glass rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass font-[family-name:var(--font-mono)]"
                      placeholder="2"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Kaydet butonu */}
      <div className="flex justify-end">
        <button
          onClick={handleKaydet}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold py-3 px-8 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.5)] text-sm"
        >
          {loading ? 'Kaydediliyor...' : 'Puantajı Kaydet'}
        </button>
      </div>
    </div>
  )
}
