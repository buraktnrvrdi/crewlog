import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator
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

type Isci = {
  id: string
  full_name: string
  job_title: string | null
  is_active: boolean
}

function buAyAralik(): { baslangic: string; bitis: string } {
  const simdi = new Date()
  const yil = simdi.getFullYear()
  const ay = simdi.getMonth() + 1
  const sonAy = new Date(yil, ay, 0)
  return {
    baslangic: `${yil}-${String(ay).padStart(2, '0')}-01`,
    bitis: `${yil}-${String(ay).padStart(2, '0')}-${String(sonAy.getDate()).padStart(2, '00')}`,
  }
}

export default function IsciListesiEkrani({
  onGeri,
  onIsciSec,
}: {
  onGeri: () => void
  onIsciSec: (workerId: string, workerAd: string) => void
}) {
  const [isciler, setIsciler] = useState<Isci[]>([])
  const [avansOzetleri, setAvansOzetleri] = useState<Record<string, number>>({})
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => { yukle() }, [])

  async function yukle() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data: profile } = await supabase
      .from('profiles').select('company_id').eq('id', session.user.id).single()
    if (!profile?.company_id) return

    const { baslangic, bitis } = buAyAralik()

    const [{ data: workers }, { data: advances }] = await Promise.all([
      supabase.from('workers')
        .select('id, full_name, job_title, is_active')
        .eq('company_id', profile.company_id)
        .order('full_name'),
      supabase.from('advances')
        .select('worker_id, amount')
        .eq('company_id', profile.company_id)
        .gte('date', baslangic)
        .lte('date', bitis),
    ])

    setIsciler(workers ?? [])

    const ozetMap: Record<string, number> = {}
    advances?.forEach(a => {
      ozetMap[a.worker_id] = (ozetMap[a.worker_id] ?? 0) + a.amount
    })
    setAvansOzetleri(ozetMap)
    setYukleniyor(false)
  }

  if (yukleniyor) {
    return (
      <SafeAreaView style={s.kapsayici}>
        <ActivityIndicator size="large" color={ORANGE} style={{ flex: 1 }} />
      </SafeAreaView>
    )
  }

  const aktifler = isciler.filter(i => i.is_active)
  const pasifler = isciler.filter(i => !i.is_active)

  function IsciSatir({ isci, sonSatir }: { isci: Isci; sonSatir: boolean }) {
    const avans = avansOzetleri[isci.id] ?? 0
    return (
      <View>
        <TouchableOpacity
          style={s.isciRow}
          onPress={() => onIsciSec(isci.id, isci.full_name)}
          activeOpacity={0.6}
        >
          <View style={s.avatar}>
            <Text style={s.avatarHarf}>{isci.full_name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.isimYazi}>{isci.full_name}</Text>
            <Text style={s.unvanYazi}>{isci.job_title || 'Isci'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            {avans > 0 && (
              <Text style={s.avansYazi}>{'₺' + avans.toLocaleString('tr-TR')}</Text>
            )}
            <Text style={s.sag}>›</Text>
          </View>
        </TouchableOpacity>
        {!sonSatir && <View style={s.ayrac} />}
      </View>
    )
  }

  return (
    <SafeAreaView style={s.kapsayici}>
      <View style={s.navBaslik}>
        <TouchableOpacity onPress={onGeri}>
          <Text style={s.geri}>‹ Geri</Text>
        </TouchableOpacity>
        <Text style={s.baslikYazi}>Isciler</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {aktifler.length > 0 && (
          <>
            <Text style={s.bolumBaslik}>AKTİF ({aktifler.length})</Text>
            <View style={s.grupKapsayici}>
              {aktifler.map((isci, idx) => (
                <IsciSatir
                  key={isci.id}
                  isci={isci}
                  sonSatir={idx === aktifler.length - 1}
                />
              ))}
            </View>
          </>
        )}

        {pasifler.length > 0 && (
          <>
            <Text style={s.bolumBaslik}>PASİF ({pasifler.length})</Text>
            <View style={s.grupKapsayici}>
              {pasifler.map((isci, idx) => (
                <IsciSatir
                  key={isci.id}
                  isci={isci}
                  sonSatir={idx === pasifler.length - 1}
                />
              ))}
            </View>
          </>
        )}

        {isciler.length === 0 && (
          <>
            <Text style={s.bolumBaslik}>İŞÇİLER</Text>
            <View style={s.grupKapsayici}>
              <View style={s.bosRow}>
                <Text style={s.bosYazi}>Henuz isci kaydi yok</Text>
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
  isciRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
    backgroundColor: BG2,
  },
  ayrac: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: SEP,
    marginLeft: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BG3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHarf: { color: ORANGE, fontWeight: '700', fontSize: 17 },
  isimYazi: { fontSize: 17, color: LABEL },
  unvanYazi: { fontSize: 13, color: LABEL2, marginTop: 2 },
  avansYazi: { fontSize: 13, color: RED },
  sag: { fontSize: 20, color: LABEL2 },
  bosRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: BG2,
    alignItems: 'center',
  },
  bosYazi: { fontSize: 15, color: LABEL2 },
})
