import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import Link from 'next/link'
import SidebarCikis from './SidebarCikis'
import SidebarNav from './SidebarNav'
import { avatarGradient, avatarImage } from './profil/avatarlar'
import BildirimZili from './BildirimZili'
import { getBildirimler } from '@/app/actions/bildirim'

export const dynamic = 'force-dynamic'

const NAV_GRUPLARI = [
  {
    baslik: 'GENEL',
    linkler: [
      { href: '/dashboard', label: 'Genel Bakış' },
    ],
  },
  {
    baslik: 'İŞ GÜCÜ',
    linkler: [
      { href: '/isci-listesi', label: 'İşçiler' },
      { href: '/santiye-listesi', label: 'Şantiyeler' },
      { href: '/puantaj', label: 'Puantaj' },
    ],
  },
  {
    baslik: 'ANALİZ',
    linkler: [
      { href: '/rapor', label: 'Raporlar' },
      { href: '/bordro', label: 'Bordro', adminOnly: true },
      { href: '/harcamalar', label: 'Harcamalar', adminOnly: true },
    ],
  },
  {
    baslik: 'SİSTEM',
    linkler: [
      { href: '/davet', label: 'Davet', adminOnly: true },
      { href: '/profil', label: 'Profil' },
    ],
  },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, company_id, role, avatar_color, companies(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/sirket-kur')

  const company = profile.companies as unknown as { name: string }
  const bildirimler = await getBildirimler(profile.company_id)
  const isAdmin = !profile.role || ['owner', 'admin'].includes(profile.role)
  const rolLabel = profile.role === 'owner' ? 'Kurucu' : isAdmin ? 'Yönetici' : profile.role === 'foreman' ? 'Şef' : 'Çalışan'
  const initial = profile.full_name?.charAt(0)?.toUpperCase() ?? '?'
  const avatarId = (profile as { avatar_color?: string }).avatar_color
  const [avatarFrom, avatarTo] = avatarGradient(avatarId)
  const avatarImg = avatarImage(avatarId)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0A0A0A' }}>

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col flex-shrink-0" style={{ width: 240, background: '#0F0F0F', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <Image
                src="/logo.png"
                alt="CrewLog"
                width={120}
                height={32}
                style={{ objectFit: 'contain', objectPosition: 'left', filter: 'invert(1) hue-rotate(175deg) saturate(5)', mixBlendMode: 'screen' }}
                priority
              />
              <div className="text-[13px] font-semibold mt-2 truncate tracking-wide" style={{ color: '#9CA3AF' }}>{company?.name}</div>
            </div>
            <BildirimZili bildirimler={bildirimler} />
          </div>
        </div>

        {/* Nav */}
        <SidebarNav gruplar={NAV_GRUPLARI.map(g => ({
          baslik: g.baslik,
          linkler: g.linkler.filter(l => !l.adminOnly || isAdmin),
        })).filter(g => g.linkler.length > 0)} />

        {/* Kullanıcı profili — VoltFleet stili */}
        <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <Link href="/profil" className="flex items-center gap-3 mb-3 group">
              {avatarImg ? (
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#111', boxShadow: 'inset 0 0 0 2px #111' }}>
                  <Image src={avatarImg} alt="avatar" width={36} height={36} className="w-full h-full object-cover scale-[1.04]" />
                </div>
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                  style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}
                >
                  {initial}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate group-hover:text-orange-400 transition-colors">{profile.full_name}</p>
                <p className="text-[11px]" style={{ color: '#6B7280' }}>{rolLabel}</p>
              </div>
            </Link>
            <SidebarCikis />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{ background: '#0F0F0F', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-outfit)' }}>CrewLog</span>
        <SidebarCikis />
      </div>

      {/* Main */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14" style={{ background: '#0A0A0A' }}>
        {children}
      </main>
    </div>
  )
}
