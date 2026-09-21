import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { colors, font } from '../theme'
import type { InvoiceDetail, Settings } from '../api/client'
import { api } from '../api/client'
import InvoiceSheet from '../components/InvoiceSheet'
import { useNav } from '../nav'
import { sendBillPdfToCustomer, downloadBillPdf } from '../utils/sendPdf'

const RESULT_MSG: Record<string, string> = {
  direct: 'WhatsApp opened to the customer — attach the downloaded PDF in that chat.',
  downloaded: 'PDF downloaded. Send it to the customer in WhatsApp.',
  'no-phone': 'Customer mobile number is missing.',
}

export default function PreviewScreen({ invoice }: { invoice: InvoiceDetail }) {
  const { reset } = useNav()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => undefined)
  }, [])

  const reviewUrl = settings?.google_place_id
    ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(settings.google_place_id)}`
    : undefined

  const sendPdf = async () => {
    if (busy) return
    setBusy(true)
    setMsg(null)
    try {
      const result = await sendBillPdfToCustomer(invoice, settings ?? undefined)
      setMsg(RESULT_MSG[result] ?? '')
    } catch {
      setMsg('Could not generate the PDF. Try Print instead.')
    } finally {
      setBusy(false)
    }
  }

  const downloadPdf = async () => {
    if (busy) return
    setBusy(true)
    setMsg(null)
    try {
      await downloadBillPdf(invoice)
      setMsg('Bill PDF downloaded.')
    } catch {
      setMsg('Could not generate the PDF. Try Print instead.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <InvoiceSheet invoice={invoice} googleReviewUrl={reviewUrl} />
      </ScrollView>

      <View style={styles.toolbar}>
        {msg ? <Text style={styles.msg}>{msg}</Text> : null}
        <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => reset({ name: 'history' })}>
          <Text style={styles.btnGhostText}>‹ Back</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => reset({ name: 'billing' })}>
          <Text style={styles.btnGhostText}>New Billing</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnGreen]} onPress={() => void sendPdf()}>
          <Text style={styles.btnText}>{busy ? 'Generating…' : 'Send PDF'}</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => void downloadPdf()}>
          <Text style={styles.btnGhostText}>PDF ⤓</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnNavy]} onPress={() => window.print()}>
          <Text style={styles.btnText}>🖨 Print</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  btn: { flexGrow: 1, flexBasis: 110, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  btnNavy: { backgroundColor: colors.navy },
  btnGreen: { backgroundColor: '#25d366' },
  btnGhost: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.navy },
  btnText: { color: '#ffffff', fontWeight: '800', fontSize: font.lg },
  btnGhostText: { color: colors.navy, fontWeight: '800', fontSize: font.lg },
  msg: { color: colors.success, fontSize: font.sm, fontWeight: '600', width: '100%', marginBottom: 4 },
})