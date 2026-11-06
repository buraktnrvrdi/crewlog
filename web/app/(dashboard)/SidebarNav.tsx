'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavGrup = {
  baslik: string
  linkler: { href: string; label: string }[]
}

export default function SidebarNav({ gruplar }: { gruplar: NavGrup[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      {gruplar.map(grup => (
        <div key={grup.baslik}>
          <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest" style={{ color: '#374151' }}>
            {grup.baslik}
          </p>
          <div className="space-y-0.5">
            {grup.linkler.map(link => {
              const aktif = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center px-3 py-2 rounded-lg text-[13px] transition-all duration-200"
                  style={{
                    color: aktif ? '#fff' : '#6B7280',
                    background: aktif ? 'rgba(220,38,38,0.10)' : 'transparent',
                  }}
                >
                  {aktif && (
                    <span className="w-1 h-1 rounded-full mr-2.5 flex-shrink-0" style={{ background: '#DC2626' }} />
                  )}
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
