import { useCallback, useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors, font } from './theme'
import { api } from './api/client'
import PinScreen from './screens/PinScreen'
import DashboardScreen from './screens/DashboardScreen'
import BillingScreen from './screens/BillingScreen'
import PreviewScreen from './screens/PreviewScreen'
import HistoryScreen from './screens/HistoryScreen'
import DetailScreen from './screens/DetailScreen'
import SettingsScreen from './screens/SettingsScreen'
import RemindersScreen from './screens/RemindersScreen'
import ProductsScreen from './screens/ProductsScreen'
import CustomerBillsScreen from './screens/CustomerBillsScreen'
import CustomersScreen from './screens/CustomersScreen'
import DaySheetScreen from './screens/DaySheetScreen'
import ExpensesScreen from './screens/ExpensesScreen'
import { NavProvider, useNav } from './nav'

function ScreenHost() {
  const { stack, current, pop, reset } = useNav()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    api
      .me()
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false))
  }, [])

  const handleLogout = useCallback(async () => {
    await api.logout().catch(() => undefined)
    setAuthed(false)
    reset({ name: 'dashboard' })
  }, [reset])

  if (authed === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredText}>Loading…</Text>
      </View>
    )
  }

  if (!authed) {
    return <PinScreen onSuccess={() => setAuthed(true)} />
  }

  const showHeader = current.name !== 'preview'

  return (
    <View style={styles.app}>
      {showHeader && (
        <View style={styles.header}>
          <Pressable onPress={() => reset({ name: 'dashboard' })}>
            <Text style={styles.headerTitle}>PRATHAM CAR CARE</Text>
            <Text style={styles.headerSub}>Garage Billing</Text>
          </Pressable>
          <View style={styles.headerActions}>
            {stack.length > 1 && (
              <Pressable onPress={() => pop()} style={styles.headerBtn}>
                <Text style={styles.headerBtnText}>‹ Back</Text>
              </Pressable>
            )}
            <Pressable onPress={handleLogout} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>Logout</Text>
            </Pressable>
          </View>
        </View>
      )}
      <View style={styles.screen}>
        {current.name === 'dashboard' && <DashboardScreen />}
        {current.name === 'billing' && (
          <BillingScreen
            existing={current.vehicle}
            onCancel={() => reset({ name: 'dashboard' })}
            onPreview={(invoice) => reset({ name: 'preview', invoice })}
          />
        )}
        {current.name === 'preview' && <PreviewScreen invoice={current.invoice} />}
        {current.name === 'history' && <HistoryScreen />}
        {current.name === 'detail' && <DetailScreen id={current.id} />}
        {current.name === 'settings' && <SettingsScreen />}
        {current.name === 'reminders' && <RemindersScreen />}
        {current.name === 'products' && <ProductsScreen />}
        {current.name === 'customerBills' && <CustomerBillsScreen vehicleId={current.vehicleId} />}
        {current.name === 'customers' && <CustomersScreen />}
        {current.name === 'daySheet' && <DaySheetScreen />}
        {current.name === 'expenses' && <ExpensesScreen />}
      </View>
    </View>
  )
}

export default function App() {
  return (
    <NavProvider>
      <ScreenHost />
    </NavProvider>
  )
}

const styles = StyleSheet.create({
  app: { flexGrow: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  centeredText: { color: colors.muted, fontSize: font.lg },
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#ffffff', fontSize: font.xl, fontWeight: '800', letterSpacing: 0.5 },
  headerSub: { color: '#93c5fd', fontSize: font.xs, fontWeight: '600', marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerBtnText: { color: '#ffffff', fontSize: font.sm, fontWeight: '600' },
  screen: { flexGrow: 1, maxWidth: 700, width: '100%', alignSelf: 'center' },
})