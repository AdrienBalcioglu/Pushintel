import { useEffect, useState } from 'react'
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, ActivityIndicator, Platform, Alert,
} from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { StatusBar } from 'expo-status-bar'

// ⚠️  IP locale de ton Mac (npm run start affiche aussi un QR)
const PUSHINTEL_URL = 'http://192.168.1.42:3000'
const API_KEY = 'pi_e296ab664277d7b43ce52e4d0e12c84989b2637e1ba4c1cdd6eb2b760ac3b657'
const USER_ID = 'mobile-test-user'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

type LogEntry = { msg: string; type: 'ok' | 'err' | 'info' }

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([{ msg: 'Prêt.', type: 'info' }])
  const [token, setToken] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)
  const [loading, setLoading] = useState(false)

  const log = (msg: string, type: LogEntry['type'] = 'info') => {
    setLogs((prev) => [...prev, { msg: `[${new Date().toLocaleTimeString()}] ${msg}`, type }])
  }

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notif) => {
      log(`🔔 Reçue : ${notif.request.content.title} — ${notif.request.content.body}`, 'ok')
    })
    return () => sub.remove()
  }, [])

  const register = async () => {
    setLoading(true)
    try {
      if (!Device.isDevice) {
        Alert.alert('Simulateur détecté', 'Les push notifications nécessitent un vrai appareil.')
        return
      }

      const { status: existing } = await Notifications.getPermissionsAsync()
      let finalStatus = existing
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }
      if (finalStatus !== 'granted') { log('Permission refusée', 'err'); return }
      log('Permission accordée', 'ok')

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'bafd5638-7680-4b4c-982e-6828da2a154f',
      })
      const expoPushToken = tokenData.data
      setToken(expoPushToken)
      log(`Token Expo obtenu`, 'ok')

      log('Enregistrement sur Pushintel...')
      const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID'
      const res = await fetch(`${PUSHINTEL_URL}/api/sdk/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({
          userId: USER_ID,
          token: expoPushToken,
          platform,
          tags: ['mobile', 'test', Platform.OS],
        }),
      })
      const data = await res.json()
      if (!res.ok) { log(`Erreur: ${JSON.stringify(data)}`, 'err'); return }
      log(`Enregistré ✓ device id: ${data.id}`, 'ok')
      setRegistered(true)
    } catch (e: unknown) {
      log(`Erreur: ${e instanceof Error ? e.message : String(e)}`, 'err')
    } finally {
      setLoading(false)
    }
  }

  const sendPush = async () => {
    setLoading(true)
    try {
      log('Envoi push → segment "all"...')
      const res = await fetch(`${PUSHINTEL_URL}/api/sdk/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({
          title: 'Bonjour depuis Pushintel 👋',
          body: 'Ça marche sur mobile !',
          segment: 'all',
        }),
      })
      const data = await res.json()
      if (!res.ok) { log(`Erreur: ${JSON.stringify(data)}`, 'err'); return }
      log(`Push envoyé ✓ campaign: ${data.campaignId} (${data.queued} token)`, 'ok')
    } catch (e: unknown) {
      log(`Erreur: ${e instanceof Error ? e.message : String(e)}`, 'err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <Text style={s.title}>🔔 Pushintel</Text>
      <Text style={s.subtitle}>Test client mobile</Text>

      {token && (
        <View style={s.tokenBox}>
          <Text style={s.tokenLabel}>Expo Push Token</Text>
          <Text style={s.tokenText} numberOfLines={3}>{token}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[s.btn, s.btnPrimary, (loading || registered) && s.btnDisabled]}
        onPress={register}
        disabled={loading || registered}
      >
        {loading && !registered ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.btnText}>
            {registered ? '✓ Enregistré' : 'Demander permission & enregistrer'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.btn, s.btnSend, (!registered || loading) && s.btnDisabled]}
        onPress={sendPush}
        disabled={!registered || loading}
      >
        {loading && registered ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.btnText}>Envoyer une notification</Text>
        )}
      </TouchableOpacity>

      <View style={s.logContainer}>
        <Text style={s.logTitle}>Console</Text>
        <ScrollView style={s.logScroll}>
          {logs.map((l, i) => (
            <Text
              key={i}
              style={[s.logLine, l.type === 'ok' && s.ok, l.type === 'err' && s.err]}
            >
              {l.msg}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#555', textAlign: 'center', marginBottom: 24 },
  tokenBox: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, marginBottom: 16 },
  tokenLabel: { fontSize: 10, color: '#555', textTransform: 'uppercase', marginBottom: 4 },
  tokenText: { fontSize: 11, color: '#a78bfa', fontFamily: 'monospace' },
  btn: { borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 12 },
  btnPrimary: { backgroundColor: '#6366f1' },
  btnSend: { backgroundColor: '#22c55e' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  logContainer: { flex: 1, backgroundColor: '#111', borderRadius: 10, padding: 12, marginTop: 8 },
  logTitle: { fontSize: 10, color: '#555', textTransform: 'uppercase', marginBottom: 8 },
  logScroll: { flex: 1 },
  logLine: { fontSize: 11, color: '#60a5fa', fontFamily: 'monospace', lineHeight: 18 },
  ok: { color: '#22c55e' },
  err: { color: '#f87171' },
})
