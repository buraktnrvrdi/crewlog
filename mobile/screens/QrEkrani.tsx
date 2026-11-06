import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Modal } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { supabase } from '../lib/supabase'
import { anlikBildirimGonder } from '../lib/bildirimler'

const BG = '#000000'
const BG2 = '#1C1C1E'
const SEP = '#38383A'
const LABEL = '#FFFFFF'
const LABEL2 = '#8E8E93'
const ORANGE = '#FF9500'
const GREEN = '#30D158'
const RED = '#FF453A'
const BLUE = '#0A84FF'

type Santiye = { id: string; name: string }
type Sonuc = {
  isim: string
  mesaj: string
  sure?: string
  tip: 'giris' | 'cikis' | 'hata'
}

type BekleyenIslem = {
  worker: { id: string; full_name: string }
  digerSantiyeAdi: string
  bugun: string
  simdi: string
}

function saatFarki(baslangic: string, bitis: string): string {
  const dk = Math.floor((new Date(bitis).getTime() - new Date(baslangic).getTime()) / 60000)
  const saat = Math.floor(dk / 60)
  const dakika = dk % 60
  return `${saat} saat ${dakika} dakika`
}

function saatGoster(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export default function QrEkrani({ onGeri }: { onGeri: () => void }) {
  const [izin, izinIste] = useCameraPermissions()
  const [taranıyor, setTaranıyor] = useState(true)
  const [sonuc, setSonuc] = useState<Sonuc | null>(null)
  const [santiyeler, setSantiyeler] = useState<Santiye[]>([])
  const [seciliSantiye, setSeciliSantiye] = useState<Santiye | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [bekleyenIslem, setBekleyenIslem] = useState<BekleyenIslem | null>(null)

  useEffect(() => { yukle() }, [])

  async function yukle() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: profile } = await supabase
      .from('profiles').select('company_id').eq('id', session.user.id).single()

    if (!profile?.company_id) return
    setCompanyId(profile.company_id)

    const { data: sites } = await supabase
      .from('sites').select('id, name')
      .eq('company_id', profile.company_id)
      .eq('is_active', true)
      .order('name')

    const list = sites ?? []
    setSantiyeler(list)
    if (list.length === 1) setSeciliSantiye(list[0])
    setYukleniyor(false)
  }

  async function qrOkundu({ data }: { data: string }) {
    if (!taranıyor || !seciliSantiye || !companyId) return
    setTaranıyor(false)

    const { data: worker } = await supabase
      .from('workers').select('id, full_name')
      .eq('qr_code', data).eq('company_id', companyId).single()

    if (!worker) {
      setSonuc({ isim: '', mesaj: 'Isci bulunamadi', tip: 'hata' })
      setTimeout(() => { setSonuc(null); setTaranıyor(true) }, 2500)
      return
    }

    const bugun = new Date().toISOString().split('T')[0]
    const simdi = new Date().toISOString()

    const { data: digerKayit } = await supabase
      .from('timesheets')
      .select('id, sites(name)')
      .eq('worker_id', worker.id)
      .eq('date', bugun)
      .neq('site_id', seciliSantiye.id)
      .not('check_in', 'is', null)
      .limit(1)
      .maybeSingle()

    if (digerKayit) {
      const digerSantiyeAdi = (digerKayit.sites as any)?.name ?? 'başka bir şantiye'
      setBekleyenIslem({ worker, digerSantiyeAdi, bugun, simdi })
      return
    }

    await girisIsleminiTamamla(worker, bugun, simdi)
  }

  async function girisIsleminiTamamla(
    worker: { id: string; full_name: string },
    bugun: string,
    simdi: string
  ) {
    if (!seciliSantiye || !companyId) return

    const { data: mevcutKayit } = await supabase
      .from('timesheets').select('id, check_in, check_out')
      .eq('worker_id', worker.id)
      .eq('site_id', seciliSantiye.id)
      .eq('date', bugun)
      .single()

    if (!mevcutKayit) {
      await supabase.from('timesheets').insert({
        worker_id: worker.id,
        site_id: seciliSantiye.id,
        company_id: companyId,
        date: bugun,
        status: 'present',
        check_in: simdi,
      })
      anlikBildirimGonder('Giris Kaydedildi', `${worker.full_name} — ${saatGoster(simdi)}`)
      setSonuc({ isim: worker.full_name, mesaj: `Giris kaydedildi — ${saatGoster(simdi)}`, tip: 'giris' })
    } else if (!mevcutKayit.check_in) {
      await supabase.from('timesheets').update({ check_in: simdi, status: 'present' }).eq('id', mevcutKayit.id)
      anlikBildirimGonder('Giris Kaydedildi', `${worker.full_name} — ${saatGoster(simdi)}`)
      setSonuc({ isim: worker.full_name, mesaj: `Giris kaydedildi — ${saatGoster(simdi)}`, tip: 'giris' })
    } else if (!mevcutKayit.check_out) {
      const dkFark = Math.floor((new Date(simdi).getTime() - new Date(mevcutKayit.check_in).getTime()) / 60000)
      const fazlaMesaiSaat = Math.max(0, (dkFark - 480) / 60)
      await supabase.from('timesheets').update({
        check_out: simdi,
        overtime_hours: fazlaMesaiSaat > 0 ? Math.round(fazlaMesaiSaat * 10) / 10 : 0,
      }).eq('id', mevcutKayit.id)
      const sureMesaj = saatFarki(mevcutKayit.check_in, simdi)
      const fmMesaj = fazlaMesaiSaat > 0 ? ` · ${Math.round(fazlaMesaiSaat * 10) / 10}s fazla mesai` : ''
      anlikBildirimGonder('Cikis Kaydedildi', `${worker.full_name} — ${saatGoster(simdi)} (${sureMesaj})`)
      setSonuc({
        isim: worker.full_name,
        mesaj: `Cikis kaydedildi — ${saatGoster(simdi)}`,
        sure: `Calisma suresi: ${sureMesaj}${fmMesaj}`,
        tip: 'cikis',
      })
    } else {
      setSonuc({ isim: worker.full_name, mesaj: 'Bugün cikis zaten kaydedilmis', tip: 'hata' })
    }

    setTimeout(() => { setSonuc(null); setTaranıyor(true) }, 4000)
  }

  if (!izin) return <View style={s.kapsayici} />

  if (!izin.granted) {
    return (
      <SafeAreaView style={s.kapsayici}>
        <View style={s.navBaslik}>
          <TouchableOpacity onPress={onGeri}>
            <Text style={s.geri}>‹ Geri</Text>
          </TouchableOpacity>
          <Text style={s.baslikYazi}>QR Tara</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={s.izinEkrani}>
          <Text style={s.izinYazi}>QR okutma için kamera izni gereklidir</Text>
          <TouchableOpacity style={s.izinButon} onPress={izinIste} activeOpacity={0.85}>
            <Text style={s.izinButonYazi}>Kamera Iznini Ver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
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

        <Text style={s.bolumBaslik}>QR OKUTMA YAPILACAk SANTİYE</Text>
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

  const sonucRenk = sonuc?.tip === 'giris' ? GREEN : sonuc?.tip === 'cikis' ? BLUE : RED

  return (
    <SafeAreaView style={s.kapsayici}>
      <View style={s.navBaslik}>
        <TouchableOpacity onPress={santiyeler.length > 1 ? () => setSeciliSantiye(null) : onGeri}>
          <Text style={s.geri}>‹ Geri</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.baslikYazi}>QR Tara</Text>
          <Text style={s.baslikAlt}>{seciliSantiye.name}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <View style={s.kameraKapsayici}>
        <CameraView
          style={s.kamera}
          onBarcodeScanned={taranıyor ? qrOkundu : undefined}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        <View style={s.cerceve} />
        <View style={s.etiketler}>
          <View style={s.etiketKutu}>
            <Text style={s.etiketYazi}>1. okutma = Giris</Text>
          </View>
          <View style={s.etiketKutu}>
            <Text style={s.etiketYazi}>2. okutma = Cikis</Text>
          </View>
        </View>
      </View>

      {sonuc ? (
        <View style={[s.sonucKutu, { backgroundColor: sonucRenk }]}>
          {sonuc.isim ? <Text style={s.sonucIsim}>{sonuc.isim}</Text> : null}
          <Text style={s.sonucMesaj}>{sonuc.mesaj}</Text>
          {sonuc.sure ? <Text style={s.sonucSure}>{sonuc.sure}</Text> : null}
        </View>
      ) : (
        <View style={s.bilgiKutu}>
          <Text style={s.bilgiYazi}>Iscinin QR kodunu kamera cercevesine getirin</Text>
        </View>
      )}

      <Modal
        visible={!!bekleyenIslem}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setBekleyenIslem(null)
          setTaranıyor(true)
        }}
      >
        <View style={s.modalArka}>
          <View style={s.modalKutu}>
            <Text style={s.modalBaslik}>Çoklu Şantiye Uyarısı</Text>
            <Text style={s.modalMetin}>
              <Text style={s.modalVurgu}>{bekleyenIslem?.worker.full_name}</Text>
              {' bugün '}
              <Text style={s.modalVurgu}>{bekleyenIslem?.digerSantiyeAdi}</Text>
              {"'nde giriş yapmış.\n\nYine de bu şantiyeye kaydet?"}
            </Text>
            <View style={s.modalButonlar}>
              <TouchableOpacity
                style={[s.modalButon, s.modalButonIptal]}
                activeOpacity={0.8}
                onPress={() => {
                  setBekleyenIslem(null)
                  setTaranıyor(true)
                }}
              >
                <Text style={s.modalButonIptalYazi}>Iptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalButon, s.modalButonOnayla]}
                activeOpacity={0.8}
                onPress={async () => {
                  if (!bekleyenIslem) return
                  setBekleyenIslem(null)
                  await girisIsleminiTamamla(bekleyenIslem.worker, bekleyenIslem.bugun, bekleyenIslem.simdi)
                }}
              >
                <Text style={s.modalButonOnaylaYazi}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: '#000' },
  navBaslik: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: BG,
  },
  geri: { color: ORANGE, fontSize: 17, width: 80 },
  baslikYazi: { color: LABEL, fontSize: 17, fontWeight: '600' },
  baslikAlt: { color: LABEL2, fontSize: 12, marginTop: 1 },
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
  satirBaslik: { flex: 1, fontSize: 17, color: LABEL },
  sag: { fontSize: 20, color: LABEL2 },
  ayrac: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: SEP,
    marginLeft: 16,
  },
  kameraKapsayici: { flex: 1, position: 'relative' },
  kamera: { flex: 1 },
  cerceve: {
    position: 'absolute', top: '20%', left: '15%',
    width: '70%', height: '45%',
    borderWidth: 2, borderColor: ORANGE, borderRadius: 20,
  },
  etiketler: {
    position: 'absolute', bottom: 20, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 10,
  },
  etiketKutu: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  etiketYazi: { color: LABEL2, fontSize: 12 },
  sonucKutu: { padding: 28, alignItems: 'center', gap: 6 },
  sonucIsim: { color: '#fff', fontSize: 22, fontWeight: '700' },
  sonucMesaj: { color: 'rgba(255,255,255,0.9)', fontSize: 15 },
  sonucSure: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 },
  bilgiKutu: {
    backgroundColor: BG, padding: 20, alignItems: 'center',
  },
  bilgiYazi: { color: LABEL2, fontSize: 15, textAlign: 'center' },
  izinEkrani: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20, padding: 24 },
  izinYazi: { color: LABEL2, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  izinButon: { backgroundColor: ORANGE, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 14 },
  izinButonYazi: { color: '#fff', fontWeight: '600', fontSize: 17 },
  bosRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: BG2,
    alignItems: 'center',
  },
  bosYazi: { fontSize: 15, color: LABEL2 },
  modalArka: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalKutu: {
    backgroundColor: BG2,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    gap: 16,
  },
  modalBaslik: {
    color: LABEL,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalMetin: {
    color: LABEL2,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  modalVurgu: {
    color: LABEL,
    fontWeight: '600',
  },
  modalButonlar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalButon: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButonIptal: {
    backgroundColor: SEP,
  },
  modalButonIptalYazi: {
    color: LABEL,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButonOnayla: {
    backgroundColor: ORANGE,
  },
  modalButonOnaylaYazi: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
