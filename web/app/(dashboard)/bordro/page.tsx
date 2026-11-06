import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import BordroIstemci from './BordroIstemci'

export const dynamic = 'force-dynamic'

export default async function BordroPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'foreman') redirect('/dashboard')

  const bugun = new Date()

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 fade-up">
        <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-outfit)] tracking-[-0.025em]">
          Bordro
        </h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">Aylık ücret bordrosu hesaplama ve dışa aktarma</p>
      </div>
      <div className="fade-up delay-50">
        <BordroIstemci varsayilanYil={bugun.getFullYear()} varsayilanAy={bugun.getMonth() + 1} />
      </div>
    </div>
  )
}
