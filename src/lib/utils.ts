import { useAuthStore } from '../stores/authStore'

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

export function generateProductCode(): string {
  const now = new Date()
  const year = now.getFullYear()
  const seq = Math.floor(Math.random() * 9000) + 1000
  return `PROD-${year}-${seq}`
}

export function generateInvoiceNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const seq = Math.floor(Math.random() * 9000) + 1000
  return `FAC-${year}-${seq}`
}

export function formatCurrency(amount: number): string {
  return formatUsd(amount)
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatVes(amount: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCop(amount: number): string {
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

export function sanitizeMoneyInput(raw: string): string {
  let s = raw.replace(/[^\d.,]/g, '')
  const comma = s.indexOf(',')
  if (comma !== -1) s = s.slice(0, comma) + '.' + s.slice(comma + 1).replace(/,/g, '')
  const parts = s.split('.')
  if (parts.length > 2) parts.splice(2)
  if (parts[1] !== undefined && parts[1].length > 2) parts[1] = parts[1].slice(0, 2)
  return parts.length === 1 ? parts[0] : parts.join('.')
}

export function parseMoney(value: string): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * % de IVA en formato decimal (0-1) según la configuración de la empresa
 * (Settings → % IVA). Fuera de sesión o sin configurar: 19%.
 */
export function getTaxRate(): number {
  const rate = useAuthStore.getState().user?.companyTaxRate
  return typeof rate === 'number' && rate >= 0 && rate <= 100 ? rate / 100 : 0.19
}

/** Descarga un Blob como archivo (PDF/XLSX) usando un enlace temporal. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Fecha relativa legible: "ahora", "hace 5 min", "ayer", "hace 3 días"… */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days} días`
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  })
}
