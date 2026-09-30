import axios from 'axios'

export interface OfficialDollarRate {
  moneda: string
  fuente: string
  nombre: string
  compra: number | null
  venta: number | null
  promedio: number
  fechaActualizacion: string
}

const RATE_URL = 'https://ve.dolarapi.com/v1/dolares/oficial'

const STORAGE_KEY = 'dolar-rate'

// Tasa de respaldo configurable (usada si la API no responde y no hay cache)
export const DEFAULT_USD_VES_RATE = Number(
  import.meta.env.VITE_USD_VES_RATE || 0,
)

export interface CachedRate {
  rate: number
  date: string
  fetchedAt: number
}

export function readCachedRate(): CachedRate | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedRate
    if (typeof parsed.rate !== 'number' || parsed.rate <= 0) return null
    return parsed
  } catch {
    return null
  }
}

export function saveCachedRate(rate: number, date: string): void {
  try {
    const cached: CachedRate = { rate, date, fetchedAt: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))
  } catch {
    // storage no disponible: ignorar
  }
}

export async function fetchOfficialRate(): Promise<CachedRate> {
  const cached = readCachedRate()
  try {
    const { data } = await axios.get<OfficialDollarRate>(RATE_URL, {
      timeout: 8000,
    })
    if (typeof data.promedio === 'number' && data.promedio > 0) {
      const result: CachedRate = {
        rate: data.promedio,
        date: data.fechaActualizacion,
        fetchedAt: Date.now(),
      }
      saveCachedRate(result.rate, result.date)
      return result
    }
  } catch {
    // Si falla la red, usamos la caché o el fallback
  }
  if (cached) {
    return cached
  }
  if (DEFAULT_USD_VES_RATE > 0) {
    return { rate: DEFAULT_USD_VES_RATE, date: '', fetchedAt: Date.now() }
  }
  throw new Error(
    'No se pudo obtener la tasa de cambio y no hay una tasa de respaldo disponible',
  )
}