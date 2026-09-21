import { useCallback, useEffect, useState } from 'react'
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native'
import { colors, font } from '../theme'
import { api, type Vehicle, type CustomerBill } from '../api/client'
import { formatINR, formatDate } from '../utils/format'
import { useNav } from '../nav'

export default function CustomerBillsScreen({ vehicleId }: { vehicleId: number }) {
  const { push } = useNav()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [bills, setBills] = useState<CustomerBill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.getVehicleBills(vehicleId)
      setVehicle(res.vehicle)
      setBills(res.bills)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load bills')
    } finally {
      setLoading(false)
    }
  }, [vehicleId])

  useEffect(() => { void load() }, [load])

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={bills}
      keyExtractor={(it) => String(it.id)}
      refreshing={loading}
      onRefresh={load}
      ListHeaderComponent={
        <View>
          <View style={styles.profile}>
            <Text style={styles.heading}>{vehicle?.plate_number ?? 'Customer Bills'}</Text>
            {vehicle && (
              <>
                <Text style={styles.owner}>{vehicle.owner_name} · {vehicle.owner_phone}</Text>
                <Text style={styles.count}>
                  {bills.length} {bills.length === 1 ? 'bill' : 'bills'} found
                </Text>
              </>
            )}
            <Pressable
              style={styles.newBillBtn}
              onPress={() => push({ name: 'billing', vehicle: vehicle ?? undefined })}
            >
              <Text style={styles.newBillText}>＋ New Bill for this customer</Text>
            </Pressable>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.subHeading}>Invoice History</Text>
            <Pressable onPress={() => void load()}>
              <Text style={styles.refresh}>↻ Refresh</Text>
            </Pressable>
          </View>
        </View>
      }
      renderItem={({ item, index }) => (
        <Pressable style={styles.row} onPress={() => push({ name: 'detail', id: item.id })}>
          <View style={styles.rowLeft}>
            <Text style={styles.billNo}>
              #{index + 1} · {item.bill_ref}
            </Text>
            <Text style={styles.date}>
              {formatDate(item.created_at)}
              {item.next_service_date ? `  ·  Next: ${item.next_service_date}` : ''}
            </Text>
            {item.km_reading ? <Text style={styles.km}>Km: {item.km_reading}</Text> : null}
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.amt}>₹{formatINR(item.total_amount)}</Text>
            <Text style={styles.open}>View ›</Text>
          </View>
        </Pressable>
      )}
      ListEmptyComponent={
        <Text style={styles.empty}>
          {loading ? 'Loading…' : error !== '' ? error : 'No bills for this customer yet.'}
        </Text>
      }
    />
  )
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },
  profile: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  heading: { color: colors.navy, fontSize: font.xl, fontWeight: '800' },
  owner: { color: colors.ink, fontSize: font.md, marginTop: 3 },
  count: { color: colors.muted, fontSize: font.sm, marginTop: 3 },
  newBillBtn: {
    marginTop: 10,
    backgroundColor: colors.navy,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  newBillText: { color: '#ffffff', fontWeight: '800', fontSize: font.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subHeading: { color: colors.navy, fontSize: font.lg, fontWeight: '800' },
  refresh: { color: colors.blue, fontWeight: '700', fontSize: font.md },
  row: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: { flex: 1 },
  billNo: { color: colors.navy, fontWeight: '800', fontSize: font.md },
  date: { color: colors.muted, fontSize: font.sm, marginTop: 2 },
  km: { color: colors.muted, fontSize: font.sm, marginTop: 1 },
  rowRight: { alignItems: 'flex-end', marginLeft: 10 },
  amt: { color: colors.navy, fontWeight: '800', fontSize: font.lg },
  open: { color: colors.blue, fontWeight: '700', fontSize: font.xs, marginTop: 3 },
  empty: { color: colors.muted, fontSize: font.md, textAlign: 'center', marginTop: 20, padding: 20 },
})