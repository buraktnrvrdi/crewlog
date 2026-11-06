'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isciGuncelle } from '@/app/actions/isci'

type Worker = {
  id: string
  full_name: string
  phone: string | null
  tc_no: string | null
  job_title: string | null
  daily_wage: number
}

export default function IsciDuzenleForm({ worker }: { worker: Worker }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hata, setHata] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setHata('')

    const formData = new FormData(e.currentTarget)
    const result = await isciGuncelle(worker.id, formData)
    setLoading(false)

    if (result.error) {
      setHata(result.error)
    } else {
      router.push('/isci-listesi')
      router.refresh()
    }
  }

  return (
    <div className="glass-card p-8 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-lg font-[family-name:var(--font-outfit)]">
          {worker.full_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-white">{worker.full_name}</p>
          <p className="text-xs text-[#94A3B8]">Bilgileri güncelle</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-4">Kişisel Bilgiler</p>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Ad Soyad *</label>
              <input
                name="full_name"
                defaultValue={worker.full_name}
                required
                className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Telefon</label>
                <input
                  name="phone"
                  defaultValue={worker.phone ?? ''}
                  className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">TC Kimlik No</label>
                <input
                  name="tc_no"
                  defaultValue={worker.tc_no ?? ''}
                  maxLength={11}
                  className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-4">
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-4">İş Bilgileri</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Unvan</label>
              <input
                name="job_title"
                defaultValue={worker.job_title ?? ''}
                placeholder="Ör: Usta, Kalıpçı"
                className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Günlük Yevmiye (₺)</label>
              <input
                name="daily_wage"
                type="number"
                min="0"
                step="50"
                defaultValue={worker.daily_wage}
                className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
              />
            </div>
          </div>
        </div>

        {hata && (
          <p className="bg-[#F43F5E]/10 text-[#F43F5E] text-sm px-4 py-2.5 rounded-xl">{hata}</p>
        )}

        <div className="flex gap-3 pt-2">
          <a
            href="/isci-listesi"
            className="flex-1 text-center glass rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-glass"
          >
            İptal
          </a>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold py-2.5 px-5 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)] text-sm"
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  )
}
