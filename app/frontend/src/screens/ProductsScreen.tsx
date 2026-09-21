import { useCallback, useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, useWindowDimensions } from 'react-native'
import { colors, font } from '../theme'
import { api, type CatalogItem } from '../api/client'
import { formatINR } from '../utils/format'

interface EditingState {
  id: number
  name: string
  price: string
}

export default function ProductsScreen() {
  const { width } = useWindowDimensions()
  const wide = width >= 480
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filter, setFilter] = useState('')

  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<EditingState | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.catalog()
      setItems(res.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load products')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = filter.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(filter.trim().toLowerCase()))
    : items

  const addItem = async () => {
    if (!newName.trim()) { setError('Product name is required'); return }
    setError('')
    setAdding(true)
    try {
      await api.addCatalogItem({ name: newName.trim(), price: Number(newPrice) || 0 })
      setNewName('')
      setNewPrice('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add product')
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (item: CatalogItem) =>
    setEditing({ id: item.id, name: item.name, price: String(item.price) })

  const saveEdit = async () => {
    if (!editing) return
    if (!editing.name.trim()) { setError('Product name is required'); return }
    setError('')
    try {
      await api.updateCatalogItem(editing.id, {
        name: editing.name.trim(),
        price: Number(editing.price) || 0,
      })
      setEditing(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save product')
    }
  }

  const removeItem = async (item: CatalogItem) => {
    setError('')
    try {
      await api.deleteCatalogItem(item.id)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete product')
    }
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={filtered}
      keyExtractor={(it) => String(it.id)}
      refreshing={loading}
      onRefresh={load}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <View style={styles.headerRow}>
            <Text style={styles.heading}>Products & Services</Text>
            <Pressable onPress={() => void load()}>
              <Text style={styles.refresh}>↻ Refresh</Text>
            </Pressable>
          </View>

          <Text style={styles.hint}>
            Inventory of products/services with default prices. Prices can be changed at billing time for each bill.
          </Text>

          <View style={styles.addCard}>
            <Text style={styles.addLabel}>＋ Add new product / service</Text>
            <View style={wide && styles.inputsRow}>
              <TextInput style={[styles.input, wide && styles.inputHalf]} value={newName} onChangeText={setNewName} placeholder="Product name" placeholderTextColor={colors.muted} />
              <TextInput style={[styles.input, wide && styles.inputHalf]} value={newPrice} onChangeText={setNewPrice} placeholder="Default price (₹)" placeholderTextColor={colors.muted} keyboardType="decimal-pad" />
            </View>
            <Pressable style={[styles.btn, adding && styles.btnDim]} onPress={addItem} disabled={adding}>
              <Text style={styles.btnText}>{adding ? 'Adding…' : 'Add to Inventory'}</Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.search}
            value={filter}
            onChangeText={setFilter}
            placeholder="🔍 Search product…"
            placeholderTextColor={colors.muted}
          />

          {error !== '' && <Text style={styles.error}>{error}</Text>}
        </View>
      }
      renderItem={({ item }) =>
        editing?.id === item.id ? (
          <View style={styles.editCard}>
            <View style={wide && styles.inputsRow}>
              <TextInput style={[styles.input, wide && styles.inputHalf]} value={editing.name} onChangeText={(t) => setEditing({ ...editing, name: t })} placeholder="Product name" placeholderTextColor={colors.muted} />
              <TextInput style={[styles.input, wide && styles.inputHalf]} value={editing.price} onChangeText={(t) => setEditing({ ...editing, price: t })} placeholder="Default price (₹)" placeholderTextColor={colors.muted} keyboardType="decimal-pad" />
            </View>
            <View style={styles.rowBtns}>
              <Pressable style={[styles.btn, styles.btnGreen]} onPress={saveEdit}>
                <Text style={styles.btnText}>Save</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setEditing(null)}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowPrice}>₹{formatINR(item.price)}</Text>
            </View>
            <View style={styles.rowBtns}>
              <Pressable style={[styles.smallBtn, styles.smallBtnNavy]} onPress={() => startEdit(item)}>
                <Text style={styles.smallBtnText}>✎</Text>
              </Pressable>
              <Pressable style={[styles.smallBtn, styles.smallBtnDanger]} onPress={() => void removeItem(item)}>
                <Text style={styles.smallBtnTextDanger}>🗑</Text>
              </Pressable>
            </View>
          </View>
        )
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          {loading ? 'Loading…' : filter.trim() ? 'No matching products.' : error !== '' ? error : 'No products yet. Add your first product above.'}
        </Text>
      }
    />
  )
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { padding: 14, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  heading: { color: colors.navy, fontSize: font.xl, fontWeight: '800' },
  refresh: { color: colors.blue, fontWeight: '700', fontSize: font.md },
  hint: { color: colors.muted, fontSize: font.sm, lineHeight: 18, marginBottom: 12 },
  addCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  inputsRow: { flexDirection: 'row', gap: 8 },
  inputHalf: { flex: 1 },
  addLabel: { color: colors.navy, fontWeight: '800', fontSize: font.md, marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: 8,
    padding: 10,
    fontSize: font.md,
    color: colors.ink,
    backgroundColor: colors.card,
    marginBottom: 8,
  },
  btn: { backgroundColor: colors.navy, borderRadius: 8, paddingVertical: 11, alignItems: 'center', flex: 1 },
  btnDim: { opacity: 0.6 },
  btnGreen: { backgroundColor: '#16a34a' },
  btnGhost: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.navy },
  btnText: { color: '#ffffff', fontWeight: '800', fontSize: font.md },
  btnGhostText: { color: colors.navy, fontWeight: '800', fontSize: font.md },
  search: {
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: 8,
    padding: 10,
    fontSize: font.md,
    color: colors.ink,
    backgroundColor: colors.card,
    marginBottom: 12,
  },
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
  editCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  rowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginRight: 10 },
  rowName: { color: colors.ink, fontWeight: '700', fontSize: font.md, flexShrink: 1 },
  rowPrice: { color: colors.navy, fontWeight: '800', fontSize: font.md, marginLeft: 8 },
  rowBtns: { flexDirection: 'row', gap: 8, marginTop: 4 },
  smallBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  smallBtnNavy: { backgroundColor: colors.navy },
  smallBtnDanger: { backgroundColor: '#fee2e2' },
  smallBtnText: { color: '#ffffff', fontWeight: '800', fontSize: font.md },
  smallBtnTextDanger: { color: colors.danger, fontWeight: '800', fontSize: font.md },
  error: { color: colors.danger, fontWeight: '600', fontSize: font.sm, marginBottom: 8, textAlign: 'center' },
  empty: { color: colors.muted, fontSize: font.md, textAlign: 'center', marginTop: 20, padding: 20 },
})