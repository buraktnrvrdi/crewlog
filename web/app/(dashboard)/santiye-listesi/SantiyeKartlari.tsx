'use client'

import { useState } from 'react'
import { santiyeDurumGuncelle } from '@/app/actions/santiye'
import { useRouter } from 'next/navigation'
import Link from 'next/link'


type Santiye = {
  id: string
  name: string
  address: string | null
  is_active: boolean
  created_at: string
}

export default function SantiyeKartlari({ santiyeler }: { santiyeler: Santiye[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function toggleDurum(id: string, isActive: boolean) {
    setLoading(id)
    await santiyeDurumGuncelle(id, !isActive)
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {santiyeler.map(santiye => (
        <div key={santiye.id} className="glass-card p-5 hover:bg-white/[0.03] transition-glass">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 mr-3">
              <Link
                href={`/santiye-listesi/${santiye.id}`}
                className="font-semibold text-white hover:text-orange-400 transition-glass font-[family-name:var(--font-outfit)] tracking-[-0.025em] block truncate"
              >
                {santiye.name}
              </Link>
              {santiye.address && (
                <p className="text-sm text-[#94A3B8] mt-0.5 truncate">{santiye.address}</p>
              )}
            </div>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
              santiye.is_active
                ? 'bg-[#10B981]/10 text-[#10B981]'
                : 'bg-white/5 text-white/30'
            }`}>
              {santiye.is_active ? 'Aktif' : 'Pasif'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
            <p className="text-xs text-white/30 font-[family-name:var(--font-mono)]">
              {new Date(santiye.created_at).toLocaleDateString('tr-TR')}
            </p>
            <div className="flex items-center gap-3">
              <Link
                href={`/santiye-listesi/${santiye.id}/duzenle`}
                className="text-xs text-[#94A3B8] hover:text-orange-400 transition-glass"
              >
                Düzenle
              </Link>
              <button
                onClick={() => toggleDurum(santiye.id, santiye.is_active)}
                disabled={loading === santiye.id}
                className="text-xs text-[#94A3B8] hover:text-orange-400 transition-glass disabled:opacity-50"
              >
                {loading === santiye.id ? '...' : santiye.is_active ? 'Pasife Al' : 'Aktife Al'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
