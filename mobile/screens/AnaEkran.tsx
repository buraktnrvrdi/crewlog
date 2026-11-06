import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator
} from 'react-native'
import { supabase } from '../lib/supabase'
import { Rol } from '../App'
import HarcamaEkrani from './HarcamaEkrani'
import GunlukEkrani from './GunlukEkrani'
import IsciListesiEkrani from './IsciListesiEkrani'
import AvansEkrani from './AvansEkrani'
import PuantajEkrani from './PuantajEkrani'

const BG = '#000000'
const BG2 = '#1C1C1E'
const BG3 = '#2C2C2E'
const SEP = '#38383A'
const LABEL = '#FFFFFF'
const LABEL2 = '#8E8E93'
const LABEL3 = '#48484A'
const ORANGE = '#FF9500'
const GREEN = '#30D158'
const RED = '#FF453A'
const YELLOW = '#FFD60A'

type Tab = 'ana' | 'puantaj' | 'qr' | 'harcama' | 'daha'
type AltEkran = 'isci-listesi' | 'gunluk' | 'avans' | null

type Ozet = {
  aktifIsci: number
  aktifSantiye: number
  aylikHarcama: number
}

type SonAktivite = {
  id: string
  worker_name: string
  site_name: string
  status: 'present' | 'absent' | 'half_day'
  date: string
}

function bugunStr(): string {
  return new Date().toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

function bugunIso(): string {
  return new Date().toISOString().split('T')[0]
}

function buAyAralik(): { baslangic: string; bitis: string } {
  const simdi = new Date()
  const yil = simdi.getFullYear()
  const ay = simdi.getMonth() + 1
  const sonAy = new Date(yil, ay, 0)
  return {
    baslangic: `${yil}-${String(ay).padStart(2, '0')}-01`,
    bitis: `${yil}-${String(ay).padStart(2, '0')}-${String(sonAy.getDate()).padStart(2, '0')}`,
  }
}

function Dashboard({ rol, onQrGit }: { rol: Rol; onQrGit: () => void }) {
  const [ozet, setOzet] = useState<Ozet>({ aktifIsci: 0, aktifSantiye: 0, aylikHarcama: 0 })
  const [sonAktiviteler, setSonAktiviteler] = useState<SonAktivite[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => { yukle() }, [])

  async function yukle() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data: profile } = await supabase
      .from('profiles').select('company_id').eq('id', session.user.id).single()
    if (!profile?.company_id) { setYukleniyor(false); return }
    const cid = profile.company_id
    const bugun = bugunIso()
    const { baslangic, bitis } = buAyAralik()

    const [
      { count: aktifIsci },
      { count: aktifSantiye },
      { data: harcamalar },
      { data: son },
    ] = await Promise.all([
      supabase.from('timesheets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', cid)
        .eq('date', bugun)
        .in('status', ['present', 'half_day']),
      supabase.from('sites')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', cid)
        .eq('is_active', true),
      supabase.from('site_expenses')
        .select('amount')
        .eq('company_id', cid)
        .gte('date', baslangic)
        .lte('date', bitis),
      supabase.from('timesheets')
        .select('id, status, date, workers(full_name), sites(name)')
        .eq('company_id', cid)
        .eq('date', bugun)
        .order('created_at', { ascending: false })
        .limit(3),
    ])

    const toplamHarcama = harcamalar?.reduce((s, h) => s + h.amount, 0) ?? 0
    setOzet({
      aktifIsci: aktifIsci ?? 0,
      aktifSantiye: aktifSantiye ?? 0,
      aylikHarcama: toplamHarcama,
    })

    const aktiviteler: SonAktivite[] = (son as any)?.map((t: any) => ({
      id: t.id,
      worker_name: t.workers?.full_name ?? '—',
      site_name: t.sites?.name ?? '—',
      status: t.status,
      date: t.date,
    })) ?? []
    setSonAktiviteler(aktiviteler)
    setYukleniyor(false)
  }

  if (yukleniyor) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG }}>
        <ActivityIndicator size="large" color={ORANGE} />
      </View>
    )
  }

  const DURUM_RENK = { present: GREEN, absent: RED, half_day: YELLOW }
  const DURUM_LABEL = { present: 'Geldi', absent: 'Gelmedi', half_day: 'Yarım' }

  return (
    <ScrollView
      style={d.liste}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View style={d.largeTitleRow}>
        <Text style={d.largeTitle}>CrewLog</Text>
        <Text style={d.tarihYazi}>{bugunStr()}</Text>
      </View>

      <View style={d.ozetKart}>
        <View style={d.ozetItem}>
          <Text style={d.ozetSayi}>{ozet.aktifIsci}</Text>
          <Text style={d.ozetEtiket}>Aktif İşçi</Text>
          <Text style={d.ozetAlt}>Bugün</Text>
        </View>
        <View style={d.ozetAyrac} />
        <View style={d.ozetItem}>
          <Text style={d.ozetSayi}>{ozet.aktifSantiye}</Text>
          <Text style={d.ozetEtiket}>Aktif Şantiye</Text>
          <Text style={d.ozetAlt}>Şantiye</Text>
        </View>
        <View style={d.ozetAyrac} />
        <View style={d.ozetItem}>
          <Text style={[d.ozetSayi, { color: ORANGE, fontSize: 22 }]}>
            {'₺' + (ozet.aylikHarcama > 999
              ? (ozet.aylikHarcama / 1000).toFixed(1) + 'K'
              : ozet.aylikHarcama.toLocaleString('tr-TR'))}
          </Text>
          <Text style={d.ozetEtiket}>Harcama</Text>
          <Text style={d.ozetAlt}>Bu Ay</Text>
        </View>
      </View>

      {sonAktiviteler.length > 0 && (
        <>
          <Text style={d.bolumBaslik}>BUGÜNÜN ÖZETİ</Text>
          <View style={d.grupKapsayici}>
            {sonAktiviteler.map((a, idx) => (
              <View key={a.id}>
                <View style={d.satirRow}>
                  <View style={d.avatar}>
                    <Text style={d.avatarHarf}>{a.worker_name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={d.isimYazi}>{a.worker_name}</Text>
                    <Text style={d.santiyeYazi}>{a.site_name}</Text>
                  </View>
                  <View style={d.durumRow}>
                    <View style={[d.durumDot, { backgroundColor: DURUM_RENK[a.status] }]} />
                    <Text style={[d.durumYazi, { color: DURUM_RENK[a.status] }]}>
                      {DURUM_LABEL[a.status]}
                    </Text>
                  </View>
                </View>
                {idx < sonAktiviteler.length - 1 && (
                  <View style={d.ayrac} />
                )}
              </View>
            ))}
          </View>
        </>
      )}

      {sonAktiviteler.length === 0 && (
        <>
          <Text style={d.bolumBaslik}>BUGÜNÜN ÖZETİ</Text>
          <View style={d.grupKapsayici}>
            <View style={d.bosRow}>
              <Text style={d.bosYazi}>Bugün henüz puantaj girilmedi</Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  )
}

const d = StyleSheet.create({
  liste: { flex: 1, backgroundColor: BG },
  largeTitleRow: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 4 },
  largeTitle: { fontSize: 34, fontWeight: '700', color: LABEL },
  tarihYazi: { fontSize: 13, color: LABEL2 },
  ozetKart: {
    flexDirection: 'row',
    backgroundColor: BG2,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    overflow: 'hidden',
    marginTop: 16,
  },
  ozetItem: { flex: 1, paddingVertical: 16, alignItems: 'center', gap: 2 },
  ozetAyrac: { width: StyleSheet.hairlineWidth, backgroundColor: SEP },
  ozetSayi: { fontSize: 28, fontWeight: '700', color: GREEN },
  ozetEtiket: { fontSize: 13, color: LABEL2 },
  ozetAlt: { fontSize: 12, color: LABEL2 },
  bolumBaslik: {
    fontSize: 13,
    color: LABEL2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 32,
    paddingBottom: 8,
    paddingTop: 20,
  },
  grupKapsayici: {
    backgroundColor: BG2,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  satirRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    backgroundColor: BG2,
  },
  ayrac: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: SEP,
    marginLeft: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BG3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHarf: { color: ORANGE, fontWeight: '700', fontSize: 15 },
  isimYazi: { fontSize: 17, color: LABEL },
  santiyeYazi: { fontSize: 13, color: LABEL2, marginTop: 1 },
  durumRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  durumDot: { width: 6, height: 6, borderRadius: 3 },
  durumYazi: { fontSize: 13, fontWeight: '500' },
  bosRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: BG2,
    alignItems: 'center',
  },
  bosYazi: { fontSize: 15, color: LABEL2 },
})

function DahaFazla({
  rol,
  onGunluk,
  onIsciListesi,
  onGecmis,
  onDavet,
  onCikis,
}: {
  rol: Rol
  onGunluk: () => void
  onIsciListesi: () => void
  onGecmis: () => void
  onDavet: () => void
  onCikis: () => void
}) {
  async function cikisYap() {
    await supabase.auth.signOut()
    onCikis()
  }

  const menuler = [
    { baslik: 'İşçiler', onPress: onIsciListesi },
    { baslik: 'Şantiye Günlüğü', onPress: onGunluk },
    { baslik: 'Geçmiş Kayıtlar', onPress: onGecmis },
    ...(rol === 'admin' ? [{ baslik: 'Davet', onPress: onDavet }] : []),
  ]

  return (
    <ScrollView style={mf.liste} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={mf.bolumBaslik}>MENÜ</Text>
      <View style={mf.grupKapsayici}>
        {menuler.map((m, idx) => (
          <View key={m.baslik}>
            <TouchableOpacity
              style={mf.satirRow}
              onPress={m.onPress}
              activeOpacity={0.6}
            >
              <Text style={mf.menuBaslik}>{m.baslik}</Text>
              <Text style={mf.sag}>›</Text>
            </TouchableOpacity>
            {idx < menuler.length - 1 && <View style={mf.ayrac} />}
          </View>
        ))}
      </View>

      <Text style={mf.bolumBaslik}> </Text>
      <View style={mf.grupKapsayici}>
        <TouchableOpacity
          style={mf.satirRow}
          onPress={cikisYap}
          activeOpacity={0.6}
        >
          <Text style={mf.cikisYazi}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const mf = StyleSheet.create({
  liste: { flex: 1, backgroundColor: BG },
  bolumBaslik: {
    fontSize: 13,
    color: LABEL2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 32,
    paddingBottom: 8,
    paddingTop: 20,
  },
  grupKapsayici: {
    backgroundColor: BG2,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  satirRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    backgroundColor: BG2,
  },
  ayrac: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: SEP,
    marginLeft: 16,
  },
  menuBaslik: { flex: 1, fontSize: 17, color: LABEL },
  sag: { fontSize: 20, color: LABEL2, fontWeight: '400' },
  cikisYazi: { flex: 1, fontSize: 17, color: RED, textAlign: 'center' },
})

export default function AnaEkran({
  rol, onQr, onPuantaj, onGecmis, onDavet, onCikis
}: {
  rol: Rol
  onQr: () => void
  onPuantaj: () => void
  onGecmis: () => void
  onDavet: () => void
  onCikis: () => void
}) {
  const [aktifTab, setAktifTab] = useState<Tab>('ana')
  const [altEkran, setAltEkran] = useState<AltEkran>(null)
  const [seciliWorkerId, setSeciliWorkerId] = useState<string>('')
  const [seciliWorkerAd, setSeciliWorkerAd] = useState<string>('')

  if (altEkran === 'isci-listesi') {
    return (
      <IsciListesiEkrani
        onGeri={() => setAltEkran(null)}
        onIsciSec={(id, ad) => {
          setSeciliWorkerId(id)
          setSeciliWorkerAd(ad)
          setAltEkran('avans')
        }}
      />
    )
  }

  if (altEkran === 'avans') {
    return (
      <AvansEkrani
        onGeri={() => setAltEkran('isci-listesi')}
        workerId={seciliWorkerId}
        workerAd={seciliWorkerAd}
      />
    )
  }

  if (altEkran === 'gunluk') {
    return <GunlukEkrani onGeri={() => setAltEkran(null)} />
  }

  const handleTabPress = (tab: Tab) => {
    if (tab === 'qr') { onQr(); return }
    setAktifTab(tab)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ana', label: 'Ana' },
    { key: 'puantaj', label: 'Puantaj' },
    { key: 'qr', label: 'QR' },
    { key: 'harcama', label: 'Harcama' },
    { key: 'daha', label: 'Daha' },
  ]

  function renderIcerik() {
    switch (aktifTab) {
      case 'ana':
        return <Dashboard rol={rol} onQrGit={() => handleTabPress('qr')} />
      case 'puantaj':
        return <PuantajEkrani onGeri={() => setAktifTab('ana')} />
      case 'harcama':
        return <HarcamaEkrani onGeri={() => setAktifTab('ana')} />
      case 'daha':
        return (
          <DahaFazla
            rol={rol}
            onGunluk={() => setAltEkran('gunluk')}
            onIsciListesi={() => setAltEkran('isci-listesi')}
            onGecmis={onGecmis}
            onDavet={onDavet}
            onCikis={onCikis}
          />
        )
      default:
        return <Dashboard rol={rol} onQrGit={() => handleTabPress('qr')} />
    }
  }

  return (
    <SafeAreaView style={ana.kapsayici}>
      <View style={{ flex: 1 }}>
        {renderIcerik()}
      </View>

      <View style={ana.tabBar}>
        {tabs.map(tab => {
          const isQr = tab.key === 'qr'
          const isActive = aktifTab === tab.key && !isQr
          return (
            <TouchableOpacity
              key={tab.key}
              style={ana.tabItem}
              onPress={() => handleTabPress(tab.key)}
              activeOpacity={0.7}
            >
              {isQr ? (
                <View style={ana.qrDaire}>
                  <Text style={ana.qrDaireYazi}>QR</Text>
                </View>
              ) : tab.key === 'harcama' ? (
                <>
                  <Text style={[ana.tabIkon, isActive && ana.tabIkonAktif]}>{'₺'}</Text>
                  <Text style={[ana.tabLabel, isActive && ana.tabLabelAktif]}>
                    {tab.label}
                  </Text>
                </>
              ) : tab.key === 'daha' ? (
                <>
                  <Text style={[ana.tabIkon, isActive && ana.tabIkonAktif]}>{'···'}</Text>
                  <Text style={[ana.tabLabel, isActive && ana.tabLabelAktif]}>
                    {tab.label}
                  </Text>
                </>
              ) : (
                <>
                  <View style={[ana.tabIconBox, isActive && ana.tabIconBoxAktif]} />
                  <Text style={[ana.tabLabel, isActive && ana.tabLabelAktif]}>
                    {tab.label}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </SafeAreaView>
  )
}

const ana = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: BG },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: BG2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SEP,
    paddingBottom: 24,
    paddingTop: 10,
    height: 83,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tabIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: LABEL2,
    marginBottom: 2,
  },
  tabIconBoxAktif: {
    backgroundColor: ORANGE,
  },
  tabIkon: {
    fontSize: 20,
    color: LABEL2,
    fontWeight: '500',
    lineHeight: 26,
  },
  tabIkonAktif: { color: ORANGE },
  tabLabel: { fontSize: 10, fontWeight: '500', color: LABEL2, marginTop: 3 },
  tabLabelAktif: { color: ORANGE },
  qrDaire: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrDaireYazi: { fontSize: 13, fontWeight: '800', color: '#fff' },
})
