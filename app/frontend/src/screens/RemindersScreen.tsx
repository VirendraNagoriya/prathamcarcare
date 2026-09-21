import { useCallback, useEffect, useState } from 'react'
import { View, Text, Pressable, FlatList, TextInput, StyleSheet } from 'react-native'
import { colors, font } from '../theme'
import { api, type ReminderItem, type Settings } from '../api/client'
import { buildReminderText, openWhatsApp } from '../utils/whatsapp'
import { formatDate } from '../utils/format'

type StatusFilter = 'all' | 'pending' | 'sent'

export default function RemindersScreen() {
  const [list, setList] = useState<ReminderItem[]>([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [res, s] = await Promise.all([api.getReminders(), api.getSettings()])
      setList(res.reminders)
      setSettings(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load reminders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const searchFiltered = (() => {
    const t = q.trim().toLowerCase()
    if (t === '') return list
    const digits = q.replace(/\D/g, '')
    return list.filter((r) =>
      r.plate_number.toLowerCase().includes(t) ||
      r.owner_name.toLowerCase().includes(t) ||
      (digits !== '' && r.owner_phone.replace(/\D/g, '').includes(digits)),
    )
  })()

  const filtered = status === 'all'
    ? searchFiltered
    : searchFiltered.filter((r) => (status === 'pending' ? r.reminded === 0 : r.reminded === 1))

  const pendingCount = list.filter((r) => r.reminded === 0).length
  const sentCount = list.filter((r) => r.reminded === 1).length

  const sendReminder = async (item: ReminderItem) => {
    const text = buildReminderText({
      owner_name: item.owner_name,
      plate_number: item.plate_number,
      next_service_date: item.next_service_date,
    }, settings ?? undefined)
    openWhatsApp(item.owner_phone, text)
    try { await api.markReminderSent(item.invoice_id) } catch { /* ignore */ }
    setList((prev) => prev.map((r) =>
      r.invoice_id === item.invoice_id ? { ...r, reminded: 1 } : r,
    ))
  }

  const badgeStyle = (s: string) =>
    s === 'overdue' ? styles.badgeRed : s === 'today' ? styles.badgeOrange : styles.badgeBlue

  const labelFor = (item: ReminderItem) => {
    if (item.days === 0) return 'Due today'
    if (item.days < 0) return `${Math.abs(item.days)}d overdue`
    return `In ${item.days}d`
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={filtered}
      keyExtractor={(it) => String(it.invoice_id)}
      refreshing={loading}
      onRefresh={load}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <View style={styles.headerRow}>
            <Text style={styles.heading}>Service Reminders</Text>
            <Pressable onPress={() => void load()}>
              <Text style={styles.refresh}>↻ Refresh</Text>
            </Pressable>
          </View>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              value={q}
              onChangeText={setQ}
              placeholder="Search by name, phone or car no."
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
          {q.trim() !== '' && (
            <Text style={styles.resultHint}>{filtered.length} match(es)</Text>
          )}
          <View style={styles.filterRow}>
            {([
              ['all', `All (${list.length})`],
              ['pending', `Pending (${pendingCount})`],
              ['sent', `Sent (${sentCount})`],
            ] as [StatusFilter, string][]).map(([key, label]) => (
              <Pressable
                key={key}
                style={[styles.filterBtn, status === key && styles.filterBtnOn]}
                onPress={() => setStatus(key)}
              >
                <Text style={[styles.filterBtnText, status === key && styles.filterBtnTextOn]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardLeft}>
              <Text style={styles.plate}>{item.plate_number}</Text>
              <Text style={styles.owner}>{item.owner_name}</Text>
              <Text style={styles.phone}>{item.owner_phone}</Text>
            </View>
            <View style={styles.cardRight}>
              <View style={[styles.badge, badgeStyle(item.status)]}>
                <Text style={styles.badgeText}>{labelFor(item)}</Text>
              </View>
              <Text style={styles.date}>Due: {formatDate(item.next_service_date)}</Text>
            </View>
          </View>
          <Pressable
            style={[styles.waBtn, !!item.reminded && styles.waBtnSent]}
            onPress={() => void sendReminder(item)}
          >
            <Text style={styles.waBtnText}>
              {item.reminded ? '✓ Sent' : '📱 Send WhatsApp Reminder'}
            </Text>
          </Pressable>
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>
          {loading ? 'Loading…' : error !== '' ? error
            : q.trim() !== '' ? 'No reminders match your search.'
            : status === 'pending' ? 'Nothing pending — all reminders sent.'
            : status === 'sent' ? 'No sent reminders yet.'
            : 'No upcoming reminders. All customers are up to date!'}
        </Text>
      }
    />
  )
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  heading: { color: colors.navy, fontSize: font.xl, fontWeight: '800' },
  refresh: { color: colors.blue, fontWeight: '700', fontSize: font.md },
  searchBox: {
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  searchInput: { padding: 11, fontSize: font.md, color: colors.ink },
  resultHint: { color: colors.muted, fontSize: font.sm, marginBottom: 8 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  filterBtnOn: { backgroundColor: colors.blue },
  filterBtnText: { color: colors.blue, fontWeight: '800', fontSize: font.sm },
  filterBtnTextOn: { color: '#ffffff' },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardLeft: { flex: 1 },
  cardRight: { alignItems: 'flex-end', marginLeft: 10 },
  plate: { color: colors.navy, fontWeight: '800', fontSize: font.lg },
  owner: { color: colors.ink, fontSize: font.md, marginTop: 2 },
  phone: { color: colors.muted, fontSize: font.sm, marginTop: 2 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  badgeRed: { backgroundColor: '#fee2e2' },
  badgeOrange: { backgroundColor: '#ffedd5' },
  badgeBlue: { backgroundColor: '#dbeafe' },
  badgeText: { fontWeight: '800', fontSize: font.xs },
  date: { color: colors.muted, fontSize: font.xs },
  waBtn: {
    backgroundColor: '#25d366',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  waBtnSent: { backgroundColor: '#94a3b8' },
  waBtnText: { color: '#ffffff', fontWeight: '800', fontSize: font.md },
  empty: { color: colors.muted, fontSize: font.md, textAlign: 'center', marginTop: 30, padding: 20 },
})
