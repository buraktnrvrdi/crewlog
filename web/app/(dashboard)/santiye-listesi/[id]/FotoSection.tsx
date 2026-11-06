'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { fotoKaydet, fotoSil } from '@/app/actions/foto'

type Foto = {
  id: string
  url: string
  caption: string | null
  created_at: string
}

type Props = {
  siteId: string
  fotolar: Foto[]
}

export default function FotoSection({ siteId, fotolar: initialFotolar }: Props) {
  const [fotolar, setFotolar] = useState<Foto[]>(initialFotolar)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [caption, setCaption] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleDosyaSec(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setYukleniyor(true)
    setHata('')

    try {
      const supabase = createClient()
      const filePath = `${siteId}/${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from('site-photos')
        .upload(filePath, file, { contentType: file.type, upsert: false })

      if (error || !data) {
        setHata(error?.message ?? 'Yükleme hatası')
        setYukleniyor(false)
        return
      }

      const { data: urlData } = supabase.storage.from('site-photos').getPublicUrl(data.path)
      const publicUrl = urlData.publicUrl

      const result = await fotoKaydet(siteId, publicUrl, caption)
      if (result.error) {
        setHata(result.error)
        setYukleniyor(false)
        return
      }

      const yeniFoto: Foto = {
        id: Date.now().toString(),
        url: publicUrl,
        caption: caption || null,
        created_at: new Date().toISOString(),
      }
      setFotolar(prev => [yeniFoto, ...prev])
      setCaption('')
    } catch (err) {
      setHata('Beklenmeyen bir hata oluştu')
    } finally {
      setYukleniyor(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSil(id: string) {
    setFotolar(prev => prev.filter(f => f.id !== id))
    await fotoSil(id, siteId)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest">Fotoğraflar</p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Açıklama (isteğe bağlı)"
            className="glass rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 transition-glass w-48"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={yukleniyor}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-semibold py-2.5 px-4 rounded-xl transition-glass shadow-[0_8px_24px_-6px_rgba(220,38,38,0.4)] text-sm"
          >
            {yukleniyor ? 'Yükleniyor...' : '+ Fotoğraf Ekle'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleDosyaSec}
            className="hidden"
          />
        </div>
      </div>

      {hata && (
        <p className="text-sm text-[#F43F5E] mb-4">{hata}</p>
      )}

      {fotolar.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-sm text-white/30">Henüz fotoğraf eklenmedi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {fotolar.map((foto) => (
            <div key={foto.id} className="glass-card overflow-hidden group relative">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.url}
                  alt={foto.caption ?? 'Şantiye fotoğrafı'}
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => handleSil(foto.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#F43F5E] text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Sil"
                >
                  ✕
                </button>
              </div>
              {foto.caption && (
                <p className="px-3 py-2 text-xs text-[#94A3B8]">{foto.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
