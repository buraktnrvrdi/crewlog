'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

export default function QrGoster({
  isciId, adSoyad, unvan, qrKod
}: {
  isciId: string
  adSoyad: string
  unvan: string
  qrKod: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    QRCode.toDataURL(qrKod, {
      width: 300,
      margin: 2,
      color: { dark: '#111827', light: '#ffffff' }
    }).then(url => setQrDataUrl(url))
  }, [qrKod])

  function yazdir() {
    const yazdirilacak = printRef.current
    if (!yazdirilacak) return

    const pencere = window.open('', '_blank')
    if (!pencere) return

    pencere.document.write(`
      <html>
        <head>
          <title>${adSoyad} — QR Kart</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial, sans-serif; }
            .kart { border: 2px solid #E5E7EB; border-radius: 16px; padding: 32px; text-align: center; width: 280px; }
            .logo { font-size: 14px; font-weight: 800; color: #DC2626; margin-bottom: 20px; }
            .qr { width: 220px; height: 220px; }
            .ad { font-size: 20px; font-weight: 700; color: #111827; margin-top: 16px; }
            .unvan { font-size: 13px; color: #6B7280; margin-top: 4px; }
            .alt { font-size: 11px; color: #9CA3AF; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="kart">
            <div class="logo">CrewLog</div>
            <img class="qr" src="${qrDataUrl}" />
            <div class="ad">${adSoyad}</div>
            <div class="unvan">${unvan}</div>
            <div class="alt">Şantiye giriş kartı</div>
          </div>
        </body>
      </html>
    `)
    pencere.document.close()
    setTimeout(() => {
      pencere.print()
      pencere.close()
    }, 500)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Kart önizleme */}
      <div ref={printRef} className="bg-white border-2 border-gray-200 rounded-2xl p-8 flex flex-col items-center w-72 shadow-sm">
        <p className="text-sm font-bold text-orange-500 mb-5">CrewLog</p>

        {qrDataUrl ? (
          <img src={qrDataUrl} alt="QR Kod" className="w-56 h-56" />
        ) : (
          <div className="w-56 h-56 bg-gray-100 rounded-lg animate-pulse" />
        )}

        <p className="text-xl font-bold text-gray-900 mt-5 text-center">{adSoyad}</p>
        <p className="text-sm text-gray-500 mt-1">{unvan}</p>
        <p className="text-xs text-gray-400 mt-4">Şantiye giriş kartı</p>
      </div>

      {/* Butonlar */}
      <div className="flex gap-3">
        <a
          href="/isci-listesi"
          className="border border-gray-300 text-gray-700 font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          Geri Dön
        </a>
        <button
          onClick={yazdir}
          disabled={!qrDataUrl}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          Yazdır / PDF Kaydet
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center max-w-xs">
        "Yazdır" dedikten sonra PDF olarak kaydetmek için yazıcı seçiminde "PDF Olarak Kaydet" seçeneğini kullan.
      </p>
    </div>
  )
}
