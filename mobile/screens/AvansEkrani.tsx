import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator, Alert, TextInput
} from 'react-native'
import { supabase } from '../lib/supabase'

const BG = '#000000'
const BG2 = '#1C1C1E'
const SEP = '#38383A'
const LABEL = '#FFFFFF'
const LABEL2 = '#8E8E93'
const ORANGE = '#FF9500'
const RED = '#FF453A'

type Avans = {
  id: string
  amount: number
  date: string
  description: string | null
  worker_id: string
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

export default function AvansEkrani({
  onGeri,
  workerId,
  workerAd,
}: {
  onGeri: () => void
  workerId: string
  workerAd: string
}) {
  const [avansBilgileri, setAvansBilgileri] = useState<Avans[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [formAcik, setFormAcik] = useState(false)
  const [kaydediyor, setKaydediyor] = useState(false)

  const [formTutar, setFormTutar] = useState('')
  const [formTarih, setFormTarih] = useState(bugunIso())
  const [formAciklama, setFormAciklama] = useState('')

  useEffect(() => { yukle() }, [])

  async function yukle() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data: profile } = await supabase
      .from('profiles').select('company_id').eq('id', session.user.id).single()
    if (!profile?.company_id) return
    setCompanyId(profile.company_id)
    await avanslariGetir(profile.company_id)
    setYukleniyor(false)
  }

  async function avanslariGetir(cid: string) {
    const { baslangic, bitis } = buAyAralik()
    const { data } = await supabase
      .from('advances')
      .select('id, amount, date, description, worker_id')
      .eq('company_id', cid)
      .eq('worker_id', workerId)
      .gte('date', baslangic)
      .lte('date', bitis)
      .order('date', { ascending: false })
    setAvansBilgileri((data as any) ?? [])
  }

  async function avansEkle() {
    if (!companyId) return
    if (!formTutar || isNaN(Number(formTutar)) || Number(formTutar) <= 0) {
      Alert.alert('Hata', 'Gecerli bir tutar girin')
      return
    }
    setKaydediyor(true)
    const { error } = await supabase.from('advances').insert({
      company_id: companyId,
      worker_id: workerId,
      amount: Number(formTutar),
      date: formTarih,
      description: formAciklama || null,
    })
    setKaydediyor(false)
    if (error) {
      Alert.alert('Hata', error.message)
    } else {
      setFormAcik(false)
      setFormTutar('')
      setFormTarih(bugunIso())
      setFormAciklama('')
      avanslariGetir(companyId)
    }
  }

  async function sil(id: string) {
    Alert.alert('Sil', 'Bu avans kaydini silmek istiyor musunuz?', [
      { text: 'Vazgec', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          await supabase.from('advances').delete().eq('id', id)
          setAvansBilgileri(prev => prev.filter(a => a.id !== id))
        }
      }
    ])
  }

  const toplamAvans = avansBilgileri.reduce((s, a) => s + a.amount, 0)

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
        <View style={{ alignItems: 'center' }}>
          <Text style={s.baslikYazi}>{workerAd}</Text>
          <Text style={s.baslikAlt}>Avans Takibi</Text>
        </View>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={s.toplamKart}>
          <Text style={s.toplamEtiket}>Bu Ay Toplam</Text>
          <Text style={s.toplamTutar}>{'-₺' + toplamAvans.toLocaleString('tr-TR')}</Text>
        </View>

        <TouchableOpacity
          style={s.ekleBtn}
          onPress={() => setFormAcik(!formAcik)}
          activeOpacity={0.85}
        >
          <Text style={s.ekleBtnYazi}>
            {formAcik ? 'Formu Kapat' : 'Avans Ekle'}
          </Text>
        </TouchableOpacity>

        {formAcik && (
          <>
            <Text style={s.bolumBaslik}>YENİ AVANS</Text>
            <View style={s.grupKapsayici}>
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
                  placeholder="Avans aciklamasi"
                  placeholderTextColor={LABEL2}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[s.kaydetBtn, kaydediyor && { opacity: 0.5 }]}
              onPress={avansEkle}
              disabled={kaydediyor}
              activeOpacity={0.85}
            >
              <Text style={s.kaydetYazi}>
                {kaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {avansBilgileri.length > 0 ? (
          <>
            <Text style={s.bolumBaslik}>AVANSLAR</Text>
            <View style={s.grupKapsayici}>
              {avansBilgileri.map((a, idx) => (
                <View key={a.id}>
                  <View style={s.avansSatir}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.aciklamaYazi}>{a.description || 'Avans'}</Text>
                      <Text style={s.tarihYazi}>
                        {new Date(a.date + 'T00:00:00').toLocaleDateString('tr-TR', {
                          day: 'numeric', month: 'long', weekday: 'short'
                        })}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={s.tutarYazi}>{'-₺' + a.amount.toLocaleString('tr-TR')}</Text>
                      <TouchableOpacity
                        onPress={() => sil(a.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={s.silYazi}>Sil</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {idx < avansBilgileri.length - 1 && <View style={s.ayrac} />}
                </View>
              ))}
            </View>
          </>
        ) : !formAcik ? (
          <>
            <Text style={s.bolumBaslik}>AVANSLAR</Text>
            <View style={s.grupKapsayici}>
              <View style={s.bosRow}>
                <Text style={s.bosYazi}>Bu ay avans kaydi yok</Text>
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
  baslikAlt: { fontSize: 12, color: LABEL2, marginTop: 1 },
  toplamKart: {
    backgroundColor: BG2,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 4,
  },
  toplamEtiket: { fontSize: 13, color: LABEL2 },
  toplamTutar: { fontSize: 28, fontWeight: '700', color: RED },
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
  ayrac: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: SEP,
    marginLeft: 16,
  },
  kaydetBtn: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  kaydetYazi: { color: '#fff', fontSize: 17, fontWeight: '600' },
  avansSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
    backgroundColor: BG2,
  },
  aciklamaYazi: { fontSize: 17, color: LABEL },
  tarihYazi: { fontSize: 13, color: LABEL2, marginTop: 2 },
  tutarYazi: { fontSize: 15, fontWeight: '700', color: RED },
  silYazi: { fontSize: 13, color: RED },
  bosRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: BG2,
    alignItems: 'center',
  },
  bosYazi: { fontSize: 15, color: LABEL2 },
})
