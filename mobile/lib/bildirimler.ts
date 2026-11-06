import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function bildirimIzniVeToken() {
  const { status: mevcut } = await Notifications.getPermissionsAsync()
  let durum = mevcut

  if (durum !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    durum = status
  }

  return durum === 'granted'
}

export async function gunlukBildirimleriAyarla() {
  await Notifications.cancelAllScheduledNotificationsAsync()

  // Sabah 10:00 — puantaj hatırlatması
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Puantaj Hatırlatması',
      body: 'Bugünkü puantaj henüz girilmedi. Unutma!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 10,
      minute: 0,
    },
  })

  // Akşam 18:00 — çıkış hatırlatması
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Çıkış Kontrolü',
      body: 'Çıkış yapmayan işçiler olabilir. Kontrol etmeyi unutma!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 18,
      minute: 0,
    },
  })
}

export async function sabahBildiriminiIptalEt() {
  const zamanlanmis = await Notifications.getAllScheduledNotificationsAsync()
  const sabah = zamanlanmis.find(n => n.content.title === 'Puantaj Hatırlatması')
  if (sabah) await Notifications.cancelScheduledNotificationAsync(sabah.identifier)
}

export async function anlikBildirimGonder(baslik: string, mesaj: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: baslik,
      body: mesaj,
      sound: true,
    },
    trigger: null,
  })
}
