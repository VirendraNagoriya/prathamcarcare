import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, FlatList, TextInput, StyleSheet, Linking, ActivityIndicator } from 'react-native'
import { colors, font } from '../theme'
import { api, type Vehicle } from '../api/client'
import { useNav } from '../nav'

type Customer = Vehicle & { bill_count: number }

export default function CustomersScreen() {
  const { push } = useNav()
  const [list, setList] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadPage = useCallback(async (query: string, offset: number, append: boolean) => {
    if (append) setLoadingMore(true)
    else { setLoading(true); setError('') }
    try {
      const res = await api.allCustomers(query, offset)
      setList((prev) => (append ? [...prev, ...res.customers] : res.customers))
      setTotal(res.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load customers')
      if (append) setList([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  const reload = useCallback((query: string) => void loadPage(query, 0, false), [loadPage])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    const query = q.trim()
    if (query === '') {
      void loadPage('', 0, false)
      return
    }
    timer.current = setTimeout(() => void loadPage(query, 0, false), 250)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [q, loadPage])

  const onEndReached = useCallback(() => {
    if (loading || loadingMore || list.length >= total) return
    void loadPage(q.trim(), list.length, true)
  }, [loading, loadingMore, list.length, total, q, loadPage])

  const call = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\D/g, '')}`).catch(() => undefined)
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={list}
      keyExtractor={(it) => String(it.id)}
      refreshing={loading}
      onRefresh={() => reload(q.trim())}
      keyboardShouldPersistTaps="handled"
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      ListHeaderComponent={
        <View>
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
          <View style={styles.countRow}>
            <Text style={styles.count}>
              {q.trim() !== '' ? `${total} match(es)` : `${total} customer(s)`}
            </Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() => push({ name: 'customerBills', vehicleId: item.id })}
        >
          <View style={styles.rowLeft}>
            <Text style={styles.plate}>{item.plate_number}</Text>
            <Text style={styles.owner}>{item.owner_name}</Text>
            <Text style={styles.meta}>
              {item.owner_phone}
              {item.bill_count > 0 ? `  ·  ${item.bill_count} ${item.bill_count === 1 ? 'bill' : 'bills'}` : ''}
            </Text>
          </View>
          <View style={styles.rowRight}>
            <Pressable style={styles.callBtn} onPress={() => call(item.owner_phone)}>
              <Text style={styles.callText}>📞 Call</Text>
            </Pressable>
            <Pressable style={styles.newBtn} onPress={() => push({ name: 'billing', vehicle: item })}>
              <Text style={styles.newText}>Bill</Text>
            </Pressable>
          </View>
        </Pressable>
      )}
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator color={colors.blue} style={styles.footer} />
        ) : null
      }
      ListEmptyComponent={
        loading ? <Text style={styles.empty}>Loading…</Text>
        : error !== '' ? <Text style={styles.empty}>{error}</Text>
        : <Text style={styles.empty}>{q.trim() !== '' ? 'No matching customers.' : 'No customers yet — create a bill first.'}</Text>
      }
    />
  )
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },
  searchBox: {
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 4,
  },
  searchInput: { padding: 12, fontSize: font.lg, color: colors.ink },
  countRow: { marginVertical: 10 },
  count: { color: colors.navy, fontWeight: '700', fontSize: font.md },
  empty: { color: colors.muted, fontSize: font.md, textAlign: 'center', marginTop: 14, padding: 10 },
  footer: { paddingVertical: 14 },
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
  plate: { color: colors.navy, fontWeight: '800', fontSize: font.lg },
  owner: { color: colors.ink, fontSize: font.md, marginTop: 2 },
  meta: { color: colors.muted, fontSize: font.sm, marginTop: 2 },
  rowRight: { flexDirection: 'row', gap: 6, marginLeft: 10 },
  callBtn: {
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  callText: { color: '#15803d', fontWeight: '800', fontSize: font.sm },
  newBtn: {
    backgroundColor: colors.navy,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  newText: { color: '#ffffff', fontWeight: '800', fontSize: font.sm },
})