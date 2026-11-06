import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator, Alert, TextInput
} from 'react-native'
import { supabase } from '../lib/supabase'

const BG = '#000000'
const BG2 = '#1C1C1E'
const BG3 = '#2C2C2E'
const SEP = '#38383A'
const LABEL = '#FFFFFF'
const LABEL2 = '#8E8E93'
const ORANGE = '#FF9500'
const RED = '#FF453A'

type Santiye = { id: string; name: string }
type Hava = 'Güneşli' | 'Bulutlu' | 'Yağmurlu' | 'Karlı' | 'Rüzgarlı'
type Gunluk = {
  id: string
  date: string
  weather: Hava
  worker_count: number
  notes: string | null
  site_id: string
}

const HAVALAR: Hava[] = ['Güneşli', 'Bulutlu', 'Yağmurlu', 'Karlı', 'Rüzgarlı']

function bugunIso(): string {
  return new Date().toISOString().split('T')[0]
}

export default function GunlukEkrani({ onGeri }: { onGeri: () => void }) {
  const [santiyeler, setSantiyeler] = useState<Santiye[]>([])
  const [seciliSantiye, setSeciliSantiye] = useState<Santiye | null>(null)
  const [gunlukler, setGunlukler] = useState<Gunluk[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [formAcik, setFormAcik] = useState(false)
  const [kaydediyor, setKaydediyor] = useState(false)

  const [formTarih, setFormTarih] = useState(bugunIso())
  const [formHava, setFormHava] = useState<Hava>('Güneşli')
  const [formIsciSayisi, setFormIsciSayisi] = useState('')
  const [formNotlar, setFormNotlar] = useState('')

  useEffect(() => { yukle() }, [])
  useEffect(() => {
    if (seciliSantiye && companyId) gunlukleriGetir()
  }, [seciliSantiye])

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
    if (list.length > 0) setSeciliSantiye(list[0])
    setYukleniyor(false)
  }

  async function gunlukleriGetir() {
    if (!seciliSantiye || !companyId) return
    const otuzGunOnce = new Date()
    otuzGunOnce.setDate(otuzGunOnce.getDate() - 30)
    const { data } = await supabase
      .from('site_logs')
      .select('id, date, weather, worker_count, notes, site_id')
      .eq('company_id', companyId)
      .eq('site_id', seciliSantiye.id)
      .gte('date', otuzGunOnce.toISOString().split('T')[0])
      .order('date', { ascending: false })
    setGunlukler((data as any) ?? [])
  }

  async function gunlukEkle() {
    if (!companyId || !seciliSantiye) return
    if (!formIsciSayisi || isNaN(Number(formIsciSayisi))) {
      Alert.alert('Hata', 'Gecerli bir isci sayisi girin')
      return
    }
    setKaydediyor(true)
    const { error } = await supabase.from('site_logs').insert({
      company_id: companyId,
      site_id: seciliSantiye.id,
      date: formTarih,
      weather: formHava,
      worker_count: Number(formIsciSayisi),
      notes: formNotlar || null,
    })
    setKaydediyor(false)
    if (error) {
      Alert.alert('Hata', error.message)
    } else {
      setFormAcik(false)
      setFormTarih(bugunIso())
      setFormHava('Güneşli')
      setFormIsciSayisi('')
      setFormNotlar('')
      gunlukleriGetir()
    }
  }

  async function sil(id: string) {
    Alert.alert('Sil', 'Bu gunluk kaydini silmek istiyor musunuz?', [
      { text: 'Vazgec', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          await supabase.from('site_logs').delete().eq('id', id)
          setGunlukler(prev => prev.filter(g => g.id !== id))
        }
      }
    ])
  }

  if (yukleniyor) {
    return (
      <SafeAreaView style={s.kapsayici}>
        <ActivityIndicator size="large" color={ORANGE} style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.kapsayici}>
      <View style={s.navBaslik}>
        <TouchableOpacity onPress={onGeri}>
          <Text style={s.geri}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={s.baslikYazi}>Santiye Gunlugu</Text>
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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        <TouchableOpacity
          style={s.ekleBtn}
          onPress={() => setFormAcik(!formAcik)}
          activeOpacity={0.85}
        >
          <Text style={s.ekleBtnYazi}>
            {formAcik ? 'Formu Kapat' : 'Giris Ekle'}
          </Text>
        </TouchableOpacity>

        {formAcik && (
          <>
            <Text style={s.bolumBaslik}>YENİ GİRİŞ</Text>
            <View style={s.grupKapsayici}>
              <View style={s.inputRow}>
                <Text style={s.inputEtiket}>Tarih</Text>
                <TextInput
                  style={s.inputField}
                  value={formTarih}
                  onChangeText={setFormTarih}
                  placeholder="YYYY-AA-GG"
                  placeholderTextColor={LABEL2}
                />
              </View>
              <View style={s.ayrac} />
              <View style={s.inputRow}>
                <Text style={s.inputEtiket}>Isci sayisi</Text>
                <TextInput
                  style={s.inputField}
                  value={formIsciSayisi}
                  onChangeText={setFormIsciSayisi}
                  placeholder="0"
                  placeholderTextColor={LABEL2}
                  keyboardType="number-pad"
                />
              </View>
              <View style={s.ayrac} />
              <View style={[s.inputRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                <Text style={[s.inputEtiket, { marginBottom: 8 }]}>Notlar</Text>
                <TextInput
                  style={s.textArea}
                  value={formNotlar}
                  onChangeText={setFormNotlar}
                  placeholder="Gunluk notlar, yapilan isler..."
                  placeholderTextColor={LABEL2}
                  multiline
                />
              </View>
            </View>

            <Text style={s.bolumBaslik}>HAVA DURUMU</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              style={{ marginBottom: 4 }}
            >
              {HAVALAR.map(h => (
                <TouchableOpacity
                  key={h}
                  style={[s.havaPil, formHava === h && s.havaPilSecili]}
                  onPress={() => setFormHava(h)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.havaPilYazi, formHava === h && { color: ORANGE }]}>
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[s.kaydetBtn, kaydediyor && { opacity: 0.5 }]}
              onPress={gunlukEkle}
              disabled={kaydediyor}
              activeOpacity={0.85}
            >
              <Text style={s.kaydetYazi}>
                {kaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {gunlukler.length > 0 ? (
          <>
            <Text style={s.bolumBaslik}>SON 30 GÜN</Text>
            <View style={s.grupKapsayici}>
              {gunlukler.map((g, idx) => (
                <View key={g.id}>
                  <View style={s.gunlukSatir}>
                    <View style={{ flex: 1 }}>
                      <View style={s.gunlukUst}>
                        <Text style={s.tarihYazi}>
                          {new Date(g.date + 'T00:00:00').toLocaleDateString('tr-TR', {
                            day: 'numeric', month: 'long', weekday: 'short'
                          })}
                        </Text>
                        <Text style={s.havaYazi}>{g.weather}</Text>
                      </View>
                      <Text style={s.isciSayisi}>{g.worker_count} isci</Text>
                      {g.notes ? (
                        <Text style={s.notlar} numberOfLines={2}>{g.notes}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => sil(g.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={s.silYazi}>Sil</Text>
                    </TouchableOpacity>
                  </View>
                  {idx < gunlukler.length - 1 && <View style={s.ayrac} />}
                </View>
              ))}
            </View>
          </>
        ) : !formAcik ? (
          <>
            <Text style={s.bolumBaslik}>SON 30 GÜN</Text>
            <View style={s.grupKapsayici}>
              <View style={s.bosRow}>
                <Text style={s.bosYazi}>Son 30 gunde gunluk kaydi yok</Text>
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
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
  ekleBtn: {
    backgroundColor: BG2,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
  },
  ekleBtnYazi: { color: ORANGE, fontSize: 17, fontWeight: '600' },
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    backgroundColor: BG2,
  },
  inputEtiket: { fontSize: 17, color: LABEL, width: 110 },
  inputField: {
    flex: 1,
    fontSize: 17,
    color: LABEL,
    textAlign: 'right',
  },
  textArea: {
    width: '100%',
    fontSize: 17,
    color: LABEL,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  ayrac: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: SEP,
    marginLeft: 16,
  },
  havaPil: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: BG2,
  },
  havaPilSecili: { backgroundColor: BG3 },
  havaPilYazi: { fontSize: 15, color: LABEL2 },
  kaydetBtn: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  kaydetYazi: { color: '#fff', fontSize: 17, fontWeight: '600' },
  gunlukSatir: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BG2,
  },
  gunlukUst: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  tarihYazi: { fontSize: 17, fontWeight: '600', color: LABEL },
  havaYazi: { fontSize: 13, color: LABEL2 },
  isciSayisi: { fontSize: 13, color: LABEL2 },
  notlar: { fontSize: 13, color: LABEL2, marginTop: 4, lineHeight: 18 },
  silYazi: { fontSize: 13, color: RED, marginLeft: 12 },
  bosRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: BG2,
    alignItems: 'center',
  },
  bosYazi: { fontSize: 15, color: LABEL2 },
})
