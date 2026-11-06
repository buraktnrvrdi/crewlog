'use client'

import { useState, useRef, useEffect } from 'react'
import type { Bildirim } from '@/app/actions/bildirim'

type Props = {
  bildirimler: Bildirim[]
}

export default function BildirimZili({ bildirimler }: Props) {
  const [acik, setAcik] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!acik) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAcik(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [acik])

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setAcik(v => !v)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-glass"
        title="Bildirimler"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {bildirimler.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F43F5E] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {bildirimler.length > 9 ? '9+' : bildirimler.length}
          </span>
        )}
      </button>

      {acik && (
        <div
          className="absolute right-0 top-10 z-50 rounded-2xl shadow-2xl overflow-hidden"
          style={{
            width: 280,
            background: 'rgba(15,15,15,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-widest">Bildirimler</p>
          </div>

          {bildirimler.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-white/30">Bildirim yok</p>
            </div>
          ) : (
            <div className="py-2">
              {bildirimler.map((b) => (
                <div
                  key={b.id}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-glass"
                >
                  <span
                    className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: b.tip === 'uyari' ? '#F59E0B' : '#3B82F6' }}
                  />
                  <p className="text-sm text-white/80 leading-snug">{b.mesaj}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
