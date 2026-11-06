'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { santiyeGuncelle } from '@/app/actions/santiye'

type Site = { id: string; name: string; address: string | null }

export default function SantiyeDuzenleForm({ site }: { site: Site }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [hata, setHata] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setHata('')

    const formData = new FormData(e.currentTarget)
    const result = await santiyeGuncelle(site.id, formData)
    setLoading(false)

    if (result.error) {
      setHata(result.error)
    } else {
      router.push('/santiye-listesi')
      router.refresh()
    }
  }

  return (
    <div className="glass-card p-8 max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-4">Şantiye Bilgileri</p>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Şantiye Adı *</label>
              <input
                name="name"
                defaultValue={site.name}
                required
                className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Adres</label>
              <textarea
                name="address"
                defaultValue={site.address ?? ''}
                rows={3}
                className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full resize-none"
              />
            </div>
          </div>
        </div>

        {hata && <p className="bg-[#F43F5E]/10 text-[#F43F5E] text-sm px-4 py-2.5 rounded-xl">{hata}</p>}

        <div className="flex gap-3 pt-2">
          <a
            href="/santiye-listesi"
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
