import { useEffect, useState } from 'react'
import { Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native'
import { colors, font } from '../theme'
import { api, type Settings } from '../api/client'

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [shopPhone, setShopPhone] = useState('')
  const [placeId, setPlaceId] = useState('')
  const [reminderDays, setReminderDays] = useState('3')
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s)
      setShopPhone(s.shop_phone)
      setPlaceId(s.google_place_id)
      setReminderDays(String(s.reminder_days_before ?? 3))
    }).catch(() => undefined)
  }, [])

  const saveGeneral = async () => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const updated = await api.updateSettings({
        shop_phone: shopPhone,
        google_place_id: placeId,
        reminder_days_before: Math.max(1, Math.min(30, parseInt(reminderDays, 10) || 3)),
      })
      setSettings(updated)
      setMessage('Settings saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  const changePin = async () => {
    setBusy(true)
    setError('')
    setMessage('')
    if (newPin !== confirmPin) {
      setError('New PINs do not match')
      setBusy(false)
      return
    }
    try {
      await api.updateSettings({ old_pin: oldPin, new_pin: newPin })
      setOldPin('')
      setNewPin('')
      setConfirmPin('')
      setMessage('PIN changed successfully.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change PIN')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Settings</Text>
      {settings && <Text style={styles.appName}>App: {settings.app_name}</Text>}

      <Text style={styles.sectionLabel}>Shop & Billing</Text>
      <Text style={styles.hint}>
        The Google Review link on printed bills uses this Place ID. Add it here (or use “YOUR_PLACE_ID” as a harmless
        placeholder).
      </Text>
      <TextInput style={styles.input} value={shopPhone} onChangeText={setShopPhone} placeholder="WhatsApp / shop phone" placeholderTextColor={colors.muted} keyboardType="phone-pad" />
      <TextInput style={styles.input} value={placeId} onChangeText={setPlaceId} placeholder="Google Place ID" placeholderTextColor={colors.muted} autoCapitalize="none" />

      <Text style={styles.sectionLabel}>Service Reminder</Text>
      <Text style={styles.hint}>
        Send WhatsApp reminders to customers before their service date. Set how many days before to show the reminder.
      </Text>
      <TextInput style={styles.input} value={reminderDays} onChangeText={setReminderDays} placeholder="Days before service (1–30)" placeholderTextColor={colors.muted} keyboardType="number-pad" />

      <Pressable style={styles.btn} onPress={saveGeneral} disabled={busy}>
        <Text style={styles.btnText}>Save Shop Settings</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>Change PIN</Text>
      <TextInput style={styles.input} value={oldPin} onChangeText={setOldPin} placeholder="Current PIN" placeholderTextColor={colors.muted} secureTextEntry keyboardType="number-pad" />
      <TextInput style={styles.input} value={newPin} onChangeText={setNewPin} placeholder="New PIN" placeholderTextColor={colors.muted} secureTextEntry keyboardType="number-pad" />
      <TextInput style={styles.input} value={confirmPin} onChangeText={setConfirmPin} placeholder="Confirm new PIN" placeholderTextColor={colors.muted} secureTextEntry keyboardType="number-pad" />
      <Pressable style={styles.btn} onPress={changePin} disabled={busy}>
        <Text style={styles.btnText}>Change PIN</Text>
      </Pressable>

      {error !== '' && <Text style={styles.error}>{error}</Text>}
      {message !== '' && <Text style={styles.success}>{message}</Text>}

      <Text style={styles.foot}>Pratham Car Care · Karvenagar, Pune</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },
  heading: { color: colors.navy, fontSize: font.xl, fontWeight: '800', marginBottom: 2 },
  appName: { color: colors.muted, fontSize: font.md, marginBottom: 8 },
  sectionLabel: {
    color: colors.navy,
    fontWeight: '800',
    fontSize: font.md,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
  },
  hint: { color: colors.muted, fontSize: font.sm, marginBottom: 10, lineHeight: 18 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: 8,
    padding: 11,
    fontSize: font.md,
    color: colors.ink,
    marginBottom: 10,
    backgroundColor: colors.card,
  },
  btn: { backgroundColor: colors.navy, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#ffffff', fontWeight: '800', fontSize: font.md },
  error: { color: colors.danger, fontWeight: '600', fontSize: font.sm, marginTop: 12, textAlign: 'center' },
  success: { color: colors.success, fontWeight: '700', fontSize: font.sm, marginTop: 12, textAlign: 'center' },
  foot: { color: colors.muted, fontSize: font.xs, textAlign: 'center', marginTop: 30 },
})