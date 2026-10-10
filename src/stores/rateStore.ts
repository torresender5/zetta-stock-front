import { create } from 'zustand'
import {
  fetchOfficialRate,
  readCachedRate,
} from '../services/dolarService'

interface RateStore {
  rate: number | null
  rateDate: string | null
  loading: boolean
  error: string | null
  fetchRate: () => Promise<{ ok: boolean; error?: string }>
  refresh: () => Promise<{ ok: boolean; error?: string }>
  resetSession: () => void
}

function applyCached(set: (partial: Partial<RateStore>) => void): void {
  const cached = readCachedRate()
  if (cached) {
    set({
      rate: cached.rate,
      rateDate: cached.date || null,
      error: null,
    })
  }
}

export const useRateStore = create<RateStore>()((set, get) => ({
  rate: readCachedRate()?.rate ?? null,
  rateDate: readCachedRate()?.date ?? null,
  loading: false,
  error: null,

  fetchRate: async () => {
    set({ loading: true, error: null })
    try {
      const result = await fetchOfficialRate()
      set({
        rate: result.rate,
        rateDate: result.date || null,
        loading: false,
        error: null,
      })
      return { ok: true }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al obtener la tasa'
      applyCached(set)
      set({ loading: false, error: message })
      return { ok: false, error: message }
    }
  },

  refresh: async () => {
    const result = await get().fetchRate()
    return result
  },

  resetSession: () =>
    set({
      rate: readCachedRate()?.rate ?? null,
      rateDate: readCachedRate()?.date ?? null,
      loading: false,
      error: null,
    }),
}))

export function useRate(): number | null {
  return useRateStore((state) => state.rate)
}