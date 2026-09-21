import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, FlatList, TextInput, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, font } from '../theme'
import { api, type InvoiceListItem } from '../api/client'
import { formatINR, formatDate } from '../utils/format'
import { useNav } from '../nav'

export default function HistoryScreen() {
  const { push } = useNav()
  const [q, setQ] = useState('')
  const [list, setList] = useState<InvoiceListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadPage = useCallback(async (query: string, offset: number, append: boolean) => {
    if (append) setLoadingMore(true)
    else { setLoading(true); setError('') }
    try {
      const res = await api.invoiceHistory(query, offset)
      setList((prev) => (append ? [...prev, ...res.invoices] : res.invoices))
      setTotal(res.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load history')
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
          <View style={styles.headerRow}>
            <Text style={styles.heading}>Invoice History</Text>
            <Pressable onPress={() => reload(q.trim())}>
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
            <Text style={styles.resultHint}>{loading ? 'Searching…' : `${total} match(es)`}</Text>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Pressable style={styles.rowMain} onPress={() => push({ name: 'detail', id: item.id })}>
            <View style={styles.rowLeft}>
              <Text style={styles.billNo}>Bill No. {item.bill_ref}</Text>
              <Text style={styles.plate}>{item.plate_number}</Text>
              <Text style={styles.owner}>{item.owner_name} · {item.owner_phone}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.amt}>₹{formatINR(item.total_amount)}</Text>
              <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>
          </Pressable>
          <Pressable
            style={styles.rowEdit}
            onPress={() => push({ name: 'billing', editId: item.id })}
            hitSlop={6}
            accessibilityLabel={`Edit bill ${item.bill_ref}`}
          >
            <Text style={styles.rowEditText}>✎</Text>
          </Pressable>
        </View>
      )}
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator color={colors.blue} style={styles.footer} />
        ) : null
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          {loading ? 'Loading…' : error !== '' ? error : q.trim() !== '' ? 'No bills match your search.' : 'No invoices yet.'}
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
  row: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowMain: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLeft: { flex: 1 },
  billNo: { color: colors.navy, fontWeight: '800', fontSize: font.md },
  plate: { color: colors.ink, fontWeight: '700', fontSize: font.lg, marginTop: 2 },
  owner: { color: colors.muted, fontSize: font.sm, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', marginLeft: 8 },
  amt: { color: colors.navy, fontWeight: '800', fontSize: font.lg },
  date: { color: colors.muted, fontSize: font.xs, marginTop: 2 },
  rowEdit: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEditText: { color: '#ffffff', fontWeight: '800', fontSize: font.lg },
  footer: { paddingVertical: 14 },
  empty: { color: colors.muted, fontSize: font.md, textAlign: 'center', marginTop: 30, padding: 20 },
})