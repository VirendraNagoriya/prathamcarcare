import { useState } from 'react'
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native'
import { colors, font } from '../theme'
import CalendarModal from './CalendarModal'

export interface HistoryFilters {
  from: string
  to: string
  month: string
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function currentMonthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

function monthKey(year: number, monthIndex: number): string {
  return `${year}-${pad(monthIndex + 1)}`
}

export default function HistoryFilterModal({
  visible,
  initial,
  onApply,
  onClose,
  onClear,
}: {
  visible: boolean
  initial: HistoryFilters
  onApply: (f: HistoryFilters) => void
  onClose: () => void
  onClear: () => void
}) {
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [month, setMonth] = useState(initial.month)
  const [pick, setPick] = useState<'from' | 'to' | null>(null)

  const selectMonth = (key: string) => {
    setMonth(key === month ? '' : key)
    setFrom('')
    setTo('')
  }

  const apply = () => {
    if (month !== '') onApply({ from: '', to: '', month })
    else onApply({ from, to, month: '' })
  }

  const isoLabel = (iso: string) => {
    if (!iso) return 'Pick date'
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  const monthKeys: string[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    monthKeys.push(monthKey(d.getFullYear(), d.getMonth()))
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Filter Invoices</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>By month</Text>
          <View style={styles.monthGrid}>
            {monthKeys.map((key) => {
              const current = key === currentMonthKey()
              const selected = key === month
              return (
                <Pressable
                  key={key}
                  style={[styles.monthChip, selected && styles.monthChipSelected]}
                  onPress={() => selectMonth(key)}
                >
                  <Text style={[styles.monthChipText, selected && styles.monthChipTextSelected]}>
                    {MONTH_NAMES[Number(key.split('-')[1]) - 1]} {key.split('-')[0].slice(2)}
                  </Text>
                  {current && !selected && <View style={styles.dot} />}
                </Pressable>
              )
            })}
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>By date range</Text>

          <View style={styles.dateRow}>
            <Pressable style={[styles.dateBtn, from !== '' && styles.dateBtnSet]} onPress={() => setPick('from')}>
              <Text style={styles.dateLabel}>From</Text>
              <Text style={[styles.dateValue, from === '' && styles.dateValueEmpty]}>
                {from === '' ? '—' : isoLabel(from)}
              </Text>
            </Pressable>
            <Pressable style={[styles.dateBtn, to !== '' && styles.dateBtnSet]} onPress={() => setPick('to')}>
              <Text style={styles.dateLabel}>To</Text>
              <Text style={[styles.dateValue, to === '' && styles.dateValueEmpty]}>
                {to === '' ? '—' : isoLabel(to)}
              </Text>
            </Pressable>
          </View>

          <CalendarModal
            visible={pick !== null}
            initial={pick === 'from' ? from : to}
            onSelect={(date) => {
              if (date === '') {
                if (pick === 'from') setFrom('')
                else setTo('')
              } else if (pick === 'to') {
                if (from === '' || date >= from) setTo(date)
              } else {
                setFrom(date)
              }
            }}
            onClose={() => setPick(null)}
          />

          <View style={styles.actions}>
            <Pressable style={styles.clearBtn} onPress={onClear}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
            <Pressable style={styles.applyBtn} onPress={apply}>
              <Text style={styles.applyText}>Apply filter</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { color: colors.navy, fontWeight: '800', fontSize: font.lg },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.muted, fontWeight: '800', fontSize: font.md },
  sectionLabel: { color: colors.navy, fontWeight: '800', fontSize: font.sm, marginBottom: 8 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthChip: {
    width: '23%',
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: colors.bg,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  monthChipSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  monthChipText: { color: colors.ink, fontWeight: '700', fontSize: font.sm },
  monthChipTextSelected: { color: '#ffffff' },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.blue },
  divider: { height: 1, backgroundColor: colors.rowLine, marginVertical: 14 },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 10,
    backgroundColor: colors.bg,
  },
  dateBtnSet: { borderColor: colors.blue },
  dateLabel: { color: colors.muted, fontWeight: '700', fontSize: font.xs },
  dateValue: { color: colors.ink, fontWeight: '800', fontSize: font.md, marginTop: 2 },
  dateValueEmpty: { color: colors.muted },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  clearBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  clearText: { color: colors.danger, fontWeight: '800', fontSize: font.md },
  applyBtn: {
    flex: 2,
    borderWidth: 1.5,
    borderColor: colors.navy,
    backgroundColor: colors.navy,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  applyText: { color: '#ffffff', fontWeight: '800', fontSize: font.md },
})