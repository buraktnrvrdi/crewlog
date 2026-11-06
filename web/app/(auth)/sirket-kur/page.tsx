'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sirketOlustur } from '@/app/actions/sirket'
import { createClient } from '@/lib/supabase'
import { davetKullan } from '@/app/actions/davet'

export default function SirketKurPage() {
  const router = useRouter()
  const [mod, setMod] = useState<'secim' | 'yeni' | 'davet'>('secim')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [davetKod, setDavetKod] = useState('')

  async function handleSirketKur(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await sirketOlustur(formData)
    if (result.error) { setError(result.error); setLoading(false); return }
    router.push('/dashboard')
  }

  async function handleDavetKullan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Oturum bulunamadı'); setLoading(false); return }

    const result = await davetKullan(davetKod, user.id)

    if (result.error) { setError(result.error); setLoading(false); return }
    router.push('/dashboard')
  }

  if (mod === 'secim') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="glass-card p-8 w-full max-w-sm fade-up">
          <div className="mb-8 text-center">
            <div className="font-[family-name:var(--font-outfit)] text-2xl font-semibold tracking-[-0.025em] text-white mb-1">
              CrewLog
            </div>
            <h1 className="font-[family-name:var(--font-outfit)] text-2xl font-semibold tracking-[-0.025em] text-white mt-4">
              Hoş Geldiniz
            </h1>
            <p className="text-sm text-[#94A3B8] mt-1">Nasıl devam etmek istersiniz?</p>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => setMod('yeni')}
              className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3 px-6 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.5)]"
            >
              Yeni Şirket Kur
            </button>
            <button
              onClick={() => setMod('davet')}
              className="w-full glass rounded-xl px-4 py-3 text-sm text-white/70 hover:text-white transition-glass font-medium"
            >
              Davet Kodum Var
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mod === 'davet') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="glass-card p-8 w-full max-w-sm fade-up">
          <button
            onClick={() => setMod('secim')}
            className="text-sm text-[#94A3B8] hover:text-white mb-6 block transition-glass"
          >
            ← Geri
          </button>

          <div className="mb-8">
            <h1 className="font-[family-name:var(--font-outfit)] text-2xl font-semibold tracking-[-0.025em] text-white">
              Davet Kodu Gir
            </h1>
            <p className="text-sm text-[#94A3B8] mt-1">Şefinizden aldığınız 6 haneli kodu girin</p>
          </div>

          <form onSubmit={handleDavetKullan} className="mt-8 space-y-4">
            <input
              type="text"
              maxLength={6}
              required
              placeholder="ABC123"
              value={davetKod}
              onChange={e => setDavetKod(e.target.value.toUpperCase())}
              className="w-full glass rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass text-center text-2xl font-[family-name:var(--font-mono)] font-bold tracking-widest uppercase"
            />

            {error && (
              <div className="glass rounded-xl px-4 py-3 text-sm text-[#F43F5E] border border-[#F43F5E]/20 mt-1">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold py-3 px-6 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.5)]"
            >
              {loading ? 'Kontrol ediliyor...' : 'Şirkete Katıl →'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="glass-card p-8 w-full max-w-sm fade-up">
        <button
          onClick={() => setMod('secim')}
          className="text-sm text-[#94A3B8] hover:text-white mb-6 block transition-glass"
        >
          ← Geri
        </button>

        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-outfit)] text-2xl font-semibold tracking-[-0.025em] text-white">
            Şirketinizi Kurun
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">Son adım — şirket bilgilerini girin</p>
        </div>

        <form onSubmit={handleSirketKur} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-2 uppercase tracking-widest">
              Şirket Adı
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Yılmaz İnşaat Ltd. Şti."
              className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-2 uppercase tracking-widest">
              Telefon
            </label>
            <input
              name="phone"
              type="tel"
              placeholder="0532 000 00 00"
              className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-2 uppercase tracking-widest">
              Adres
            </label>
            <textarea
              name="address"
              rows={2}
              placeholder="İstanbul, Türkiye"
              className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass resize-none"
            />
          </div>

          {error && (
            <div className="glass rounded-xl px-4 py-3 text-sm text-[#F43F5E] border border-[#F43F5E]/20 mt-1">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold py-3 px-6 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.5)]"
          >
            {loading ? 'Oluşturuluyor...' : 'Şirketi Kur ve Başla →'}
          </button>
        </form>
      </div>
    </div>
  )
}
