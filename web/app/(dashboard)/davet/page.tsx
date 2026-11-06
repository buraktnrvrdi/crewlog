import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import DavetYonetim from './DavetYonetim'

export const dynamic = 'force-dynamic'

export default async function DavetPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'foreman') redirect('/dashboard')

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h2 className="font-[family-name:var(--font-outfit)] text-2xl font-semibold tracking-[-0.025em] text-white">
          Davet Yönetimi
        </h2>
        <p className="text-sm text-[#94A3B8] mt-1">Ekip üyelerini davet edin</p>
      </div>
      <DavetYonetim />
    </div>
  )
}
