export function formatINR(value: number | string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(n)) return '0.00'
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatQty(value: number): string {
  const n = Number(value)
  if (Number.isNaN(n) || n <= 0) return '1'
  return String(n)
}

export function todayShort(): string {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

export function toISODateString(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toISODateString(d)
}

export function addMonthsISO(months: number): string {
  const d = new Date()
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, lastDay))
  return toISODateString(d)
}

export function formatDate(input: string): string {
  if (!input) return input
  let d: Date
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    d = new Date(`${input}T00:00:00`) // date-only → local
  } else if (input.includes('T') || input.includes('Z') || /[+-]\d{2}:\d{2}$/.test(input)) {
    d = new Date(input)
  } else {
    d = new Date(input.replace(' ', 'T')) // Y-m-d H:i:s → local wall-clock
  }
  if (Number.isNaN(d.getTime())) return input
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}