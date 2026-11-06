'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isciDurumGuncelle } from '@/app/actions/isci'

type Isci = {
  id: string
  full_name: string
  phone: string | null
  job_title: string | null
  daily_wage: number
  is_active: boolean
  qr_code: string
}

export default function IsciKartlari({ isciler }: { isciler: Isci[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function toggleDurum(id: string, isActive: boolean) {
    setLoading(id)
    await isciDurumGuncelle(id, !isActive)
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="glass-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-6 py-3">Ad Soyad</th>
            <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-6 py-3">Unvan</th>
            <th className="text-left text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-6 py-3">Telefon</th>
            <th className="text-right text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-6 py-3">Yevmiye</th>
            <th className="text-center text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-6 py-3">Durum</th>
            <th className="text-center text-xs font-medium text-[#94A3B8] uppercase tracking-widest px-6 py-3">QR Kart</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {isciler.map((isci) => (
            <tr key={isci.id} className="hover:bg-white/[0.03] transition-glass">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-orange-500 text-sm font-semibold flex-shrink-0">
                    {isci.full_name.charAt(0).toUpperCase()}
                  </div>
                  <Link
                    href={`/isci-listesi/${isci.id}`}
                    className="text-sm font-medium text-white hover:text-orange-500 transition-glass"
                  >
                    {isci.full_name}
                  </Link>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-[#94A3B8]">{isci.job_title || '—'}</td>
              <td className="px-6 py-4 text-sm text-[#94A3B8]">{isci.phone || '—'}</td>
              <td className="px-6 py-4 text-right">
                <span className="font-[family-name:var(--font-mono)] text-sm text-white">
                  {isci.daily_wage > 0 ? `₺${isci.daily_wage.toLocaleString('tr-TR')}` : '—'}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  isci.is_active
                    ? 'bg-[#10B981]/10 text-[#10B981]'
                    : 'bg-white/5 text-white/30'
                }`}>
                  {isci.is_active ? 'Aktif' : 'Pasif'}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <Link
                  href={`/isci-listesi/qr/${isci.id}`}
                  className="text-xs text-orange-500 hover:text-orange-400 font-medium glass rounded-lg px-3 py-1.5 transition-glass whitespace-nowrap"
                >
                  QR Göster
                </Link>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/isci-listesi/${isci.id}/duzenle`}
                    className="text-xs text-[#94A3B8] hover:text-white transition-glass"
                  >
                    Düzenle
                  </Link>
                  <button
                    onClick={() => toggleDurum(isci.id, isci.is_active)}
                    disabled={loading === isci.id}
                    className="text-xs text-[#94A3B8] hover:text-white transition-glass disabled:opacity-50"
                  >
                    {loading === isci.id ? '...' : isci.is_active ? 'Pasife Al' : 'Aktife Al'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
