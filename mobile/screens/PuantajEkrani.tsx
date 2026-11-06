import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { supabase } from '../lib/supabase'
import { sabahBildiriminiIptalEt } from '../lib/bildirimler'

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

type Isci = { id: string; full_name: string; job_title: string | null }
type Santiye = { id: string; name: string }
type Durum = 'present' | 'absent' | 'half_day'

const DURUM_LABEL: Record<Durum, string> = {
  present: 'G',
  absent: 'X',
  half_day: 'Y',
}

const DURUM_RENK: Record<Durum, string> = {
  present: GREEN,
  absent: RED,
  half_day: YELLOW,
}

const DURUM_BG_SEL: Record<Durum, string> = {
  present: 'rgba(48,209,88,0.18)',
  absent: 'rgba(255,69,58,0.18)',
  half_day: 'rgba(255,214,10,0.18)',
}

export default function PuantajEkrani({ onGeri }: { onGeri: () => void }) {
  const [isciler, setIsciler] = useState<Isci[]>([])
  const [durumlar, setDurumlar] = useState<Record<string, Durum>>({})
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [santiyeler, setSantiyeler] = useState<Santiye[]>([])
  const [seciliSantiye, setSeciliSantiye] = useState<Santiye | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kaydediyor, setKaydediyor] = useState(false)

  const bugun = new Date().toISOString().split('T')[0]

  useEffect(() => { yukle() }, [])
  useEffect(() => {
    if (seciliSantiye && companyId) puantajYukle(seciliSantiye.id)
  }, [seciliSantiye])

  async function yukle() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: profile } = await supabase
      .from('profiles').select('company_id').eq('id', session.user.id).single()

    if (!profile?.company_id) return
    setCompanyId(profile.company_id)

    const [{ data: workers }, { data: sites }] = await Promise.all([
      supabase.from('workers').select('id, full_name, job_title')
        .eq('company_id', profile.company_id).eq('is_active', true).order('full_name'),
      supabase.from('sites').select('id, name')
        .eq('company_id', profile.company_id).eq('is_active', true).order('name'),
    ])

    setIsciler(workers ?? [])
    const list = sites ?? []
    setSantiyeler(list)

    const varsayilan: Record<string, Durum> = {}
    workers?.forEach(w => { varsayilan[w.id] = 'absent' })
    setDurumlar(varsayilan)

    if (list.length === 1) {
      setSeciliSantiye(list[0])
    } else {
      setYukleniyor(false)
    }
  }

  async function puantajYukle(siteId: string) {
    setYukleniyor(true)
    const { data: mevcutPuantaj } = await supabase
      .from('timesheets').select('worker_id, status')
      .eq('company_id', companyId!).eq('site_id', siteId).eq('date', bugun)

    setDurumlar(prev => {
      const yeni = { ...prev }
      mevcutPuantaj?.forEach(p => { yeni[p.worker_id] = p.status as Durum })
      return yeni
    })
    setYukleniyor(false)
  }

  async function kaydet() {
    if (!companyId || !seciliSantiye) {
      Alert.alert('Hata', 'Şantiye seçilmedi')
      return
    }
    setKaydediyor(true)
    const rows = isciler.map(isci => ({
      worker_id: isci.id,
      site_id: seciliSantiye.id,
      company_id: companyId,
      date: bugun,
      status: durumlar[isci.id] ?? 'absent',
    }))

    const { error } = await supabase.from('timesheets').upsert(rows, { onConflict: 'worker_id,date,site_id' })
    setKaydediyor(false)

    if (error) {
      Alert.alert('Hata', error.message)
    } else {
      sabahBildiriminiIptalEt()
      Alert.alert('Basarili', 'Puantaj kaydedildi')
    }
  }

  if (yukleniyor) {
    return (
      <SafeAreaView style={s.kapsayici}>
        <ActivityIndicator size="large" color={ORANGE} style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  const gelenSayisi = Object.values(durumlar).filter(d => d === 'present').length

  if (!seciliSantiye) {
    return (
      <SafeAreaView style={s.kapsayici}>
        <View style={s.navBaslik}>
          <TouchableOpacity onPress={onGeri}>
            <Text style={s.geri}>‹ Geri</Text>
          </TouchableOpacity>
          <Text style={s.baslikYazi}>Şantiye Seç</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={s.bolumBaslik}>ŞANTİYELER</Text>
        <View style={s.grupKapsayici}>
          {santiyeler.map((site, idx) => (
            <View key={site.id}>
              <TouchableOpacity
                style={s.satirRow}
                onPress={() => setSeciliSantiye(site)}
                activeOpacity={0.6}
              >
                <Text style={s.satirBaslik}>{site.name}</Text>
                <Text style={s.sag}>›</Text>
              </TouchableOpacity>
              {idx < santiyeler.length - 1 && <View style={s.ayrac} />}
            </View>
          ))}
          {santiyeler.length === 0 && (
            <View style={s.bosRow}>
              <Text style={s.bosYazi}>Aktif santiye bulunamadi</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.kapsayici}>
      <View style={s.navBaslik}>
        <TouchableOpacity onPress={santiyeler.length > 1 ? () => setSeciliSantiye(null) : onGeri}>
          <Text style={s.geri}>‹ Geri</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.baslikYazi}>Puantaj</Text>
          <Text style={s.baslikAlt}>{seciliSantiye.name}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {santiyeler.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.pilSerid}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}
        >
          {santiyeler.map(site => (
            <TouchableOpacity
              key={site.id}
              style={[s.pil, seciliSantiye?.id === site.id && s.pilSecili]}
              onPress={() => setSeciliSantiye(site)}
              activeOpacity={0.7}
            >
              <Text style={[s.pilYazi, seciliSantiye?.id === site.id && s.pilYaziSecili]}>
                {site.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={s.ozetSatir}>
        <Text style={s.tarihYazi}>
          {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
        <Text style={s.sayacYazi}>
          <Text style={{ color: GREEN }}>{gelenSayisi}</Text>
          <Text style={{ color: LABEL2 }}>/{isciler.length} geldi</Text>
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {isciler.length === 0 && (
          <View style={s.grupKapsayici}>
            <View style={s.bosRow}>
              <Text style={s.bosYazi}>Aktif isci bulunamadi</Text>
            </View>
          </View>
        )}

        {isciler.length > 0 && (
          <>
            <Text style={s.bolumBaslik}>ISCILER</Text>
            <View style={s.grupKapsayici}>
              {isciler.map((isci, idx) => (
                <View key={isci.id}>
                  <View style={s.isciRow}>
                    <View style={s.avatar}>
                      <Text style={s.avatarHarf}>{isci.full_name.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={s.isciAd}>{isci.full_name}</Text>
                      {isci.job_title && <Text style={s.unvan}>{isci.job_title}</Text>}
                    </View>
                    <View style={s.durumlarRow}>
                      {(['present', 'half_day', 'absent'] as Durum[]).map(d => {
                        const secili = durumlar[isci.id] === d
                        return (
                          <TouchableOpacity
                            key={d}
                            style={[
                              s.durumButon,
                              secili
                                ? { backgroundColor: DURUM_BG_SEL[d] }
                                : { backgroundColor: BG3 }
                            ]}
                            onPress={() => setDurumlar(prev => ({ ...prev, [isci.id]: d }))}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              s.durumYazi,
                              { color: secili ? DURUM_RENK[d] : LABEL3 }
                            ]}>
                              {DURUM_LABEL[d]}
                            </Text>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  </View>
                  {idx < isciler.length - 1 && <View style={s.ayrac} />}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={s.altBar}>
        <TouchableOpacity
          style={[s.kaydetButon, kaydediyor && { opacity: 0.5 }]}
          onPress={kaydet}
          disabled={kaydediyor}
          activeOpacity={0.85}
        >
          <Text style={s.kaydetYazi}>
            {kaydediyor ? 'Kaydediliyor...' : 'Puantaji Kaydet'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: BG },
  navBaslik: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  geri: { color: ORANGE, fontSize: 17, width: 80 },
  baslikYazi: { fontSize: 17, fontWeight: '600', color: LABEL },
  baslikAlt: { fontSize: 12, color: LABEL2, marginTop: 1 },
  pilSerid: {
    maxHeight: 52,
    flexGrow: 0,
    marginBottom: 8,
  },
  pil: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: BG2,
    alignSelf: 'center',
  },
  pilSecili: { backgroundColor: BG3 },
  pilYazi: { fontSize: 15, color: LABEL2 },
  pilYaziSecili: { color: ORANGE, fontWeight: '600' },
  ozetSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tarihYazi: { fontSize: 13, color: LABEL2 },
  sayacYazi: { fontSize: 13 },
  bolumBaslik: {
    fontSize: 13,
    color: LABEL2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 32,
    paddingBottom: 8,
    paddingTop: 12,
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
  satirBaslik: { flex: 1, fontSize: 17, color: LABEL },
  sag: { fontSize: 20, color: LABEL2 },
  ayrac: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: SEP,
    marginLeft: 16,
  },
  isciRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
    backgroundColor: BG2,
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
  isciAd: { fontSize: 17, color: LABEL },
  unvan: { fontSize: 13, color: LABEL2, marginTop: 1 },
  durumlarRow: { flexDirection: 'row', gap: 6 },
  durumButon: {
    width: 32,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durumYazi: { fontSize: 11, fontWeight: '600' },
  altBar: {
    padding: 16,
    paddingBottom: 24,
  },
  kaydetButon: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  kaydetYazi: { color: '#fff', fontSize: 17, fontWeight: '600' },
  bosRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: BG2,
    alignItems: 'center',
  },
  bosYazi: { fontSize: 15, color: LABEL2 },
})
