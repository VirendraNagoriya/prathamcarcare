import type { Vehicle, InvoiceDetail } from './api/client'

export type Route =
  | { name: 'dashboard' }
  | { name: 'billing'; vehicle?: Vehicle; editId?: number }
  | { name: 'preview'; invoice: InvoiceDetail }
  | { name: 'history' }
  | { name: 'detail'; id: number }
  | { name: 'settings' }
  | { name: 'reminders' }
  | { name: 'products' }
  | { name: 'customerBills'; vehicleId: number }
  | { name: 'customers' }
  | { name: 'daySheet' }
  | { name: 'expenses' }

export interface NavState {
  stack: Route[]
  current: Route
  push: (route: Route) => void
  replace: (route: Route) => void
  pop: () => void
  reset: (route: Route) => void
}