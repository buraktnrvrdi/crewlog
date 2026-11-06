'use client'

import { useState } from 'react'
import Image from 'next/image'
import { profilGuncelle, sifreDegistir } from '@/app/actions/profil'
import { AVATARLAR, avatarGradient, avatarImage } from './avatarlar'

type Props = {
  full_name: string
  email: string
  rolLabel: string
  avatar_color: string | null
}

export default function ProfilForm({ full_name, email, rolLabel, avatar_color }: Props) {
  const [secili, setSecili] = useState(avatar_color ?? 'red')

  const [adLoading, setAdLoading] = useState(false)
  const [adMesaj, setAdMesaj] = useState<{ tip: 'ok' | 'err'; text: string } | null>(null)

  const [sifreLoading, setSifreLoading] = useState(false)
  const [sifreMesaj, setSifreMesaj] = useState<{ tip: 'ok' | 'err'; text: string } | null>(null)

  const initial = full_name?.charAt(0)?.toUpperCase() ?? '?'
  const [from, to] = avatarGradient(secili)
  const imgSrc = avatarImage(secili)

  async function handleAd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setAdLoading(true)
    setAdMesaj(null)
    const fd = new FormData(e.currentTarget)
    fd.set('avatar_color', secili)
    const result = await profilGuncelle(fd)
    setAdLoading(false)
    if (result.error) setAdMesaj({ tip: 'err', text: result.error })
    else setAdMesaj({ tip: 'ok', text: 'Bilgiler güncellendi' })
  }

  async function handleSifre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSifreLoading(true)
    setSifreMesaj(null)
    const form = e.currentTarget
    const result = await sifreDegistir(new FormData(form))
    setSifreLoading(false)
    if (result.error) setSifreMesaj({ tip: 'err', text: result.error })
    else {
      setSifreMesaj({ tip: 'ok', text: 'Şifre başarıyla değiştirildi' })
      form.reset()
    }
  }

  return (
    <div className="space-y-5">

      {/* Avatar büyük önizleme */}
      <div className="glass-card p-6 flex flex-col items-center gap-3">
        {imgSrc ? (
          <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 relative" style={{ background: '#111', boxShadow: 'inset 0 0 0 3px #111' }}>
            <Image src={imgSrc} alt="avatar" width={80} height={80} className="w-full h-full object-cover scale-[1.04]" />
          </div>
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white transition-all duration-300"
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          >
            {initial}
          </div>
        )}
        <div className="text-center">
          <p className="font-semibold text-white text-base">{full_name}</p>
          <p className="text-sm text-[#6B7280]">{email}</p>
          <span className="text-xs font-medium mt-1.5 inline-block px-2.5 py-0.5 rounded-full bg-white/[0.06] text-[#94A3B8]">
            {rolLabel}
          </span>
        </div>
      </div>

      {/* Profil seçici */}
      <div className="glass-card p-6">
        <p className="text-xs font-semibold tracking-widest text-[#374151] uppercase mb-4">Profil Görseli</p>
        <div className="grid grid-cols-7 gap-2.5">
          {AVATARLAR.map(av => {
            const aktif = secili === av.id
            return (
              <button
                key={av.id}
                type="button"
                onClick={() => setSecili(av.id)}
                title={av.label}
                className="rounded-full transition-all duration-200 flex-shrink-0 overflow-hidden"
                style={{
                  width: 40,
                  height: 40,
                  outline: aktif ? '2px solid #DC2626' : '2px solid transparent',
                  outlineOffset: '3px',
                  transform: aktif ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                {av.type === 'image' ? (
                  <div className="w-full h-full overflow-hidden rounded-full" style={{ background: '#111', boxShadow: 'inset 0 0 0 2px #111' }}>
                    <Image src={av.src} alt={av.label} width={40} height={40} className="w-full h-full object-cover scale-[1.04]" />
                  </div>
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: `linear-gradient(135deg, ${av.gradient[0]}, ${av.gradient[1]})` }}
                  >
                    {initial}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Kişisel bilgiler */}
      <div className="glass-card p-6">
        <p className="text-xs font-semibold tracking-widest text-[#374151] uppercase mb-5">Kişisel Bilgiler</p>
        <form onSubmit={handleAd} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Ad Soyad</label>
            <input
              name="full_name"
              defaultValue={full_name}
              required
              className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">E-posta</label>
            <input
              value={email}
              disabled
              className="glass rounded-xl px-4 py-3 text-sm text-white/40 w-full cursor-not-allowed"
            />
          </div>
          {adMesaj && (
            <p className={`text-sm px-4 py-2.5 rounded-xl ${adMesaj.tip === 'ok' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#F43F5E]/10 text-[#F43F5E]'}`}>
              {adMesaj.text}
            </p>
          )}
          <button
            type="submit"
            disabled={adLoading}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-semibold py-2.5 px-6 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)] text-sm"
          >
            {adLoading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      </div>

      {/* Şifre değiştir */}
      <div className="glass-card p-6">
        <p className="text-xs font-semibold tracking-widest text-[#374151] uppercase mb-5">Şifre Değiştir</p>
        <form onSubmit={handleSifre} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Yeni Şifre</label>
            <input
              name="yeni_sifre"
              type="password"
              minLength={6}
              required
              placeholder="En az 6 karakter"
              className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Yeni Şifre (Tekrar)</label>
            <input
              name="yeni_sifre_tekrar"
              type="password"
              required
              placeholder="Şifreyi tekrar girin"
              className="glass rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-full"
            />
          </div>
          {sifreMesaj && (
            <p className={`text-sm px-4 py-2.5 rounded-xl ${sifreMesaj.tip === 'ok' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#F43F5E]/10 text-[#F43F5E]'}`}>
              {sifreMesaj.text}
            </p>
          )}
          <button
            type="submit"
            disabled={sifreLoading}
            className="glass hover:bg-white/[0.08] disabled:opacity-40 text-white font-semibold py-2.5 px-6 rounded-xl transition-glass text-sm"
          >
            {sifreLoading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
          </button>
        </form>
      </div>

    </div>
  )
}
