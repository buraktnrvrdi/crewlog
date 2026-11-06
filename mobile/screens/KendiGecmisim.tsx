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
  date: string
  status: 'present' | 'absent' | 'half_day'
  check_in: string | null
  check_out: string | null
  overtime_hours: number | null
  sites: { name: string }
}

const DURUM_LABEL = { present: 'Geldi', absent: 'Gelmedi', half_day: 'Yarim Gun' }
const DURUM_RENK = { present: GREEN, absent: RED, half_day: YELLOW }

function saatGoster(iso: string) {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function sure(baslangic: string, bitis: string): string {
  const dk = Math.floor((new Date(bitis).getTime() - new Date(baslangic).getTime()) / 60000)
  return `${Math.floor(dk / 60)}s ${dk % 60}dk`
}

export default function KendiGecmisim({ onCikis }: { onCikis: () => void }) {
  const [kayitlar, setKayitlar] = useState<Kayit[]>([])
  const [isimSoyisim, setIsimSoyisim] = useState('')
  const [unvan, setUnvan] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => { yukle() }, [])

  async function yukle() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: profile } = await supabase
      .from('profiles').select('worker_id').eq('id', session.user.id).single()

    if (!profile?.worker_id) { setYukleniyor(false); return }

    const { data: worker } = await supabase
      .from('workers').select('full_name, job_title').eq('id', profile.worker_id).single()

    setIsimSoyisim(worker?.full_name ?? '')
    setUnvan(worker?.job_title ?? 'Calisan')

    const otuzGunOnce = new Date()
    otuzGunOnce.setDate(otuzGunOnce.getDate() - 30)

    const { data } = await supabase
      .from('timesheets')
      .select('id, date, status, check_in, check_out, overtime_hours, sites(name)')
      .eq('worker_id', profile.worker_id)
      .gte('date', otuzGunOnce.toISOString().split('T')[0])
      .order('date', { ascending: false })

    setKayitlar((data as any) ?? [])
    setYukleniyor(false)
  }

  async function cikisYap() {
    await supabase.auth.signOut()
    onCikis()
  }

  if (yukleniyor) {
    return (
      <SafeAreaView style={s.kapsayici}>
        <ActivityIndicator size="large" color={ORANGE} style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  const gelenGun = kayitlar.filter(k => k.status === 'present').length
  const toplamGun = kayitlar.length
  const katilimYuzde = toplamGun > 0 ? Math.round((gelenGun / toplamGun) * 100) : 0
  const toplamFazlaMesai = kayitlar.reduce((total, k) => {
    if (k.check_in && k.check_out) {
      const dk = Math.floor((new Date(k.check_out).getTime() - new Date(k.check_in).getTime()) / 60000)
      return total + Math.max(0, (dk - 480) / 60)
    }
    return total + (k.overtime_hours ?? 0)
  }, 0)

  return (
    <SafeAreaView style={s.kapsayici}>
      <View style={s.navBaslik}>
        <Text style={s.largeTitle}>{isimSoyisim || 'CrewLog'}</Text>
        <TouchableOpacity onPress={cikisYap} activeOpacity={0.7}>
          <Text style={s.cikisYazi}>Cikis</Text>
        </TouchableOpacity>
      </View>

      <View style={s.profilRow}>
        <View style={s.avatar}>
          <Text style={s.avatarHarf}>{isimSoyisim.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.isimYazi}>{isimSoyisim}</Text>
          <Text style={s.unvanYazi}>{unvan}</Text>
        </View>
      </View>

      <Text style={s.bolumBaslik}>SON 30 GUN</Text>
      <View style={s.ozetKart}>
        <View style={s.ozetItem}>
          <Text style={[s.ozetSayi, { color: GREEN }]}>{gelenGun}</Text>
          <Text style={s.ozetEtiket}>Geldi</Text>
        </View>
        <View style={s.ozetAyrac} />
        <View style={s.ozetItem}>
          <Text style={[s.ozetSayi, { color: RED }]}>{toplamGun - gelenGun}</Text>
          <Text style={s.ozetEtiket}>Gelmedi</Text>
        </View>
        <View style={s.ozetAyrac} />
        <View style={s.ozetItem}>
          <Text style={s.ozetSayi}>{toplamGun}</Text>
          <Text style={s.ozetEtiket}>Toplam</Text>
        </View>
      </View>

      <Text style={s.katilimYazi}>Katilim %{katilimYuzde}</Text>

      {kayitlar.length === 0 ? (
        <View style={s.grupKapsayici}>
          <View style={s.bosRow}>
            <Text style={s.bosYazi}>Henuz kayit bulunmuyor</Text>
          </View>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          <Text style={s.bolumBaslik}>KAYITLAR</Text>
          <View style={s.grupKapsayici}>
            {kayitlar.map((kayit, idx) => {
              let fm = 0
              if (kayit.check_in && kayit.check_out) {
                const dk = Math.floor(
                  (new Date(kayit.check_out).getTime() - new Date(kayit.check_in).getTime()) / 60000
                )
                fm = Math.max(0, (dk - 480) / 60)
              } else if (kayit.overtime_hours) {
                fm = kayit.overtime_hours
              }

              return (
                <View key={kayit.id}>
                  <View style={s.satirRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.tarihYazi}>
                        {new Date(kayit.date + 'T00:00:00').toLocaleDateString('tr-TR', {
                          day: 'numeric', month: 'long', weekday: 'short'
                        })}
                      </Text>
                      <Text style={s.santiyeAdi}>{kayit.sites?.name}</Text>
                      {kayit.check_in && (
                        <Text style={s.saatler}>
                          {saatGoster(kayit.check_in)}
                          {kayit.check_out
                            ? `  -  ${saatGoster(kayit.check_out)}  ·  ${sure(kayit.check_in, kayit.check_out)}`
                            : ''}
                        </Text>
                      )}
                      {fm > 0 && (
                        <Text style={s.fazlaMesai}>
                          +{Math.round(fm * 10) / 10}s fazla mesai
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
              )
            })}
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
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  largeTitle: { fontSize: 34, fontWeight: '700', color: LABEL },
  cikisYazi: { fontSize: 17, color: ORANGE, paddingBottom: 6 },
  profilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BG3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHarf: { color: ORANGE, fontWeight: '800', fontSize: 22 },
  isimYazi: { fontSize: 17, fontWeight: '600', color: LABEL },
  unvanYazi: { fontSize: 13, color: LABEL2, marginTop: 2 },
  bolumBaslik: {
    fontSize: 13,
    color: LABEL2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 32,
    paddingBottom: 8,
    paddingTop: 20,
  },
  ozetKart: {
    flexDirection: 'row',
    backgroundColor: BG2,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  ozetItem: { flex: 1, paddingVertical: 16, alignItems: 'center', gap: 2 },
  ozetAyrac: { width: StyleSheet.hairlineWidth, backgroundColor: SEP },
  ozetSayi: { fontSize: 28, fontWeight: '700', color: LABEL },
  ozetEtiket: { fontSize: 13, color: LABEL2 },
  katilimYazi: {
    fontSize: 13,
    color: LABEL2,
    paddingHorizontal: 32,
    paddingTop: 8,
  },
  grupKapsayici: {
    backgroundColor: BG2,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  satirRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  tarihYazi: { fontSize: 17, fontWeight: '600', color: LABEL },
  santiyeAdi: { fontSize: 13, color: LABEL2, marginTop: 2 },
  saatler: { fontSize: 12, color: LABEL2, marginTop: 3 },
  fazlaMesai: { fontSize: 12, color: ORANGE, marginTop: 2 },
  durumRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
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
