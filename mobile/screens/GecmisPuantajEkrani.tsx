import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator
} from 'react-native'
import { supabase } from '../lib/supabase'

const BG = '#000000'
const BG2 = '#1C1C1E'
const BG3 = '#2C2C2E'
const SEP = '#38383A'
const LABEL = '#FFFFFF'
const LABEL2 = '#8E8E93'
const ORANGE = '#FF9500'
const GREEN = '#30D158'
const RED = '#FF453A'
const YELLOW = '#FFD60A'

type Kayit = {
  id: string
  worker_id: string
  status: 'present' | 'absent' | 'half_day'
  check_in: string | null
  check_out: string | null
  workers: { full_name: string; job_title: string | null }
}

type Santiye = { id: string; name: string }

const DURUM_LABEL = { present: 'Geldi', absent: 'Gelmedi', half_day: 'Yarim' }
const DURUM_RENK = { present: GREEN, absent: RED, half_day: YELLOW }

function saatGoster(iso: string) {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function oncekiGunler(sayi: number): string[] {
  const gunler = []
  for (let i = 1; i <= sayi; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    gunler.push(d.toISOString().split('T')[0])
  }
  return gunler
}

function tarihYazi(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', weekday: 'long'
  })
}

export default function GecmisPuantajEkrani({ onGeri }: { onGeri: () => void }) {
  const [santiyeler, setSantiyeler] = useState<Santiye[]>([])
  const [seciliSantiye, setSeciliSantiye] = useState<Santiye | null>(null)
  const [seciliTarih, setSeciliTarih] = useState<string>(oncekiGunler(1)[0])
  const [kayitlar, setKayitlar] = useState<Kayit[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kayitYukleniyor, setKayitYukleniyor] = useState(false)

  const gunler = oncekiGunler(14)

  useEffect(() => { yukle() }, [])
  useEffect(() => {
    if (seciliSantiye && companyId) kayitlariGetir()
  }, [seciliSantiye, seciliTarih])

  async function yukle() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: profile } = await supabase
      .from('profiles').select('company_id').eq('id', session.user.id).single()

    if (!profile?.company_id) return
    setCompanyId(profile.company_id)

    const { data: sites } = await supabase
      .from('sites').select('id, name')
      .eq('company_id', profile.company_id).eq('is_active', true).order('name')

    const list = sites ?? []
    setSantiyeler(list)
    if (list.length === 1) setSeciliSantiye(list[0])
    setYukleniyor(false)
  }

  async function kayitlariGetir() {
    if (!seciliSantiye || !companyId) return
    setKayitYukleniyor(true)

    const { data } = await supabase
      .from('timesheets')
      .select('id, worker_id, status, check_in, check_out, workers(full_name, job_title)')
      .eq('company_id', companyId)
      .eq('site_id', seciliSantiye.id)
      .eq('date', seciliTarih)
      .order('workers(full_name)')

    setKayitlar((data as any) ?? [])
    setKayitYukleniyor(false)
  }

  if (yukleniyor) {
    return (
      <SafeAreaView style={s.kapsayici}>
        <ActivityIndicator size="large" color={ORANGE} style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  if (!seciliSantiye) {
    return (
      <SafeAreaView style={s.kapsayici}>
        <View style={s.navBaslik}>
          <TouchableOpacity onPress={onGeri}>
            <Text style={s.geri}>‹ Geri</Text>
          </TouchableOpacity>
          <Text style={s.baslikYazi}>Santiye Sec</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={s.bolumBaslik}>SANTİYELER</Text>
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

  const gelenSayisi = kayitlar.filter(k => k.status === 'present').length

  return (
    <SafeAreaView style={s.kapsayici}>
      <View style={s.navBaslik}>
        <TouchableOpacity onPress={santiyeler.length > 1 ? () => setSeciliSantiye(null) : onGeri}>
          <Text style={s.geri}>‹ Geri</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.baslikYazi}>Gecmis Puantaj</Text>
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tarihSerid}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}
      >
        {gunler.map(gun => (
          <TouchableOpacity
            key={gun}
            style={[s.tarihButon, seciliTarih === gun && s.tarihButonSecili]}
            onPress={() => setSeciliTarih(gun)}
            activeOpacity={0.7}
          >
            <Text style={[s.tarihGun, seciliTarih === gun && { color: '#fff' }]}>
              {new Date(gun + 'T00:00:00').toLocaleDateString('tr-TR', { weekday: 'short' })}
            </Text>
            <Text style={[s.tarihSayi, seciliTarih === gun && { color: '#fff' }]}>
              {new Date(gun + 'T00:00:00').getDate()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={s.tarihBasi}>
        <Text style={s.tarihBasiYazi}>{tarihYazi(seciliTarih)}</Text>
        {!kayitYukleniyor && kayitlar.length > 0 && (
          <Text style={s.sayacYazi}>
            <Text style={{ color: GREEN }}>{gelenSayisi}</Text>
            <Text style={{ color: LABEL2 }}>/{kayitlar.length} geldi</Text>
          </Text>
        )}
      </View>

      {kayitYukleniyor ? (
        <ActivityIndicator size="large" color={ORANGE} style={{ marginTop: 40 }} />
      ) : kayitlar.length === 0 ? (
        <View style={s.grupKapsayici}>
          <View style={s.bosRow}>
            <Text style={s.bosYazi}>Bu tarih icin kayit bulunamadi</Text>
          </View>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          <Text style={s.bolumBaslik}>KAYITLAR</Text>
          <View style={s.grupKapsayici}>
            {kayitlar.map((kayit, idx) => (
              <View key={kayit.id}>
                <View style={s.isciRow}>
                  <View style={s.avatar}>
                    <Text style={s.avatarHarf}>{kayit.workers.full_name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.isciAd}>{kayit.workers.full_name}</Text>
                    {kayit.workers.job_title && (
                      <Text style={s.unvan}>{kayit.workers.job_title}</Text>
                    )}
                    {(kayit.check_in || kayit.check_out) && (
                      <Text style={s.saatler}>
                        {kayit.check_in ? saatGoster(kayit.check_in) : ''}
                        {kayit.check_in && kayit.check_out ? '  -  ' : ''}
                        {kayit.check_out ? saatGoster(kayit.check_out) : ''}
                      </Text>
                    )}
                  </View>
                  <View style={s.durumRow}>
                    <View style={[s.durumDot, { backgroundColor: DURUM_RENK[kayit.status] }]} />
                    <Text style={[s.durumYazi, { color: DURUM_RENK[kayit.status] }]}>
                      {DURUM_LABEL[kayit.status]}
                    </Text>
                  </View>
                </View>
                {idx < kayitlar.length - 1 && <View style={s.ayrac} />}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
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
  pilSerid: {
    maxHeight: 52,
    flexGrow: 0,
    marginBottom: 4,
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
  tarihSerid: {
    maxHeight: 76,
    flexGrow: 0,
    paddingVertical: 10,
  },
  tarihButon: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: BG2,
  },
  tarihButonSecili: { backgroundColor: ORANGE },
  tarihGun: {
    fontSize: 10,
    color: LABEL2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tarihSayi: { fontSize: 16, fontWeight: '700', color: LABEL, marginTop: 2 },
  tarihBasi: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tarihBasiYazi: { fontSize: 13, color: LABEL2 },
  sayacYazi: { fontSize: 13 },
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
  saatler: { fontSize: 12, color: LABEL2, marginTop: 2 },
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
