import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'

export default function GirisEkrani() {
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
    router.replace('/ana-ekran')
  }

  return (
    <KeyboardAvoidingView
      style={styles.kapsayici}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.icerik}>
        <View style={styles.baslik}>
          <Text style={styles.logo}>CrewLog</Text>
          <Text style={styles.altBaslik}>Şantiye yönetim sistemi</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputKapsayici}>
            <Text style={styles.etiket}>E-posta</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@firma.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputKapsayici}>
            <Text style={styles.etiket}>Şifre</Text>
            <TextInput
              style={styles.input}
              value={sifre}
              onChangeText={setSifre}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.buton, yukleniyor && styles.butonDevre]}
            onPress={girisYap}
            disabled={yukleniyor}
          >
            <Text style={styles.butonYazi}>
              {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: '#F9FAFB' },
  icerik: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  baslik: { marginBottom: 40, alignItems: 'center' },
  logo: { fontSize: 28, fontWeight: '800', color: '#111827' },
  altBaslik: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  form: { gap: 16 },
  inputKapsayici: { gap: 6 },
  etiket: { fontSize: 14, fontWeight: '500', color: '#374151' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  buton: {
    backgroundColor: '#F97316',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  butonDevre: { backgroundColor: '#FED7AA' },
  butonYazi: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
