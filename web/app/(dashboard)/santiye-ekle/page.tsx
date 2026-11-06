'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { santiyeEkle } from '@/app/actions/santiye'

export default function SantiyeEklePage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const result = await santiyeEkle(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/santiye-listesi')
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 fade-up">
        <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)] tracking-[-0.025em]">
          Şantiye Ekle
        </h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">Yeni şantiye kaydı oluştur</p>
      </div>

      <div className="glass-card p-8 max-w-lg fade-up delay-50">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-4">Şantiye Bilgileri</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Şantiye Adı *</label>
                <input
                  name="name"
                  type="text"
                  className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
                  placeholder="Örn: Kadıköy Konut Projesi"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Adres</label>
                <textarea
                  name="address"
                  rows={3}
                  className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full resize-none"
                  placeholder="Şantiye adresi"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="bg-[#F43F5E]/10 text-[#F43F5E] text-sm px-4 py-2.5 rounded-xl">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href="/santiye-listesi"
              className="flex-1 text-center glass rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-glass"
            >
              İptal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold py-2.5 px-5 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)] text-sm"
            >
              {loading ? 'Ekleniyor...' : 'Şantiye Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
