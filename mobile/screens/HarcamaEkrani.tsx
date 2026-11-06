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
type Kategori = 'Malzeme' | 'Yakıt' | 'Alet' | 'Nakliye' | 'İşçilik' | 'Diğer'
type Harcama = {
  id: string
  date: string
  category: Kategori
  description: string
  amount: number
  site_id: string
}

const KATEGORILER: Kategori[] = ['Malzeme', 'Yakıt', 'Alet', 'Nakliye', 'İşçilik', 'Diğer']

const KAT_RENK: Record<Kategori, string> = {
  Malzeme: '#0A84FF',
  Yakıt: '#FF9500',
  Alet: '#BF5AF2',
  Nakliye: '#FFD60A',
  İşçilik: '#30D158',
  Diğer: '#8E8E93',
}

function ayYazi(yil: number, ay: number): string {
  const d = new Date(yil, ay - 1, 1)
  return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
}

function bugunIso(): string {
  return new Date().toISOString().split('T')[0]
}

export default function HarcamaEkrani({ onGeri }: { onGeri: () => void }) {
  const simdi = new Date()
  const [yil, setYil] = useState(simdi.getFullYear())
  const [ay, setAy] = useState(simdi.getMonth() + 1)
  const [santiyeler, setSantiyeler] = useState<Santiye[]>([])
  const [seciliSantiye, setSeciliSantiye] = useState<Santiye | null>(null)
  const [harcamalar, setHarcamalar] = useState<Harcama[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [formAcik, setFormAcik] = useState(false)
  const [kaydediyor, setKaydediyor] = useState(false)

  const [formTarih, setFormTarih] = useState(bugunIso())
  const [formKategori, setFormKategori] = useState<Kategori>('Malzeme')
  const [formAciklama, setFormAciklama] = useState('')
  const [formTutar, setFormTutar] = useState('')

  useEffect(() => { yukle() }, [])
  useEffect(() => {
    if (seciliSantiye && companyId) harcamalariGetir()
  }, [seciliSantiye, yil, ay])

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

  async function harcamalariGetir() {
    if (!seciliSantiye || !companyId) return
    const baslangic = `${yil}-${String(ay).padStart(2, '0')}-01`
    const sonAy = new Date(yil, ay, 0)
    const bitis = `${yil}-${String(ay).padStart(2, '0')}-${String(sonAy.getDate()).padStart(2, '0')}`

    const { data } = await supabase
      .from('site_expenses')
      .select('id, date, category, description, amount, site_id')
      .eq('company_id', companyId)
      .eq('site_id', seciliSantiye.id)
      .gte('date', baslangic)
      .lte('date', bitis)
      .order('date', { ascending: false })
    setHarcamalar((data as any) ?? [])
  }

  async function harcamaEkle() {
    if (!companyId || !seciliSantiye) return
    if (!formTutar || isNaN(Number(formTutar)) || Number(formTutar) <= 0) {
      Alert.alert('Hata', 'Gecerli bir tutar girin')
      return
    }
    setKaydediyor(true)
    const { error } = await supabase.from('site_expenses').insert({
      company_id: companyId,
      site_id: seciliSantiye.id,
      date: formTarih,
      category: formKategori,
      description: formAciklama,
      amount: Number(formTutar),
    })
    setKaydediyor(false)
    if (error) {
      Alert.alert('Hata', error.message)
    } else {
      setFormAcik(false)
      setFormAciklama('')
      setFormTutar('')
      setFormTarih(bugunIso())
      setFormKategori('Malzeme')
      harcamalariGetir()
    }
  }

  async function sil(id: string) {
    Alert.alert('Sil', 'Bu harcamayi silmek istediginizden emin misiniz?', [
      { text: 'Vazgec', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          await supabase.from('site_expenses').delete().eq('id', id)
          setHarcamalar(prev => prev.filter(h => h.id !== id))
        }
      }
    ])
  }

  function oncekiAy() {
    if (ay === 1) { setYil(y => y - 1); setAy(12) }
    else setAy(a => a - 1)
  }

  function sonrakiAy() {
    if (ay === 12) { setYil(y => y + 1); setAy(1) }
    else setAy(a => a + 1)
  }

  const toplam = harcamalar.reduce((s, h) => s + h.amount, 0)

  if (yukleniyor) {
    return (
      <SafeAreaView style={s.kapsayici}>
        <ActivityIndicator size="large" color={ORANGE} style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.kapsayici}>
      <View style={s.largeTitleRow}>
        <Text style={s.largeTitle}>Harcamalar</Text>
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

      <View style={s.aySecici}>
        <TouchableOpacity onPress={oncekiAy} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.ayBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={s.ayYazi}>{ayYazi(yil, ay)}</Text>
        <TouchableOpacity onPress={sonrakiAy} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.ayBtn}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={s.ozetKart}>
          <Text style={s.toplamTutar}>{'₺' + toplam.toLocaleString('tr-TR')}</Text>
          <Text style={s.kayitSayisi}>{harcamalar.length} kayıt</Text>
        </View>

        <TouchableOpacity
          style={s.ekleBtn}
          onPress={() => setFormAcik(!formAcik)}
          activeOpacity={0.85}
        >
          <Text style={s.ekleBtnYazi}>
            {formAcik ? 'Formu Kapat' : 'Harcama Ekle'}
          </Text>
        </TouchableOpacity>

        {formAcik && (
          <>
            <Text style={s.bolumBaslik}>KATEGORİ</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              style={{ marginBottom: 4 }}
            >
              {KATEGORILER.map(k => (
                <TouchableOpacity
                  key={k}
                  style={[s.katPil, formKategori === k && { backgroundColor: ORANGE }]}
                  onPress={() => setFormKategori(k)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.katPilYazi, formKategori === k && { color: '#fff' }]}>
                    {k}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.bolumBaslik}>BİLGİLER</Text>
            <View style={s.grupKapsayici}>
              <View style={s.inputRow}>
                <Text style={s.inputEtiket}>Santiye</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {santiyeler.map(site => (
                      <TouchableOpacity
                        key={site.id}
                        style={[s.miniPil, seciliSantiye?.id === site.id && { backgroundColor: ORANGE }]}
                        onPress={() => setSeciliSantiye(site)}
                      >
                        <Text style={[s.miniPilYazi, seciliSantiye?.id === site.id && { color: '#fff' }]}>
                          {site.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <View style={s.ayrac} />
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
                <Text style={s.inputEtiket}>Aciklama</Text>
                <TextInput
                  style={s.inputField}
                  value={formAciklama}
                  onChangeText={setFormAciklama}
                  placeholder="Harcama aciklamasi"
                  placeholderTextColor={LABEL2}
                />
              </View>
              <View style={s.ayrac} />
              <View style={s.inputRow}>
                <Text style={s.inputEtiket}>Tutar (₺)</Text>
                <TextInput
                  style={s.inputField}
                  value={formTutar}
                  onChangeText={setFormTutar}
                  placeholder="0.00"
                  placeholderTextColor={LABEL2}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[s.kaydetBtn, kaydediyor && { opacity: 0.5 }]}
              onPress={harcamaEkle}
              disabled={kaydediyor}
              activeOpacity={0.85}
            >
              <Text style={s.kaydetYazi}>
                {kaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {harcamalar.length > 0 && (
          <>
            <Text style={s.bolumBaslik}>HARCAMALAR</Text>
            <View style={s.grupKapsayici}>
              {harcamalar.map((h, idx) => (
                <View key={h.id}>
                  <View style={s.harcamaSatir}>
                    <View style={[s.katDot, { backgroundColor: KAT_RENK[h.category as Kategori] }]} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={s.aciklamaYazi}>{h.description || '—'}</Text>
                      <Text style={s.tarihYazi}>
                        {new Date(h.date + 'T00:00:00').toLocaleDateString('tr-TR', {
                          day: 'numeric', month: 'long'
                        })}
                        {'  ·  '}
                        {h.category}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={s.tutarYazi}>{'₺' + h.amount.toLocaleString('tr-TR')}</Text>
                      <TouchableOpacity onPress={() => sil(h.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={s.silYazi}>Sil</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {idx < harcamalar.length - 1 && <View style={s.ayrac} />}
                </View>
              ))}
            </View>
          </>
        )}

        {harcamalar.length === 0 && !formAcik && (
          <>
            <Text style={s.bolumBaslik}>HARCAMALAR</Text>
            <View style={s.grupKapsayici}>
              <View style={s.bosRow}>
                <Text style={s.bosYazi}>Bu dönem için harcama kaydı yok</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: BG },
  largeTitleRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  largeTitle: { fontSize: 34, fontWeight: '700', color: LABEL },
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
  aySecici: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  ayBtn: { fontSize: 22, color: LABEL2, fontWeight: '400', width: 32, textAlign: 'center' },
  ayYazi: { fontSize: 17, fontWeight: '600', color: LABEL },
  ozetKart: {
    backgroundColor: BG2,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 4,
  },
  toplamTutar: { fontSize: 28, fontWeight: '700', color: LABEL },
  kayitSayisi: { fontSize: 13, color: LABEL2 },
  ekleBtn: {
    backgroundColor: BG2,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 4,
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
  katPil: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: BG2,
  },
  katPilYazi: { fontSize: 15, color: LABEL2 },
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
  inputEtiket: { fontSize: 17, color: LABEL, width: 90 },
  inputField: {
    flex: 1,
    fontSize: 17,
    color: LABEL,
    textAlign: 'right',
  },
  ayrac: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: SEP,
    marginLeft: 16,
  },
  miniPil: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: BG3,
  },
  miniPilYazi: { fontSize: 13, color: LABEL2 },
  kaydetBtn: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  kaydetYazi: { color: '#fff', fontSize: 17, fontWeight: '600' },
  harcamaSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
    backgroundColor: BG2,
  },
  katDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  aciklamaYazi: { fontSize: 17, color: LABEL },
  tarihYazi: { fontSize: 13, color: LABEL2, marginTop: 2 },
  tutarYazi: { fontSize: 15, fontWeight: '700', color: RED },
  silYazi: { fontSize: 12, color: RED },
  bosRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: BG2,
    alignItems: 'center',
  },
  bosYazi: { fontSize: 15, color: LABEL2 },
})
