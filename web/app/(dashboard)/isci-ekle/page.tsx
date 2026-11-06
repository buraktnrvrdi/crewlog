'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isciEkle } from '@/app/actions/isci'

export default function IsciEklePage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const result = await isciEkle(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/isci-listesi')
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 fade-up">
        <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)] tracking-[-0.025em]">
          İşçi Ekle
        </h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">Yeni işçi kaydı oluştur</p>
      </div>

      <div className="glass-card p-8 max-w-lg fade-up delay-50">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-4">Kişisel Bilgiler</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Ad Soyad *</label>
                <input
                  name="full_name"
                  type="text"
                  className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
                  placeholder="Ahmet Yılmaz"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Telefon</label>
                <input
                  name="phone"
                  type="tel"
                  className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
                  placeholder="0532 000 00 00"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">TC Kimlik No</label>
                <input
                  name="tc_no"
                  type="text"
                  maxLength={11}
                  className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
                  placeholder="12345678901"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-5">
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest mb-4">İş Bilgileri</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Unvan / Meslek</label>
                <input
                  name="job_title"
                  type="text"
                  className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
                  placeholder="Kalıpçı, Demirci, Boyacı..."
                  defaultValue="İşçi"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Günlük Yevmiye (₺)</label>
                <input
                  name="daily_wage"
                  type="number"
                  min="0"
                  step="0.01"
                  className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
                  placeholder="1500"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="bg-[#F43F5E]/10 text-[#F43F5E] text-sm px-4 py-2.5 rounded-xl">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href="/isci-listesi"
              className="flex-1 text-center glass rounded-xl px-4 py-2.5 text-sm text-white/70 hover:text-white transition-glass"
            >
              İptal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold py-2.5 px-5 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)] text-sm"
            >
              {loading ? 'Ekleniyor...' : 'İşçi Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
