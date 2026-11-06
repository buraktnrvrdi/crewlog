import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import QrGoster from './QrGoster'

export const dynamic = 'force-dynamic'

export default async function IsciQrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: worker } = await admin
    .from('workers')
    .select('id, full_name, job_title, qr_code')
    .eq('id', id)
    .single()

  if (!worker) redirect('/isci-listesi')

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">QR Kartı</h2>
      </div>
      <div className="flex justify-center">
        <QrGoster
          isciId={worker.id}
          adSoyad={worker.full_name}
          unvan={worker.job_title ?? 'İşçi'}
          qrKod={worker.qr_code}
        />
      </div>
    </div>
  )
}
