import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { colors, font } from '../theme'
import { api } from '../api/client'

export default function PinScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (busy) return
    setError('')
    setBusy(true)
    try {
      await api.login(pin.trim())
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed')
      setPin('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.title}>PRATHAM CAR CARE</Text>
        <Text style={styles.subtitle}>Garage Billing — Enter PIN to continue</Text>

        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          placeholder="PIN"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          secureTextEntry
          autoFocus
          maxLength={12}
        />

        {error !== '' && <Text style={styles.error}>{error}</Text>}

        <Pressable style={[styles.btn, busy && styles.btnBusy]} onPress={submit} disabled={!pin.trim()}>
          <Text style={styles.btnText}>{busy ? 'Checking…' : 'Unlock'}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 20 },
  card: { width: '100%', maxWidth: 360, backgroundColor: colors.card, borderRadius: 12, padding: 24, borderWidth: 1, borderColor: colors.line },
  title: { color: colors.navy, fontSize: font.title, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: font.md, fontWeight: '600', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: 8,
    padding: 12,
    fontSize: font.xl,
    textAlign: 'center',
    letterSpacing: 8,
    color: colors.ink,
  },
  error: { color: colors.danger, fontSize: font.sm, marginTop: 10, textAlign: 'center', fontWeight: '600' },
  btn: {
    marginTop: 16,
    backgroundColor: colors.navy,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnBusy: { opacity: 0.7 },
  btnText: { color: '#ffffff', fontWeight: '800', fontSize: font.lg },
})