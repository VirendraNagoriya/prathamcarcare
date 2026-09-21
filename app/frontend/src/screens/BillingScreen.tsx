import { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { colors, font } from '../theme'
import { api, type Vehicle, type InvoiceDetail, type CatalogItem } from '../api/client'
import { formatINR, addMonthsISO } from '../utils/format'
import { amountInWords } from '../utils/amountInWords'
import CalendarModal from '../components/CalendarModal'

interface Row {
  key: string
  name: string
  qty: string
  rate: string
  showSuggestions: boolean
}

function newRow(name = ''): Row {
  return { key: Math.random().toString(36).slice(2), name, qty: '1', rate: '', showSuggestions: false }
}

const rowAmount = (r: Row): number => {
  const q = Number(r.qty)
  const ra = Number(r.rate)
  if (!Number.isFinite(q) || !Number.isFinite(ra) || q <= 0 || ra <= 0) return 0
  return q * ra
}

export default function BillingScreen({
  existing,
  editId,
  onPreview,
  onCancel,
}: {
  existing?: Vehicle
  editId?: number
  onPreview: (invoice: InvoiceDetail) => void
  onCancel?: () => void
}) {
  const [plate, setPlate] = useState(existing?.plate_number ?? '')
  const [owner, setOwner] = useState(existing?.owner_name ?? '')
  const [phone, setPhone] = useState(existing?.owner_phone ?? '')
  const [km, setKm] = useState('')
  const [nextKm, setNextKm] = useState('')
  const [nextDate, setNextDate] = useState('')
  const [showCal, setShowCal] = useState(false)
  const [rows, setRows] = useState<Row[]>([newRow()])
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [editLoading, setEditLoading] = useState(editId != null)

  useEffect(() => {
    api.catalog().then((r) => setCatalog(r.items)).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (editId == null) return
    let cancelled = false
    setEditLoading(true)
    api
      .getInvoice(editId)
      .then((inv) => {
        if (cancelled) return
        setPlate(inv.plate_number)
        setOwner(inv.owner_name)
        setPhone(inv.owner_phone)
        setKm(inv.km_reading ?? '')
        setNextKm(inv.next_service_km ?? '')
        setNextDate(inv.next_service_date ?? '')
        setRows(
          inv.items.length > 0
            ? inv.items.map((it) => ({
                key: Math.random().toString(36).slice(2),
                name: it.product_name,
                qty: String(it.quantity),
                rate: String(it.unit_rate),
                showSuggestions: false,
              }))
            : [newRow()],
        )
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load invoice for editing'))
      .finally(() => {
        if (!cancelled) setEditLoading(false)
      })
    return () => { cancelled = true }
  }, [editId])

  const total = useMemo(() => rows.reduce((sum, r) => sum + rowAmount(r), 0), [rows])

  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const addRow = (name = '') => setRows((rs) => [...rs, newRow(name)])

  const removeRow = (key: string) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs.map((r) => ({ ...r, name: '', rate: '' }))))

  const suggestionsFor = (row: Row): CatalogItem[] => {
    const t = row.name.trim().toLowerCase()
    if (!t) return catalog.slice(0, 12)
    return catalog.filter((c) => c.name.toLowerCase().includes(t)).slice(0, 12)
  }

  const canAddNew = (row: Row): boolean => {
    const t = row.name.trim()
    if (!t) return false
    const lower = t.toLowerCase()
    return !catalog.some((c) => c.name.trim().toLowerCase() === lower)
  }

  const addNewToCatalog = async (row: Row) => {
    const t = row.name.trim()
    if (!t || adding) return
    setAdding(true)
    setError('')
    try {
      const price = Number(row.rate) || 0
      const created = await api.addCatalogItem({ name: t, price })
      setCatalog((cs) => [...cs, { id: created.id, name: t, price, sort_order: 1000 }])
      updateRow(row.key, { showSuggestions: false })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the product')
    } finally {
      setAdding(false)
    }
  }

  const submit = async () => {
    setError('')
    if (!plate.trim()) return setError('Car No. is required')
    if (!owner.trim()) return setError('Customer name is required')
    if (!phone.trim()) return setError('Mobile number is required')

    const items = rows
      .filter((r) => r.name.trim() !== '' && Number(r.qty) > 0)
      .map((r) => ({
        product_name: r.name.trim(),
        quantity: Math.max(1, Math.round(Number(r.qty))),
        unit_rate: Number(r.rate) || 0,
      }))

    if (items.length === 0) return setError('Add at least one item with a rate')

    setBusy(true)
    try {
      const payload: Parameters<typeof api.createInvoice>[0] = {
        plate_number: plate.trim().toUpperCase(),
        owner_name: owner.trim(),
        owner_phone: phone.trim(),
        km_reading: km.trim(),
        next_service_km: nextKm.trim(),
        next_service_date: nextDate.trim(),
        items,
      }
      const saved = editId != null
        ? await api.updateInvoice(editId, payload)
        : await api.createInvoice(payload)
      const detail = await api.getInvoice(saved.id)
      onPreview(detail)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save invoice')
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {onCancel && (
          <Pressable onPress={onCancel}>
            <Text style={styles.cancel}>‹ Cancel</Text>
          </Pressable>
        )}

        {editId != null && (
          <Text style={styles.editBanner}>✎ Editing Bill #{editId} — changes apply to this bill only.</Text>
        )}

        {editLoading ? (
          <Text style={styles.error}>Loading bill for editing…</Text>
        ) : (
          <>
        <Text style={styles.sectionLabel}>Customer & Vehicle</Text>
        <View style={styles.metaGrid}>
          <TextInput style={styles.metaInput} value={plate} onChangeText={setPlate} placeholder="Car No. (e.g. MH-12-XX-1234)" placeholderTextColor={colors.muted} autoCapitalize="characters" />
          <TextInput style={styles.metaInput} value={owner} onChangeText={setOwner} placeholder="Customer name (M/s.)" placeholderTextColor={colors.muted} />
          <TextInput style={styles.metaInput} value={phone} onChangeText={setPhone} placeholder="Mobile no." placeholderTextColor={colors.muted} keyboardType="phone-pad" />
          <TextInput style={styles.metaInput} value={km} onChangeText={setKm} placeholder="Km." placeholderTextColor={colors.muted} keyboardType="number-pad" />
          <TextInput style={styles.metaInput} value={nextKm} onChangeText={setNextKm} placeholder="Next servicing km." placeholderTextColor={colors.muted} keyboardType="number-pad" />
          <Pressable style={styles.dateField} onPress={() => setShowCal(true)}>
            <Text style={[styles.dateFieldText, !nextDate && styles.dateFieldPlaceholder]}>
              {nextDate ? `📅 ${nextDate}` : '📅 Select next service date…'}
            </Text>
            {nextDate !== '' && (
              <Pressable
                hitSlop={8}
                onPress={(e) => { e.stopPropagation(); setNextDate('') }}
                style={styles.dateClear}
              >
                <Text style={styles.dateClearText}>✕</Text>
              </Pressable>
            )}
          </Pressable>
          <View style={styles.quickRow}>
            <Pressable
              style={[styles.quickBtn, nextDate === addMonthsISO(3) && styles.quickBtnOn]}
              onPress={() => setNextDate(addMonthsISO(3))}
            >
              <Text style={[styles.quickBtnText, nextDate === addMonthsISO(3) && styles.quickBtnTextOn]}>
                next 3 months
              </Text>
            </Pressable>
            <Pressable
              style={[styles.quickBtn, nextDate === addMonthsISO(6) && styles.quickBtnOn]}
              onPress={() => setNextDate(addMonthsISO(6))}
            >
              <Text style={[styles.quickBtnText, nextDate === addMonthsISO(6) && styles.quickBtnTextOn]}>
                next 6 months
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Work / Parts (numbers are flexible — set any rate)</Text>

        {rows.map((row, idx) => {
          const amount = rowAmount(row)
          const suggestions = row.showSuggestions ? suggestionsFor(row) : []
          const showList = row.showSuggestions && (suggestions.length > 0 || canAddNew(row))
          return (
            <View key={row.key} style={styles.rowCard}>
              <View style={styles.rowTop}>
                <Text style={styles.sr}>{idx + 1}</Text>
                <TextInput
                  style={styles.particulars}
                  value={row.name}
                  onChangeText={(t) => updateRow(row.key, { name: t, showSuggestions: true })}
                  onFocus={() => updateRow(row.key, { showSuggestions: true })}
                  onBlur={() => setTimeout(() => updateRow(row.key, { showSuggestions: false }), 180)}
                  placeholder="Particulars"
                  placeholderTextColor={colors.muted}
                />
                <Pressable onPress={() => removeRow(row.key)} style={styles.del}>
                  <Text style={styles.delText}>✕</Text>
                </Pressable>
              </View>

              {showList && (
                <ScrollView style={styles.suggestions} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                  <Text style={styles.suggestionsHint}>
                    {suggestions.length ? 'Tap an item to select — rate is editable' : 'Not in list — save it to add:'}
                  </Text>
                  {suggestions.map((c) => (
                    <Pressable
                      key={c.id}
                      style={styles.suggestion}
                      onPress={() => updateRow(row.key, { name: c.name, rate: c.price > 0 ? String(c.price) : '', showSuggestions: false })}
                    >
                      <Text style={styles.suggestionText}>{c.name}</Text>
                      <Text style={styles.suggestionPrice}>{c.price > 0 ? `₹${formatINR(c.price)}` : 'no rate'}</Text>
                    </Pressable>
                  ))}

                  {canAddNew(row) && (
                    <Pressable
                      style={[styles.suggestion, styles.suggestionAdd]}
                      onPress={() => void addNewToCatalog(row)}
                      disabled={adding}
                    >
                      <Text style={styles.suggestionAddText}>
                        {adding ? 'Saving…' : `＋ Save "${row.name.trim()}" to product list`}
                      </Text>
                    </Pressable>
                  )}
                </ScrollView>
              )}

              <View style={styles.rowBottom}>
                <View style={styles.qtyBox}>
                  <Text style={styles.fieldLabel}>Qty</Text>
                  <TextInput
                    style={styles.numInput}
                    value={row.qty}
                    onChangeText={(t) => updateRow(row.key, { qty: t })}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.qtyBox}>
                  <Text style={styles.fieldLabel}>Rate (₹)</Text>
                  <TextInput
                    style={styles.numInput}
                    value={row.rate}
                    onChangeText={(t) => updateRow(row.key, { rate: t })}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View style={styles.amtBox}>
                  <Text style={styles.fieldLabel}>Amount</Text>
                  <Text style={styles.amount}>{formatINR(amount)}</Text>
                </View>
              </View>
            </View>
          )
        })}

        <Pressable style={styles.addBtn} onPress={() => addRow()}>
          <Text style={styles.addBtnText}>＋ Add item / service</Text>
        </Pressable>

        {error !== '' && <Text style={styles.error}>{error}</Text>}

        <View style={styles.totalStrip}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalVal}>₹{formatINR(total)}</Text>
        </View>
        <Text style={styles.words}>
          {total > 0 ? `Rs. in words: ${amountInWords(total)}` : ' '}
        </Text>

        <Pressable style={[styles.saveBtn, busy && styles.saveBtnBusy]} onPress={submit} disabled={busy}>
          <Text style={styles.saveBtnText}>{busy ? 'Saving…' : editId != null ? 'Save Changes & Preview' : 'Save & Preview Bill'}</Text>
        </Pressable>
          </>
        )}
      </ScrollView>
      <CalendarModal
        visible={showCal}
        initial={nextDate}
        onSelect={setNextDate}
        onClose={() => setShowCal(false)}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },
  cancel: { color: colors.navy, fontWeight: '700', fontSize: font.lg, marginBottom: 8 },
  editBanner: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde047',
    borderRadius: 8,
    color: colors.navy,
    fontWeight: '700',
    fontSize: font.sm,
    padding: 10,
    marginBottom: 8,
  },
  sectionLabel: {
    color: colors.navy,
    fontWeight: '800',
    fontSize: font.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
  },
  metaGrid: { gap: 8, marginBottom: 4 },
  metaInput: {
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: 8,
    padding: 10,
    fontSize: font.md,
    color: colors.ink,
    backgroundColor: colors.card,
  },
  dateField: {
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: 8,
    padding: 10,
    fontSize: font.md,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateFieldText: { color: colors.ink, fontWeight: '600', fontSize: font.md },
  dateFieldPlaceholder: { color: colors.muted, fontWeight: '400' },
  dateClear: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  dateClearText: { color: colors.danger, fontWeight: '800', fontSize: font.xs },
  quickRow: { flexDirection: 'row', gap: 8 },
  quickBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  quickBtnOn: { backgroundColor: colors.blue },
  quickBtnText: { color: colors.blue, fontWeight: '800', fontSize: font.sm },
  quickBtnTextOn: { color: '#ffffff' },
  rowCard: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    marginBottom: 10,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sr: { color: colors.navy, fontWeight: '800', fontSize: font.md, width: 26 },
  particulars: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.rowLine,
    borderRadius: 8,
    padding: 9,
    fontSize: font.md,
    color: colors.ink,
    fontWeight: '600',
  },
  del: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  delText: { color: colors.danger, fontWeight: '800', fontSize: font.lg },
  suggestions: {
    maxHeight: 240,
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  suggestionsHint: { color: colors.muted, fontSize: font.xs, fontWeight: '600', fontStyle: 'italic', paddingHorizontal: 12, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.rowLine },
  suggestion: { paddingVertical: 9, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.rowLine, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  suggestionAdd: { backgroundColor: '#f0fdf4', justifyContent: 'center' },
  suggestionAddText: { color: '#15803d', fontWeight: '800', fontSize: font.md },
  suggestionText: { color: colors.ink, fontSize: font.md, fontWeight: '500', flexShrink: 1 },
  suggestionPrice: { color: colors.navy, fontWeight: '800', fontSize: font.md, marginLeft: 8 },
  rowBottom: { flexDirection: 'row', gap: 8, marginTop: 8 },
  qtyBox: { flex: 1 },
  fieldLabel: { color: colors.muted, fontSize: font.xs, fontWeight: '700', marginBottom: 3, textTransform: 'uppercase' },
  numInput: {
    borderWidth: 1,
    borderColor: colors.rowLine,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: font.md,
    color: colors.ink,
    backgroundColor: colors.metaBg,
  },
  amtBox: { flex: 1.3 },
  amount: {
    borderWidth: 1,
    borderColor: colors.rowLine,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: font.md,
    color: colors.navy,
    fontWeight: '800',
    backgroundColor: colors.totalBg,
  },
  addBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.blue,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  addBtnText: { color: colors.navy, fontWeight: '800', fontSize: font.md },
  error: { color: colors.danger, fontWeight: '600', fontSize: font.sm, marginBottom: 8, textAlign: 'center' },
  totalStrip: {
    backgroundColor: colors.totalBg,
    borderTopWidth: 2,
    borderTopColor: colors.navy,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { color: colors.navy, fontWeight: '800', fontSize: font.lg, textTransform: 'uppercase' },
  totalVal: { color: colors.navy, fontWeight: '800', fontSize: font.lg },
  words: { color: colors.slate, fontSize: font.sm, marginTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line, borderStyle: 'dashed' },
  saveBtn: { backgroundColor: colors.navy, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  saveBtnBusy: { opacity: 0.7 },
  saveBtnText: { color: '#ffffff', fontWeight: '800', fontSize: font.lg },
})