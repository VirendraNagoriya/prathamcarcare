import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, FlatList, TextInput, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, font } from '../theme'
import { api, type InvoiceListItem } from '../api/client'
import { formatINR, formatDate } from '../utils/format'
import { useNav } from '../nav'
import HistoryFilterModal, { type HistoryFilters } from '../components/HistoryFilterModal'

const EMPTY_FILTERS: HistoryFilters = { from: '', to: '', month: '' }

function hasActive(f: HistoryFilters): boolean {
  return f.from !== '' || f.to !== '' || f.month !== ''
}

export default function HistoryScreen() {
  const { push } = useNav()
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState<HistoryFilters>(EMPTY_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [list, setList] = useState<InvoiceListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadPage = useCallback(async (query: string, f: HistoryFilters, offset: number, append: boolean) => {
    if (append) setLoadingMore(true)
    else { setLoading(true); setError('') }
    try {
      const res = await api.invoiceHistory({ q: query, from: f.from, to: f.to, month: f.month, offset })
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

  const reload = useCallback((query: string, f: HistoryFilters) => void loadPage(query, f, 0, false), [loadPage])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    const query = q.trim()
    if (query === '') {
      void loadPage('', filters, 0, false)
      return
    }
    timer.current = setTimeout(() => void loadPage(query, filters, 0, false), 250)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [q, filters, loadPage])

  const onEndReached = useCallback(() => {
    if (loading || loadingMore || list.length >= total) return
    void loadPage(q.trim(), filters, list.length, true)
  }, [loading, loadingMore, list.length, total, q, filters, loadPage])

  const applyFilters = (f: HistoryFilters) => {
    setFilterOpen(false)
    setFilters(f)
  }

  const clearFilters = () => {
    setFilterOpen(false)
    setFilters(EMPTY_FILTERS)
  }

  const active = hasActive(filters)
  const filterLabel = filters.month !== ''
    ? filters.month
    : filters.from !== '' || filters.to !== ''
      ? `${filters.from ? formatDate(filters.from) : '…'} – ${filters.to ? formatDate(filters.to) : '…'}`
      : ''

  return (
    <>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={list}
        keyExtractor={(it) => String(it.id)}
        refreshing={loading}
        onRefresh={() => reload(q.trim(), filters)}
        keyboardShouldPersistTaps="handled"
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
      ListHeaderComponent={
        <View>
          <View style={styles.headerRow}>
            <Text style={styles.heading}>Invoice History</Text>
            <Pressable onPress={() => reload(q.trim(), filters)}>
              <Text style={styles.refresh}>↻ Refresh</Text>
            </Pressable>
          </View>
          <View style={styles.filterRow}>
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchInput}
                value={q}
                onChangeText={setQ}
                placeholder="Search by name, phone or vehicle no."
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
            <Pressable
              style={[styles.filterBtn, active && styles.filterBtnActive]}
              onPress={() => setFilterOpen(true)}
              hitSlop={4}
            >
              <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>⚲ Filter</Text>
            </Pressable>
          </View>
          {active && (
            <Pressable onPress={() => { setFilters(EMPTY_FILTERS) }}>
              <Text style={styles.filterBadge}>Filter: {filterLabel} ✕</Text>
            </Pressable>
          )}
          {(q.trim() !== '' || active) && (
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
      ListEmptyComponent={
        <Text style={styles.empty}>
          {loading ? 'Loading…' : error !== '' ? error : q.trim() !== '' || active ? 'No bills match your search.' : 'No invoices yet.'}
        </Text>
      }
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator color={colors.blue} style={styles.footer} />
        ) : null
      }
      extraData={active}
      />
      <HistoryFilterModal
        visible={filterOpen}
        initial={filters}
        onApply={applyFilters}
        onClose={() => setFilterOpen(false)}
        onClear={clearFilters}
      />
    </>
  )
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  heading: { color: colors.navy, fontSize: font.xl, fontWeight: '800' },
  refresh: { color: colors.blue, fontWeight: '700', fontSize: font.md },
  searchBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 4,
  },
  searchInput: { padding: 11, fontSize: font.md, color: colors.ink },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  filterBtn: {
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: colors.card,
  },
  filterBtnActive: { backgroundColor: colors.navy },
  filterBtnText: { color: colors.navy, fontWeight: '800', fontSize: font.md },
  filterBtnTextActive: { color: '#ffffff' },
  filterBadge: {
    color: colors.blue,
    fontWeight: '700',
    fontSize: font.sm,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
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