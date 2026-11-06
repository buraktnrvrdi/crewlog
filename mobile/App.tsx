import { useState, useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { supabase } from './lib/supabase'
import GirisEkrani from './screens/GirisEkrani'
import AnaEkran from './screens/AnaEkran'
import QrEkrani from './screens/QrEkrani'
import PuantajEkrani from './screens/PuantajEkrani'
import GecmisPuantajEkrani from './screens/GecmisPuantajEkrani'
import DavetEkrani from './screens/DavetEkrani'
import KendiGecmisim from './screens/KendiGecmisim'

export type Ekran = 'giris' | 'ana' | 'qr' | 'puantaj' | 'gecmis' | 'davet' | 'harcama' | 'gunluk' | 'isci-listesi' | 'avans'
export type Rol = 'admin' | 'foreman' | 'worker' | null

export default function App() {
  const [ekran, setEkran] = useState<Ekran>('giris')
  const [rol, setRol] = useState<Rol>(null)
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        setRol(profile?.role ?? 'admin')
        setEkran('ana')
      } else {
        setEkran('giris')
      }
      setYukleniyor(false)
    })
  }, [])

  async function handleGiris() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      setRol(profile?.role ?? 'admin')
    }
    setEkran('ana')
  }

  function handleCikis() {
    setRol(null)
    setEkran('giris')
  }

  if (yukleniyor) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
        <ActivityIndicator size="large" color="#FF9500" />
      </View>
    )
  }

  if (ekran === 'giris') return <GirisEkrani onGiris={handleGiris} />
  if (rol === 'worker') return <KendiGecmisim onCikis={handleCikis} />
  if (ekran === 'qr') return <QrEkrani onGeri={() => setEkran('ana')} />
  if (ekran === 'puantaj') return <PuantajEkrani onGeri={() => setEkran('ana')} />
  if (ekran === 'gecmis') return <GecmisPuantajEkrani onGeri={() => setEkran('ana')} />
  if (ekran === 'davet') return <DavetEkrani onGeri={() => setEkran('ana')} />

  return (
    <AnaEkran
      rol={rol}
      onQr={() => setEkran('qr')}
      onPuantaj={() => setEkran('puantaj')}
      onGecmis={() => setEkran('gecmis')}
      onDavet={() => setEkran('davet')}
      onCikis={handleCikis}
    />
  )
}
