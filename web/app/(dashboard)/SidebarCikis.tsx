'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SidebarCikis() {
  const router = useRouter()

  async function cikisYap() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/giris')
  }

  return (
    <button
      onClick={cikisYap}
      className="flex items-center justify-between w-full text-[12px] font-medium transition-colors duration-200 group"
      style={{ color: '#4B5563' }}
      onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
      onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
    >
      <span>Çıkış Yap</span>
      <span style={{ fontSize: 14 }}>→</span>
    </button>
  )
}
