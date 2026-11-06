import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, SafeAreaView
} from 'react-native'
import { supabase } from '../lib/supabase'
import { bildirimIzniVeToken, gunlukBildirimleriAyarla } from '../lib/bildirimler'

const BG = '#000000'
const BG2 = '#1C1C1E'
const SEP = '#38383A'
const LABEL = '#FFFFFF'
const LABEL2 = '#8E8E93'
const ORANGE = '#FF9500'

export default function GirisEkrani({ onGiris }: { onGiris: () => void }) {
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)

  async function girisYap() {
    if (!email || !sifre) {
      Alert.alert('Hata', 'E-posta ve şifre gereklidir')
      return
    }
    setYukleniyor(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: sifre })
    setYukleniyor(false)
    if (error) {
      Alert.alert('Giriş Hatası', 'E-posta veya şifre hatalı')
      return
    }
    bildirimIzniVeToken()
    gunlukBildirimleriAyarla()
    onGiris()
  }

  return (
    <SafeAreaView style={s.kapsayici}>
      <KeyboardAvoidingView
        style={s.icerik}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={s.baslik}>
          <Text style={s.logo}>CrewLog</Text>
          <Text style={s.altBaslik}>Şantiye Yönetim Sistemi</Text>
        </View>

        <View style={s.grupKapsayici}>
          <View style={s.satirRow}>
            <Text style={s.satirEtiket}>E-posta</Text>
            <TextInput
              style={s.satirInput}
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@firma.com"
              placeholderTextColor={LABEL2}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={s.ayrac} />
          <View style={s.satirRow}>
            <Text style={s.satirEtiket}>Şifre</Text>
            <TextInput
              style={s.satirInput}
              value={sifre}
              onChangeText={setSifre}
              placeholder="Şifreniz"
              placeholderTextColor={LABEL2}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity
          style={[s.buton, yukleniyor && s.butonDevre]}
          onPress={girisYap}
          disabled={yukleniyor}
          activeOpacity={0.85}
        >
          <Text style={s.butonYazi}>
            {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: BG },
  icerik: { flex: 1, justifyContent: 'center' },
  baslik: { alignItems: 'center', marginBottom: 48, gap: 6 },
  logo: { fontSize: 34, fontWeight: '700', color: LABEL },
  altBaslik: { fontSize: 15, color: LABEL2 },
  grupKapsayici: {
    backgroundColor: BG2,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  satirRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    backgroundColor: BG2,
  },
  satirEtiket: {
    fontSize: 17,
    color: LABEL,
    width: 80,
  },
  satirInput: {
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
  buton: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  butonDevre: { opacity: 0.5 },
  butonYazi: { color: '#fff', fontSize: 17, fontWeight: '600' },
})
