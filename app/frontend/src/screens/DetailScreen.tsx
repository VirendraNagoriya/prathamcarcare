import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { colors, font } from '../theme'
import { api, type InvoiceDetail, type Settings } from '../api/client'
import InvoiceSheet from '../components/InvoiceSheet'
import { useNav } from '../nav'
import { sendBillPdfToCustomer, downloadBillPdf } from '../utils/sendPdf'

const RESULT_MSG: Record<string, string> = {
  direct: 'WhatsApp opened to the customer — attach the downloaded PDF in that chat.',
  downloaded: 'PDF downloaded. Send it to the customer in WhatsApp.',
  'no-phone': 'Customer mobile number is missing.',
}

export default function DetailScreen({ id }: { id: number }) {
  const { push, pop } = useNav()
  const { width } = useWindowDimensions()
  const narrow = width < 560
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.getInvoice(id).then(setInvoice).catch((e) => setError(e instanceof Error ? e.message : 'Loading failed'))
    api.getSettings().then(setSettings).catch(() => undefined)
  }, [id])

  if (error !== '') {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.goBtn} onPress={() => pop()}>
          <Text style={styles.goBtnText}>‹ Back to History</Text>
        </Pressable>
      </View>
    )
  }

  if (!invoice) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Loading…</Text>
      </View>
    )
  }

  const reviewUrl = settings?.google_place_id
    ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(settings.google_place_id)}`
    : undefined

  const sendPdf = async () => {
    if (busy) return
    setBusy(true)
    setMsg('')
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
    setMsg('')
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
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <InvoiceSheet invoice={invoice} googleReviewUrl={reviewUrl} />
      </ScrollView>
      <View style={styles.toolbarWrap}>
        {msg !== '' && <Text style={styles.msg}>{msg}</Text>}
        <View style={[styles.toolbar, narrow && styles.toolbarNarrow]}>
          <Pressable style={[styles.btn, styles.btnEdit]} onPress={() => push({ name: 'billing', editId: id })}>
            <Text style={styles.btnText}>✎ Edit Bill</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnGreen]} onPress={() => void sendPdf()}>
            <Text style={[styles.btnText, narrow && styles.btnTextSmall]}>{busy ? 'Generating…' : 'Send PDF to Customer'}</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => void downloadPdf()}>
            <Text style={[styles.btnGhostText, narrow && styles.btnTextSmall]}>PDF ⤓</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnNavy]} onPress={() => window.print()}>
            <Text style={styles.btnText}>🖨 Print</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  error: { color: colors.muted, fontSize: font.md, marginBottom: 12 },
  content: { padding: 14, paddingBottom: 40 },
  toolbarWrap: {
    padding: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  toolbar: { flexDirection: 'row', gap: 8 },
  toolbarNarrow: { flexDirection: 'column' },
  btn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  btnNavy: { backgroundColor: colors.navy },
  btnGreen: { backgroundColor: '#25d366' },
  btnEdit: { backgroundColor: colors.blue },
  btnGhost: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.navy },
  btnText: { color: '#ffffff', fontWeight: '800', fontSize: font.lg },
  btnTextSmall: { fontSize: font.md },
  btnGhostText: { color: colors.navy, fontWeight: '800', fontSize: font.lg },
  msg: { color: colors.success, fontSize: font.sm, fontWeight: '600', marginBottom: 8 },
  goBtn: { borderWidth: 1.5, borderColor: colors.navy, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  goBtnText: { color: colors.navy, fontWeight: '700' },
})