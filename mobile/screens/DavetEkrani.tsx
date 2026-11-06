import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Share, ActivityIndicator, ScrollView, Alert, Clipboard
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

type Davet = {
  id: string
  code: string
  role: string
  use_count: number
  max_uses: number
  expires_at: string
  worker_id: string | null
}

type Isci = { id: string; full_name: string }

const ROL_LABEL: Record<string, string> = {
  admin: 'Yönetici',
  foreman: 'Şef / Ustabaşı',
  worker: 'Çalışan',
}

function kodUret(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let kod = ''
  for (let i = 0; i < 6; i++) kod += chars[Math.floor(Math.random() * chars.length)]
  return kod
}

function kalanGun(expires_at: string): string {
  const kalan = Math.ceil((new Date(expires_at).getTime() - Date.now()) / 86400000)
  if (kalan <= 0) return 'Suresi doldu'
  return `${kalan} gun kaldi`
}

export default function DavetEkrani({ onGeri }: { onGeri: () => void }) {
  const [davetler, setDavetler] = useState<Davet[]>([])
  const [isciler, setIsciler] = useState<Isci[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [olusturuluyor, setOlusturuluyor] = useState(false)
  const [seciliRol, setSeciliRol] = useState<'foreman' | 'admin' | 'worker'>('foreman')
  const [seciliIsci, setSeciliIsci] = useState<string>('')
  const [isciSecimAcik, setIsciSecimAcik] = useState(false)

  useEffect(() => { yukle() }, [])

  async function yukle() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setUserId(session.user.id)

    const { data: profile } = await supabase
      .from('profiles').select('company_id').eq('id', session.user.id).single()
    if (!profile?.company_id) return
    setCompanyId(profile.company_id)

    const [{ data: davetData }, { data: workers }] = await Promise.all([
      supabase.from('invitations')
        .select('id, code, role, use_count, max_uses, expires_at, worker_id')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('workers').select('id, full_name')
        .eq('company_id', profile.company_id).eq('is_active', true).order('full_name'),
    ])

    setDavetler(davetData ?? [])
    setIsciler(workers ?? [])
    setYukleniyor(false)
  }

  async function davetOlustur() {
    if (!companyId || !userId) return
    if (seciliRol === 'worker' && !seciliIsci) {
      Alert.alert('Hata', 'Calisan secmelisiniz')
      return
    }
    setOlusturuluyor(true)

    let kod = kodUret()
    let deneme = 0
    while (deneme < 5) {
      const { data: mevcut } = await supabase.from('invitations').select('id').eq('code', kod).single()
      if (!mevcut) break
      kod = kodUret()
      deneme++
    }

    const expires = new Date()
    expires.setDate(expires.getDate() + 7)

    const { data, error } = await supabase.from('invitations').insert({
      company_id: companyId,
      code: kod,
      role: seciliRol,
      created_by: userId,
      expires_at: expires.toISOString(),
      worker_id: seciliRol === 'worker' ? seciliIsci : null,
      max_uses: seciliRol === 'worker' ? 1 : 20,
    }).select().single()

    if (error) {
      Alert.alert('Hata', error.message)
    } else {
      setDavetler(prev => [data as Davet, ...prev])
      setSeciliIsci('')
    }
    setOlusturuluyor(false)
  }

  async function paylas(kod: string, rol: string) {
    await Share.share({
      message: `CrewLog'a davetlisiniz!\n\nDavet kodunuz: ${kod}\nRolunuz: ${ROL_LABEL[rol]}\n\nUygulamayi indirip kayit olurken bu kodu girin. (7 gun gecerli)`,
    })
  }

  function kopyala(kod: string) {
    Clipboard.setString(kod)
    Alert.alert('Kopyalandi', `Kod panoya kopyalandi: ${kod}`)
  }

  async function sil(id: string) {
    Alert.alert('Daveti Sil', 'Bu daveti silmek istediginizden emin misiniz?', [
      { text: 'Vazgec', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          await supabase.from('invitations').delete().eq('id', id).eq('company_id', companyId!)
          setDavetler(prev => prev.filter(d => d.id !== id))
        }
      }
    ])
  }

  const seciliIsciAdi = isciler.find(i => i.id === seciliIsci)?.full_name ?? 'Calisan Sec'
  const davetIsciAdi = (wid: string | null) => wid ? (isciler.find(i => i.id === wid)?.full_name ?? '') : ''

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
        <Text style={s.baslikYazi}>Davet</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={s.bolumBaslik}>YENİ DAVET KODU OLUŞTUR</Text>
        <View style={s.grupKapsayici}>
          <View style={s.satirRow}>
            <Text style={s.inputEtiket}>Rol</Text>
            <View style={s.rolRow}>
              {(['foreman', 'worker', 'admin'] as const).map((r, idx) => (
                <TouchableOpacity
                  key={r}
                  style={[s.rolPil, seciliRol === r && s.rolPilSecili]}
                  onPress={() => { setSeciliRol(r); setSeciliIsci('') }}
                  activeOpacity={0.7}
                >
                  <Text style={[s.rolPilYazi, seciliRol === r && s.rolPilYaziSecili]}>
                    {r === 'foreman' ? 'Sef' : r === 'worker' ? 'Calisan' : 'Yonetici'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {seciliRol === 'worker' && (
            <>
              <View style={s.ayrac} />
              <TouchableOpacity
                style={s.satirRow}
                onPress={() => setIsciSecimAcik(!isciSecimAcik)}
                activeOpacity={0.6}
              >
                <Text style={s.inputEtiket}>Calisan</Text>
                <Text style={[s.isciSecYazi, seciliIsci ? { color: LABEL } : {}]}>
                  {seciliIsciAdi}
                </Text>
                <Text style={{ color: LABEL2, fontSize: 14, marginLeft: 6 }}>
                  {isciSecimAcik ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              {isciSecimAcik && (
                <>
                  <View style={s.ayrac} />
                  {isciler.map((isci, idx) => (
                    <View key={isci.id}>
                      <TouchableOpacity
                        style={s.satirRow}
                        onPress={() => { setSeciliIsci(isci.id); setIsciSecimAcik(false) }}
                        activeOpacity={0.6}
                      >
                        <Text style={[s.isciAdi, seciliIsci === isci.id && { color: ORANGE }]}>
                          {isci.full_name}
                        </Text>
                      </TouchableOpacity>
                      {idx < isciler.length - 1 && <View style={s.ayrac} />}
                    </View>
                  ))}
                  {isciler.length === 0 && (
                    <View style={s.bosRow}>
                      <Text style={s.bosYazi}>Isci bulunamadi</Text>
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </View>

        <TouchableOpacity
          style={[s.olusturBtn, olusturuluyor && { opacity: 0.5 }]}
          onPress={davetOlustur}
          disabled={olusturuluyor}
          activeOpacity={0.85}
        >
          <Text style={s.olusturYazi}>
            {olusturuluyor ? 'Olusturuluyor...' : 'Kod Olustur'}
          </Text>
        </TouchableOpacity>
        <Text style={s.aciklamaYazi}>7 gun gecerli · 20 kez kullanilabilir</Text>

        {davetler.length > 0 && (
          <>
            <Text style={s.bolumBaslik}>AKTİF KODLAR</Text>
            <View style={s.grupKapsayici}>
              {davetler.map((davet, idx) => {
                const suresi = kalanGun(davet.expires_at)
                const doldu = suresi === 'Suresi doldu'
                return (
                  <View key={davet.id} style={{ opacity: doldu ? 0.4 : 1 }}>
                    <View style={s.davetSatir}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.davetKod}>{davet.code}</Text>
                        <Text style={s.davetAlt}>
                          {ROL_LABEL[davet.role]}
                          {davet.worker_id ? ` · ${davetIsciAdi(davet.worker_id)}` : ''}
                        </Text>
                        <Text style={s.davetAlt}>
                          {davet.use_count}/{davet.max_uses} kullanim · {suresi}
                        </Text>
                      </View>
                      <View style={s.davetButonlar}>
                        <TouchableOpacity
                          onPress={() => kopyala(davet.code)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={s.kopyalaYazi}>Kopyala</Text>
                        </TouchableOpacity>
                        {!doldu && (
                          <TouchableOpacity
                            onPress={() => paylas(davet.code, davet.role)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={s.paylasYazi}>Paylas</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => sil(davet.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={s.silYazi}>Sil</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {idx < davetler.length - 1 && <View style={s.ayrac} />}
                  </View>
                )
              })}
            </View>
          </>
        )}

        {davetler.length === 0 && (
          <>
            <Text style={s.bolumBaslik}>AKTİF KODLAR</Text>
            <View style={s.grupKapsayici}>
              <View style={s.bosRow}>
                <Text style={s.bosYazi}>Henuz davet kodu yok</Text>
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
  inputEtiket: { fontSize: 17, color: LABEL, width: 80 },
  rolRow: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  rolPil: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: BG3,
  },
  rolPilSecili: { backgroundColor: ORANGE },
  rolPilYazi: { fontSize: 13, color: LABEL2 },
  rolPilYaziSecili: { color: '#fff', fontWeight: '600' },
  isciSecYazi: { flex: 1, fontSize: 17, color: LABEL2, textAlign: 'right' },
  isciAdi: { fontSize: 17, color: LABEL, flex: 1 },
  olusturBtn: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  olusturYazi: { color: '#fff', fontWeight: '600', fontSize: 17 },
  aciklamaYazi: { fontSize: 13, color: LABEL2, textAlign: 'center', marginTop: 8 },
  davetSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: BG2,
    gap: 10,
  },
  davetKod: {
    fontSize: 24,
    fontWeight: '700',
    color: LABEL,
    letterSpacing: 4,
  },
  davetAlt: { fontSize: 12, color: LABEL2, marginTop: 2 },
  davetButonlar: { flexDirection: 'column', gap: 8, alignItems: 'flex-end' },
  kopyalaYazi: { color: ORANGE, fontSize: 15 },
  paylasYazi: { color: ORANGE, fontSize: 15 },
  silYazi: { color: RED, fontSize: 15 },
  bosRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: BG2,
    alignItems: 'center',
  },
  bosYazi: { fontSize: 15, color: LABEL2 },
})
