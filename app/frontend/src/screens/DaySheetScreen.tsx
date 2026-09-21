import { useCallback, useEffect, useState } from 'react'
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native'
import { colors, font } from '../theme'
import { api, type DaySheet, type Settings } from '../api/client'
import { formatINR, formatDate, toISODateString, shiftDate } from '../utils/format'
import { buildDaySheetText, openWhatsApp } from '../utils/whatsapp'
import { useNav } from '../nav'

export default function DaySheetScreen() {
  const { push } = useNav()
  const [date, setDate] = useState(toISODateString(new Date()))
  const [sheet, setSheet] = useState<DaySheet | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const isToday = date === toISODateString(new Date())

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => setSettings(null))
  }, [])

  const load = useCallback(async (d: string) => {
    setLoading(true)
    setError('')
    try {
      setSheet(await api.daySheet(d))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load day sheet')
      setSheet(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(date) }, [date, load])

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={sheet?.items ?? []}
      keyExtractor={(_, i) => String(i)}
      refreshing={loading}
      onRefresh={() => void load(date)}
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

          {sheet && (
            <>
              <View style={styles.summaryCard}>
                <View style={styles.sumRow}>
                  <Text style={styles.sumLabel}>Bills issued</Text>
                  <Text style={styles.sumValue}>{sheet.bills}</Text>
                </View>
                <View style={styles.sumRow}>
                  <Text style={styles.sumLabel}>Billed total</Text>
                  <Text style={styles.sumValue}>₹{formatINR(sheet.billed_total)}</Text>
                </View>
                <View style={styles.sumRow}>
                  <Text style={styles.sumLabel}>Expenses</Text>
                  <Text style={[styles.sumValue, styles.expenseText]}>− ₹{formatINR(sheet.expense_total)}</Text>
                </View>
                <View style={[styles.sumRow, styles.netRow]}>
                  <Text style={styles.netLabel}>Net day profit</Text>
                  <Text style={styles.netValue}>
                    {sheet.net >= 0 ? '+' : '−'}₹{formatINR(Math.abs(sheet.net))}
                  </Text>
                </View>
              </View>

              <Pressable style={styles.waBtn} onPress={() =>
                openWhatsApp(settings?.shop_phone ?? '', buildDaySheetText(sheet, settings ?? undefined))
              }>
                <Text style={styles.waText}>Send day sheet on WhatsApp</Text>
              </Pressable>

              <View style={styles.secRow}>
                <Text style={styles.subHeading}>
                  {sheet.items.length ? 'Services / Parts sold' : 'No items sold on this day'}
                </Text>
              </View>
            </>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.itemRow}>
          <Text style={styles.itemName}>{item.product_name}</Text>
          <Text style={styles.itemQty}>× {item.qty}</Text>
          <Text style={styles.itemTotal}>₹{formatINR(item.total)}</Text>
        </View>
      )}
      ListFooterComponent={
        sheet && sheet.expenses.length ? (
          <View>
            <Text style={styles.subHeading}>Expenses on {formatDate(sheet.date)}</Text>
            {sheet.expenses.map((e) => (
              <View key={e.id} style={styles.itemRow}>
                <Text style={styles.itemName} numberOfLines={1}>{e.description}</Text>
                <Text style={styles.itemQty}>{e.category}</Text>
                <Text style={styles.itemTotal}>₹{formatINR(e.amount)}</Text>
              </View>
            ))}
            <Pressable style={styles.manageBtn} onPress={() => push({ name: 'expenses' })}>
              <Text style={styles.manageText}>Manage expenses ›</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.expRow}>
            <Text style={styles.subHeading}>No expenses this day</Text>
            <Pressable style={styles.manageBtn} onPress={() => push({ name: 'expenses' })}>
              <Text style={styles.manageText}>Add expense ›</Text>
            </Pressable>
          </View>
        )
      }
      ListEmptyComponent={
        loading ? <Text style={styles.empty}>Loading…</Text>
        : error !== '' ? <Text style={styles.empty}>{error}</Text>
        : sheet ? <Text style={styles.empty}>No items sold on this day.</Text>
        : null
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
  summaryCard: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  sumLabel: { color: colors.muted, fontSize: font.md },
  sumValue: { color: colors.ink, fontWeight: '800', fontSize: font.lg },
  expenseText: { color: colors.danger },
  netRow: { borderTopWidth: 1, borderTopColor: colors.rowLine, marginTop: 6, paddingTop: 10 },
  netLabel: { color: colors.navy, fontWeight: '800', fontSize: font.md },
  netValue: { color: colors.success, fontWeight: '800', fontSize: font.xl },
  waBtn: {
    backgroundColor: '#25D366',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 8,
  },
  waText: { color: '#ffffff', fontWeight: '800', fontSize: font.md },
  secRow: { marginBottom: 8 },
  subHeading: { color: colors.navy, fontSize: font.lg, fontWeight: '800', marginTop: 4 },
  itemRow: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: { flex: 1, color: colors.ink, fontWeight: '700', fontSize: font.md },
  itemQty: { color: colors.muted, fontSize: font.sm, marginRight: 10 },
  itemTotal: { color: colors.navy, fontWeight: '800', fontSize: font.md },
  expRow: { marginTop: 12 },
  manageBtn: { alignSelf: 'flex-start', marginTop: 6, marginBottom: 12 },
  manageText: { color: colors.blue, fontWeight: '800', fontSize: font.md },
  empty: { color: colors.muted, fontSize: font.md, textAlign: 'center', marginTop: 16, padding: 14 },
})