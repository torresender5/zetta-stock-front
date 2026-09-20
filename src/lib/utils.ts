export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

export function generateInvoiceNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const seq = Math.floor(Math.random() * 9000) + 1000
  return `FAC-${year}-${seq}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function todayLocal(): string {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${mm}-${dd}`
}

export function formatDateOnly(dateStr: string | Date): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return `${d.getUTCDate()} ${d.toLocaleString('es-CO', {
    month: 'short',
    timeZone: 'UTC',
  })} ${d.getUTCFullYear()}`
}

export function dateOnlyToLocal(dateStr: string | Date): Date {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return d
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

export const TAX_RATE = 0.19 // IVA 19%

export const CATEGORIES = [
  'Electrónica',
  'Ropa',
  'Alimentos',
  'Hogar',
  'Salud',
  'Deportes',
  'Belleza',
  'Otros',
]
