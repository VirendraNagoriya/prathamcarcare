import { useState } from 'react'
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native'
import { colors, font } from '../theme'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function CalendarModal({
  visible,
  initial,
  onSelect,
  onClose,
}: {
  visible: boolean
  initial?: string
  onSelect: (date: string) => void
  onClose: () => void
}) {
  const today = new Date()
  const parsed = initial ? new Date(initial + 'T00:00:00') : null
  const startDate = parsed && !Number.isNaN(parsed.getTime()) ? parsed : today

  const [viewYear, setViewYear] = useState(startDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(startDate.getMonth())

  const isCurrentViewToday =
    viewYear === today.getFullYear() && viewMonth === today.getMonth()

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()

  const cells: Array<{ day: number; date: string; isToday: boolean; isSelected: boolean }> = []
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ day: 0, date: '', isToday: false, isSelected: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`
    cells.push({
      day: d,
      date,
      isToday: date === toISODate(today),
      isSelected: date === initial,
    })
  }

  const shiftMonth = (delta: number) => {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    if (y < 2000 || y > 2100) return
    setViewMonth(m)
    setViewYear(y)
  }

  const shiftYear = (delta: number) => {
    const y = viewYear + delta
    if (y < 2000 || y > 2100) return
    setViewYear(y)
  }

  const resetToToday = () => {
    setViewMonth(today.getMonth())
    setViewYear(today.getFullYear())
  }

  const pickToday = () => {
    const iso = toISODate(today)
    onSelect(iso)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Select Service Date</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.controls}>
            <View style={styles.navGroup}>
              <Pressable style={styles.navBtn} onPress={() => shiftMonth(-1)}>
                <Text style={styles.navText}>‹</Text>
              </Pressable>
              <Pressable style={styles.navBtn} onPress={() => shiftYear(-1)}>
                <Text style={styles.navText}>«</Text>
              </Pressable>
            </View>
            <Text style={styles.monthLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <View style={styles.navGroup}>
              <Pressable style={styles.navBtn} onPress={() => shiftYear(1)}>
                <Text style={styles.navText}>»</Text>
              </Pressable>
              <Pressable style={styles.navBtn} onPress={() => shiftMonth(1)}>
                <Text style={styles.navText}>›</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekday}>{w}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((c, idx) =>
              c.day === 0 ? (
                <View key={`b-${idx}`} style={styles.dayCell} />
              ) : (
                <Pressable
                  key={c.date}
                  style={[
                    styles.dayCell,
                    c.isToday && styles.dayToday,
                    c.isSelected && styles.daySelected,
                  ]}
                  onPress={() => {
                    onSelect(c.date)
                    onClose()
                  }}
                >
                  <Text
                    style={[
                      styles.dayText,
                      c.isSelected && styles.dayTextSelected,
                      c.isToday && !c.isSelected && styles.dayTextToday,
                    ]}
                  >
                    {c.day}
                  </Text>
                </Pressable>
              ),
            )}
          </View>

          <View style={styles.footer}>
            <Pressable style={styles.todayBtn} onPress={resetToToday}>
              <Text style={styles.todayText}>Focus today</Text>
            </Pressable>
            <Pressable style={styles.todayBtn} onPress={pickToday}>
              <Text style={styles.todayText}>✔ Select today{isCurrentViewToday ? '' : ''}</Text>
            </Pressable>
            <Pressable style={styles.clearBtn} onPress={() => { onSelect(''); onClose() }}>
              <Text style={styles.clearText}>Clear</Text>
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
    maxWidth: 360,
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
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  navGroup: { flexDirection: 'row', gap: 6 },
  navBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  navText: { color: colors.navy, fontWeight: '800', fontSize: font.lg },
  monthLabel: { color: colors.navy, fontWeight: '800', fontSize: font.md },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { width: '14.28%', textAlign: 'center', color: colors.muted, fontWeight: '700', fontSize: font.xs, paddingVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', height: 38, alignItems: 'center', justifyContent: 'center' },
  dayToday: { borderRadius: 19, borderWidth: 1.5, borderColor: colors.blue },
  daySelected: { borderRadius: 19, backgroundColor: colors.navy },
  dayText: { color: colors.ink, fontWeight: '600', fontSize: font.md },
  dayTextSelected: { color: '#ffffff', fontWeight: '800' },
  dayTextToday: { color: colors.blue, fontWeight: '800' },
  footer: { flexDirection: 'row', gap: 8, marginTop: 12 },
  todayBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.navy, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  todayText: { color: colors.navy, fontWeight: '700', fontSize: font.sm },
  clearBtn: { borderWidth: 1.5, borderColor: colors.danger, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  clearText: { color: colors.danger, fontWeight: '700', fontSize: font.sm },
})