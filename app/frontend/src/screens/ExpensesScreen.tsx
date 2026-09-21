import { useCallback, useEffect, useState } from 'react'
import { View, Text, Pressable, FlatList, TextInput, StyleSheet } from 'react-native'
import { colors, font } from '../theme'
import { api, type Expense } from '../api/client'
import { formatINR, formatDate, toISODateString, shiftDate } from '../utils/format'

const SHORTCUTS = ['Parts Purchased', 'Wages', 'Rent', 'Other']

export default function ExpensesScreen() {
  const [date, setDate] = useState(toISODateString(new Date()))
  const [items, setItems] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)

  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Parts Purchased')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isToday = date === toISODateString(new Date())

  const load = useCallback(async (d: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await api.expenses({ date: d })
      setItems(res.items)
      setTotal(res.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load expenses')
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(date) }, [date, load])

  const save = async () => {
    const amt = parseFloat(amount)
    if (!description.trim()) { setMsg('Enter a description'); return }
    if (!amt || amt <= 0) { setMsg('Enter a valid amount'); return }
    setSaving(true)
    setMsg('')
    try {
      await api.addExpense({ description: description.trim(), category, amount: amt, expense_date: date })
      setDescription('')
      setAmount('')
      setMsg('Expense added ✓')
      await load(date)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed to add expense')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    try {
      await api.deleteExpense(id)
      await load(date)
    } catch {
      setMsg('Failed to delete')
    }
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(it) => String(it.id)}
      refreshing={loading}
      onRefresh={() => void load(date)}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <View style={styles.dateBar}>
            <Pressable style={styles.dateBtn} onPress={() => setDate(shiftDate(date, -1))}>
              <Text style={styles.dateBtnText}>‹</Text>
            </Pressable>
            <Text style={styles.dateLabel}>
              {formatDate(date)}{isToday ? '  ·  Today' : ''}
            </Text>
            <Pressable style={styles.dateBtn} onPress={() => setDate(isToday ? date : shiftDate(date, 1))}>
              <Text style={styles.dateBtnText}>›</Text>
            </Pressable>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add Expense — {formatDate(date)}</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Description (e.g. Engine oil purchased, Electric bill…)"
              placeholderTextColor={colors.muted}
            />
            <View style={styles.catRow}>
              {SHORTCUTS.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.catChip, category === c && styles.catChipOn]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.catChipText, category === c && styles.catChipTextOn]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.amtRow}>
              <TextInput
                style={[styles.input, styles.amtInput]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
              />
              <Pressable style={[styles.saveBtn, saving && styles.saveBtnOff]} onPress={() => void save()}>
                <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
              </Pressable>
            </View>
            {msg !== '' && <Text style={styles.msg}>{msg}</Text>}
          </View>

          <View style={styles.totalBar}>
            <Text style={styles.totalLabel}>Total for the day</Text>
            <Text style={styles.totalValue}>₹{formatINR(total)}</Text>
          </View>

          <Text style={styles.subHeading}>{items.length ? 'Expense list' : 'No expenses yet'}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.desc} numberOfLines={1}>{item.description}</Text>
            <Text style={styles.meta}>{item.category}</Text>
          </View>
          <Text style={styles.amt}>₹{formatINR(item.amount)}</Text>
          <Pressable style={styles.delBtn} onPress={() => void remove(item.id)}>
            <Text style={styles.delText}>✕</Text>
          </Pressable>
        </View>
      )}
      ListEmptyComponent={
        loading ? <Text style={styles.empty}>Loading…</Text>
        : error !== '' ? <Text style={styles.empty}>{error}</Text>
        : <Text style={styles.empty}>No expenses recorded for this day.</Text>
      }
    />
  )
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },
  dateBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  dateBtn: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 10,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBtnText: { color: colors.navy, fontWeight: '800', fontSize: font.xl },
  dateLabel: { color: colors.navy, fontWeight: '800', fontSize: font.lg },
  formCard: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  formTitle: { color: colors.navy, fontWeight: '800', fontSize: font.md, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 11,
    fontSize: font.md,
    color: colors.ink,
    marginBottom: 10,
    backgroundColor: colors.bg,
  },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  catChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.card,
  },
  catChipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  catChipText: { color: colors.muted, fontWeight: '700', fontSize: font.sm },
  catChipTextOn: { color: '#ffffff' },
  amtRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  amtInput: { flex: 1, marginBottom: 0 },
  saveBtn: {
    backgroundColor: colors.navy,
    borderRadius: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnOff: { opacity: 0.6 },
  saveText: { color: '#ffffff', fontWeight: '800', fontSize: font.md },
  msg: { color: colors.success, fontSize: font.sm, marginTop: 8, fontWeight: '600' },
  totalBar: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: { color: colors.muted, fontWeight: '700', fontSize: font.md },
  totalValue: { color: colors.navy, fontWeight: '800', fontSize: font.xl },
  subHeading: { color: colors.navy, fontSize: font.lg, fontWeight: '800', marginBottom: 8 },
  row: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLeft: { flex: 1 },
  desc: { color: colors.ink, fontWeight: '700', fontSize: font.md },
  meta: { color: colors.muted, fontSize: font.sm, marginTop: 2 },
  amt: { color: colors.navy, fontWeight: '800', fontSize: font.md, marginRight: 12 },
  delBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delText: { color: colors.danger, fontWeight: '800', fontSize: font.md },
  empty: { color: colors.muted, fontSize: font.md, textAlign: 'center', marginTop: 14, padding: 16 },
})