import { useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native'
import { colors, font } from '../theme'
import { api, type Vehicle, type ReminderItem } from '../api/client'
import { formatINR } from '../utils/format'
import { useNav } from '../nav'

export default function DashboardScreen() {
  const { push } = useNav()
  const [q, setQ] = useState('')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [reminders, setReminders] = useState<ReminderItem[]>([])
  const [today, setToday] = useState<{ bills: number; total: number; net: number } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadToday = () => {
    api.statsToday()
      .then((t) => setToday({ bills: t.bills, total: t.total, net: t.net }))
      .catch(() => setToday(null))
  }

  useEffect(() => {
    loadToday()
    api.getReminders()
      .then((res) => setReminders(res.reminders))
      .catch(() => setReminders([]))
  }, [])

  const pendingCount = reminders.filter((r) => r.reminded === 0).length

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (q.trim().length < 2) {
      setVehicles([])
      return
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await api.searchVehicles(q.trim())
        setVehicles(res.vehicles)
      } catch {
        setVehicles([])
      }
    }, 250)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [q])

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={[]}
      renderItem={null}
      ListHeaderComponent={
        <View>
          <Pressable style={styles.primaryBtn} onPress={() => push({ name: 'billing' })}>
            <Text style={styles.primaryBtnText}>＋ New Billing</Text>
          </Pressable>

          <Text style={styles.sectionLabel}>Search customer by Car No., Phone or Name</Text>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              value={q}
              onChangeText={setQ}
              placeholder="Type to search…"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
            />
          </View>

          {q.trim().length >= 2 && (
            <View style={styles.results}>
              {vehicles.length === 0 && <Text style={styles.empty}>No matching customers</Text>}
              {vehicles.map((v) => (
                <Pressable
                  key={v.id}
                  style={styles.resultRow}
                  onPress={() => push({ name: 'customerBills', vehicleId: v.id })}
                >
                  <View>
                    <Text style={styles.resultPlate}>{v.plate_number}</Text>
                    <Text style={styles.resultOwner}>{v.owner_name}</Text>
                  </View>
                  <View style={styles.resultMeta}>
                    {!!v.bill_count && v.bill_count > 1 && (
                      <View style={styles.billBadge}>
                        <Text style={styles.billBadgeText}>{v.bill_count} bills</Text>
                      </View>
                    )}
                    <Text style={styles.resultPhone}>{v.owner_phone}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable style={styles.todayCard} onPress={() => push({ name: 'daySheet' })}>
            <View>
              <Text style={styles.todayLabel}>Today's Billing</Text>
              <Text style={styles.todayAmt}>
                ₹{formatINR(today?.total ?? 0)}
              </Text>
              <Text style={styles.todayMeta}>
                {today ? `${today.bills} bill${today.bills === 1 ? '' : 's'} · Net ₹${formatINR(today.net)}` : '…'}
              </Text>
            </View>
            <View style={styles.todayRight}>
              <Pressable onPress={(e) => { e.stopPropagation(); loadToday() }}>
                <Text style={styles.todayRefresh}>↻</Text>
              </Pressable>
              <Text style={styles.todayArrow}>›</Text>
            </View>
          </Pressable>

          <View style={styles.quickRow}>
            <Pressable style={styles.quickBtn} onPress={() => push({ name: 'history' })}>
              <Text style={styles.quickBtnText}>📄 History</Text>
            </Pressable>
            <Pressable style={styles.quickBtn} onPress={() => push({ name: 'products' })}>
              <Text style={styles.quickBtnText}>📦 Products</Text>
            </Pressable>
          </View>
          <View style={styles.quickRow}>
            <Pressable style={styles.quickBtn} onPress={() => push({ name: 'customers' })}>
              <Text style={styles.quickBtnText}>👥 Customers</Text>
            </Pressable>
            <Pressable style={styles.quickBtn} onPress={() => push({ name: 'daySheet' })}>
              <Text style={styles.quickBtnText}>🧾 Day Sheet</Text>
            </Pressable>
          </View>
          <View style={styles.quickRow}>
            <Pressable style={styles.quickBtn} onPress={() => push({ name: 'expenses' })}>
              <Text style={styles.quickBtnText}>💰 Expenses</Text>
            </Pressable>
            <Pressable style={[styles.quickBtn, styles.reminderBtn]} onPress={() => push({ name: 'reminders' })}>
              <Text style={styles.quickBtnText}>🔔 Reminders</Text>
              {pendingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
          <View style={styles.quickRow}>
            <Pressable style={styles.quickBtn} onPress={() => push({ name: 'settings' })}>
              <Text style={styles.quickBtnText}>⚙️ Settings</Text>
            </Pressable>
            <View style={styles.quickBtn} />
          </View>

          <Text style={styles.foot}>
            Pratham Car Care · Karvenagar, Pune · Call 9011560540 / 9665939486
          </Text>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },
  primaryBtn: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: font.xl, letterSpacing: 0.5 },
  sectionLabel: {
    color: colors.navy,
    fontWeight: '700',
    fontSize: font.md,
    marginBottom: 8,
  },
  searchBox: {
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 4,
  },
  searchInput: { padding: 12, fontSize: font.lg, color: colors.ink },
  results: {
    marginTop: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    overflow: 'hidden',
  },
  empty: { padding: 14, color: colors.muted, fontSize: font.md, textAlign: 'center' },
  resultRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.rowLine,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultPlate: { color: colors.navy, fontWeight: '800', fontSize: font.lg },
  resultOwner: { color: colors.ink, fontSize: font.md, marginTop: 2 },
  resultPhone: { color: colors.muted, fontSize: font.md },
  resultMeta: { alignItems: 'flex-end' },
  billBadge: {
    backgroundColor: '#dbeafe',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 3,
  },
  billBadgeText: { color: colors.navy, fontWeight: '800', fontSize: font.xs },
  todayCard: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayLabel: { color: '#93c5fd', fontWeight: '700', fontSize: font.sm },
  todayAmt: { color: '#ffffff', fontWeight: '800', fontSize: font.title, marginTop: 2 },
  todayMeta: { color: '#cbd5e1', fontSize: font.md, marginTop: 3 },
  todayRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  todayRefresh: { color: '#93c5fd', fontWeight: '800', fontSize: font.xl, padding: 4 },
  todayArrow: { color: '#ffffff', fontWeight: '800', fontSize: font.xl },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  quickBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  reminderBtn: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -8,
    right: -6,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#ffffff', fontWeight: '800', fontSize: font.xs },
  quickBtnText: { color: colors.navy, fontWeight: '800', fontSize: font.lg },
  foot: { color: colors.muted, fontSize: font.xs, textAlign: 'center', marginTop: 28 },
})