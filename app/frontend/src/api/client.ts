const BASE = ''

function resolveURL(path: string): string {
  if (BASE) return `${BASE}${path}`
  // Serve at domain root or any subdirectory (/prathamcarcare/): resolve the API
  // relative to the current page so /api/* works from wherever index.html lives.
  return new URL(path.replace(/^\/+/, ''), document.baseURI).href
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(resolveURL(path), {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...opts.headers as Record<string, string> },
    ...opts,
  })
  const json = await res.json()
  if (!res.ok) throw new Error((json as { error?: string }).error || `HTTP ${res.status}`)
  return json as T
}

export interface CatalogItem {
  id: number
  name: string
  price: number
  sort_order: number
}

export interface Vehicle {
  id: number
  plate_number: string
  owner_name: string
  owner_phone: string
  bill_count?: number
}

export interface InvoiceListItem {
  id: number
  bill_ref: string
  total_amount: string
  km_reading: string | null
  next_service_km: string | null
  next_service_date: string | null
  created_at: string
  plate_number: string
  owner_name: string
  owner_phone: string
}

export interface InvoiceItem {
  id: number
  invoice_id: number
  product_name: string
  quantity: number
  unit_rate: number
  charged_amount: number
}

export interface InvoiceDetail extends InvoiceListItem {
  bill_ref: string
  amount_in_words: string
  items: InvoiceItem[]
}

export interface CustomerBill {
  id: number
  bill_ref: string
  total_amount: string
  km_reading: string | null
  next_service_km: string | null
  next_service_date: string | null
  created_at: string
}

export interface Settings {
  app_name: string
  shop_phone: string
  google_place_id: string
  reminder_days_before: number
  gst_enabled: boolean
  company_name: string
  company_address: string
  company_phone: string
  company_email: string
  company_gstin: string
  company_pan: string
}

export interface ReminderItem {
  invoice_id: number
  vehicle_id: number
  next_service_date: string
  created_at: string
  plate_number: string
  owner_name: string
  owner_phone: string
  reminded: number
  days: number
  status: 'overdue' | 'today' | 'upcoming'
}

export interface DaySheetItem {
  product_name: string
  qty: string
  total: string
}

export interface Expense {
  id: number
  description: string
  category: string
  amount: string
  expense_date: string
}

export interface DaySheet {
  date: string
  bills: number
  billed_total: number
  items: DaySheetItem[]
  expenses: Expense[]
  expense_total: number
  net: number
}

export interface InvoiceInput {
  plate_number: string
  owner_name: string
  owner_phone: string
  km_reading: string
  next_service_km: string
  next_service_date: string
  items: Array<{ product_name: string; quantity: number; unit_rate: number }>
}

export const api = {
  login: (pin: string) => request<{ authed: boolean }>('/api/login', { method: 'POST', body: JSON.stringify({ pin }) }),

  me: () => request<{ authed: boolean }>('/api/me'),

  logout: () => request<{ ok: boolean }>('/api/logout', { method: 'POST' }),

  catalog: () => request<{ items: CatalogItem[] }>('/api/catalog'),

  addCatalogItem: (data: { name: string; price: number }) =>
    request<{ ok: boolean; id: number }>('/api/catalog', { method: 'POST', body: JSON.stringify(data) }),

  updateCatalogItem: (id: number, data: { name?: string; price?: number }) =>
    request<{ ok: boolean }>(`/api/catalog/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteCatalogItem: (id: number) =>
    request<{ ok: boolean }>(`/api/catalog/${id}`, { method: 'DELETE' }),

  searchVehicles: (q: string) => request<{ vehicles: Vehicle[] }>(`/api/vehicles?q=${encodeURIComponent(q)}`),

  getVehicleBills: (id: number) =>
    request<{ vehicle: Vehicle; bills: CustomerBill[] }>(`/api/vehicles/${id}/bills`),

  createInvoice: (data: InvoiceInput) =>
    request<{ id: number; bill_ref: string; total: number; vehicle_id: number }>('/api/invoices', { method: 'POST', body: JSON.stringify(data) }),

  updateInvoice: (id: number, data: InvoiceInput) =>
    request<{ id: number; bill_ref: string; total: number; vehicle_id: number }>(`/api/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  invoiceHistory: (options: { q?: string; from?: string; to?: string; month?: string; offset?: number } = {}) => {
    const params = new URLSearchParams({ offset: String(options.offset ?? 0) })
    if (options.q?.trim()) params.set('q', options.q.trim())
    if (options.from) params.set('from', options.from)
    if (options.to) params.set('to', options.to)
    if (options.month) params.set('month', options.month)
    return request<{ invoices: InvoiceListItem[]; total: number }>(`/api/invoices?${params.toString()}`)
  },

  getInvoice: (id: number) => request<InvoiceDetail>(`/api/invoices/${id}`),

  getSettings: () => request<Settings>('/api/settings'),

  updateSettings: (data: {
    new_pin?: string
    old_pin?: string
    shop_phone?: string
    google_place_id?: string
    reminder_days_before?: number
    gst_enabled?: boolean
    company_name?: string
    company_address?: string
    company_phone?: string
    company_email?: string
    company_gstin?: string
    company_pan?: string
  }) => request<Settings>('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),

  getReminders: () => request<{ reminders: ReminderItem[] }>('/api/reminders'),

  markReminderSent: (invoiceId: number) => request<{ ok: boolean }>(`/api/reminders/${invoiceId}/send`, { method: 'POST' }),

  allCustomers: (q = '', offset = 0) => {
    const params = new URLSearchParams({ offset: String(offset) })
    if (q.trim()) params.set('q', q.trim())
    return request<{ customers: (Vehicle & { bill_count: number })[]; total: number }>(`/api/customers?${params.toString()}`)
  },

  statsToday: () => request<{ date: string; bills: number; total: number; expenses: number; net: number }>('/api/stats/today'),

  daySheet: (date?: string) =>
    request<DaySheet>(`/api/stats/daysheet${date ? `?date=${encodeURIComponent(date)}` : ''}`),

  expenses: (opts: { date?: string; month?: string } = {}) => {
    const params = new URLSearchParams()
    if (opts.date) params.set('date', opts.date)
    if (opts.month) params.set('month', opts.month)
    const qs = params.toString()
    return request<{ items: Expense[]; total: number; categories: string[] }>(`/api/expenses${qs ? `?${qs}` : ''}`)
  },

  addExpense: (data: { description: string; category: string; amount: number; expense_date: string }) =>
    request<{ ok: boolean; id: number }>('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),

  deleteExpense: (id: number) =>
    request<{ ok: boolean }>(`/api/expenses/${id}`, { method: 'DELETE' }),
}