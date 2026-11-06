'use client'

import { useState, useEffect } from 'react'
import { davetOlustur, davetleriGetir, davetSil } from '@/app/actions/davet'
import { createClient } from '@/lib/supabase'

type Davet = {
  id: string
  code: string
  role: string
  use_count: number
  max_uses: number
  expires_at: string
  worker_id: string | null
}

type Isci = { id: string; full_name: string; job_title: string | null }

const ROL_LABEL: Record<string, string> = {
  admin: 'Yönetici',
  foreman: 'Şef / Ustabaşı',
  worker: 'Çalışan',
}

const ROL_RENK: Record<string, string> = {
  admin: 'bg-[#F43F5E]/10 text-[#F43F5E]',
  foreman: 'bg-[#3B82F6]/10 text-[#3B82F6]',
  worker: 'bg-[#10B981]/10 text-[#10B981]',
}

function kalanGun(expires_at: string): string {
  const kalan = Math.ceil((new Date(expires_at).getTime() - Date.now()) / 86400000)
  if (kalan <= 0) return 'Süresi doldu'
  return `${kalan} gün kaldı`
}

export default function DavetYonetim() {
  const [davetler, setDavetler] = useState<Davet[]>([])
  const [isciler, setIsciler] = useState<Isci[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [olusturuluyor, setOlusturuluyor] = useState(false)
  const [kopyalanan, setKopyalanan] = useState<string | null>(null)
  const [seciliRol, setSeciliRol] = useState<'admin' | 'foreman' | 'worker'>('foreman')
  const [seciliIsci, setSeciliIsci] = useState<string>('')

  useEffect(() => { getir() }, [])

  async function getir() {
    setYukleniyor(true)
    const [davetData, supabase] = [await davetleriGetir(), createClient()]

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
      if (profile?.company_id) {
        const { data: workers } = await supabase
          .from('workers')
          .select('id, full_name, job_title')
          .eq('company_id', profile.company_id)
          .eq('is_active', true)
          .order('full_name')
        setIsciler(workers ?? [])
      }
    }

    setDavetler(davetData as Davet[])
    setYukleniyor(false)
  }

  async function olustur() {
    if (seciliRol === 'worker' && !seciliIsci) return
    setOlusturuluyor(true)
    const result = await davetOlustur(seciliRol, seciliRol === 'worker' ? seciliIsci : undefined)
    if (result.success) await getir()
    setOlusturuluyor(false)
  }

  async function sil(id: string) {
    await davetSil(id)
    setDavetler(prev => prev.filter(d => d.id !== id))
  }

  function kopyala(kod: string) {
    navigator.clipboard.writeText(kod)
    setKopyalanan(kod)
    setTimeout(() => setKopyalanan(null), 2000)
  }

  const isciAdi = (workerId: string | null) => {
    if (!workerId) return null
    return isciler.find(i => i.id === workerId)?.full_name ?? null
  }

  return (
    <div className="space-y-6">
      {/* Yeni davet oluştur */}
      <div className="glass-card p-6 fade-up">
        <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-5">Yeni Davet Kodu Oluştur</p>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-2 uppercase tracking-widest">Rol</label>
            <select
              value={seciliRol}
              onChange={e => { setSeciliRol(e.target.value as any); setSeciliIsci('') }}
              className="glass rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass bg-transparent"
            >
              <option value="foreman" className="bg-[#0a0a0a] text-white">Şef / Ustabaşı</option>
              <option value="worker" className="bg-[#0a0a0a] text-white">Çalışan</option>
              <option value="admin" className="bg-[#0a0a0a] text-white">Yönetici</option>
            </select>
          </div>

          {seciliRol === 'worker' && (
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-2 uppercase tracking-widest">Çalışan</label>
              <select
                value={seciliIsci}
                onChange={e => setSeciliIsci(e.target.value)}
                className="glass rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass bg-transparent"
              >
                <option value="" className="bg-[#0a0a0a] text-white">Seçin...</option>
                {isciler.map(i => (
                  <option key={i.id} value={i.id} className="bg-[#0a0a0a] text-white">
                    {i.full_name}{i.job_title ? ` — ${i.job_title}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={olustur}
            disabled={olusturuluyor || (seciliRol === 'worker' && !seciliIsci)}
            className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold py-3 px-6 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.5)] text-sm"
          >
            {olusturuluyor ? 'Oluşturuluyor...' : 'Kod Oluştur'}
          </button>
        </div>
        <p className="text-xs text-white/30 mt-4">7 gün geçerli · 20 kez kullanılabilir</p>
      </div>

      {/* Aktif davet kodları */}
      <div className="glass-card overflow-hidden fade-up delay-100">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest">Aktif Davet Kodları</p>
        </div>

        {yukleniyor ? (
          <div className="p-8 text-center text-[#94A3B8] text-sm">Yükleniyor...</div>
        ) : davetler.length === 0 ? (
          <div className="p-8 text-center text-white/30 text-sm">Henüz davet kodu oluşturulmadı</div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {davetler.map(davet => {
              const suresi = kalanGun(davet.expires_at)
              const doldu = suresi === 'Süresi doldu'
              return (
                <div
                  key={davet.id}
                  className={`px-6 py-4 flex items-center justify-between gap-4 transition-glass hover:bg-white/[0.03] ${doldu ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="glass rounded-2xl px-6 py-3 font-[family-name:var(--font-mono)] text-xl font-bold text-white tracking-widest">
                      {davet.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ROL_RENK[davet.role] ?? 'bg-white/5 text-white/30'}`}>
                          {ROL_LABEL[davet.role] ?? davet.role}
                        </span>
                        {davet.worker_id && (
                          <span className="text-xs text-[#94A3B8]">{isciAdi(davet.worker_id)}</span>
                        )}
                        <span className="font-[family-name:var(--font-mono)] text-xs text-white/30">
                          {davet.use_count}/{davet.max_uses} kullanım
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${doldu ? 'text-[#F43F5E]' : 'text-[#94A3B8]'}`}>{suresi}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => kopyala(davet.code)}
                      className="glass rounded-xl px-3 py-1.5 text-xs text-white/70 hover:text-white transition-glass"
                    >
                      {kopyalanan === davet.code ? '✓ Kopyalandı' : 'Kopyala'}
                    </button>
                    <button
                      onClick={() => sil(davet.id)}
                      className="text-xs text-[#F43F5E]/60 hover:text-[#F43F5E] transition-glass px-2"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
