'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CikisButonu() {
  const router = useRouter()

  async function cikisYap() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/giris')
  }

  return (
    <button
      onClick={cikisYap}
      className="text-sm text-gray-400 hover:text-red-500 transition-colors font-medium"
    >
      Çıkış Yap
    </button>
  )
}
