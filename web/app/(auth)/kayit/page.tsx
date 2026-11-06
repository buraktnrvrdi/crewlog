'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function KayitPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/sirket-kur')
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="glass-card p-8 w-full max-w-sm fade-up">
        <div className="mb-8">
          <div className="font-[family-name:var(--font-outfit)] text-2xl font-semibold tracking-[-0.025em] text-white mb-1">
            CrewLog
          </div>
          <p className="text-sm text-[#94A3B8] mt-1">Ücretsiz başlayın</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-2 uppercase tracking-widest">
              Ad Soyad
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass"
              placeholder="Ahmet Yılmaz"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-2 uppercase tracking-widest">
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass"
              placeholder="ornek@firma.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-2 uppercase tracking-widest">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass"
              placeholder="En az 6 karakter"
              required
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
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold py-3 px-6 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.5)] mt-2"
          >
            {loading ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur →'}
          </button>
        </form>

        <p className="text-[#94A3B8] text-sm text-center mt-6">
          Zaten hesabınız var mı?{' '}
          <Link href="/giris" className="text-orange-500 hover:text-orange-400 font-medium transition-glass">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  )
}
