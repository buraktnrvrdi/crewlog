import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'

export default function AnaEkran() {
  async function cikisYap() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  return (
    <SafeAreaView style={styles.kapsayici}>
      <View style={styles.baslik}>
        <Text style={styles.logo}>CrewLog</Text>
        <TouchableOpacity onPress={cikisYap}>
          <Text style={styles.cikis}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.icerik}>
        <TouchableOpacity
          style={styles.kart}
          onPress={() => router.push('/qr-okut')}
        >
          <Text style={styles.kartIkon}>📷</Text>
          <Text style={styles.kartBaslik}>QR ile Giriş/Çıkış</Text>
          <Text style={styles.kartAciklama}>İşçi QR kodunu okut</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.kart}
          onPress={() => router.push('/puantaj')}
        >
          <Text style={styles.kartIkon}>📋</Text>
          <Text style={styles.kartBaslik}>Günlük Puantaj</Text>
          <Text style={styles.kartAciklama}>Devam/devamsızlık listesi</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: '#F9FAFB' },
  baslik: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logo: { fontSize: 20, fontWeight: '800', color: '#111827' },
  cikis: { fontSize: 14, color: '#F97316', fontWeight: '500' },
  icerik: { flex: 1, padding: 20, gap: 16 },
  kart: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 8,
  },
  kartIkon: { fontSize: 40 },
  kartBaslik: { fontSize: 18, fontWeight: '700', color: '#111827' },
  kartAciklama: { fontSize: 14, color: '#6B7280' },
})
