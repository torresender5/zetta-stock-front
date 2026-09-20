import { create } from 'zustand'
import type { CashRegister, CashRegisterSummary } from '../types'
import {
  cashRegisterService,
  type CreateCashMovementDto,
  type OpenCashRegisterDto,
} from '../services/cajaService'

interface CajaStore {
  active: CashRegister | null
  summary: CashRegisterSummary | null
  registers: CashRegister[]
  loading: boolean
  error: string | null
  fetchActive: () => Promise<void>
  fetchSummary: (id: string) => Promise<void>
  fetchRegisters: (status?: 'open' | 'closed') => Promise<void>
  fetchDetail: (id: string) => Promise<CashRegister | null>
  openRegister: (
    data: OpenCashRegisterDto,
  ) => Promise<{ ok: boolean; error?: string }>
  closeRegister: (body: {
    cash?: number
    card?: number
    transfer?: number
    credit?: number
  }) => Promise<{ ok: boolean; error?: string }>
  addMovement: (
    body: CreateCashMovementDto,
  ) => Promise<{ ok: boolean; error?: string }>
  clearActive: () => void
}

export const useCajaStore = create<CajaStore>()((set, get) => ({
  active: null,
  summary: null,
  registers: [],
  loading: false,
  error: null,

  fetchActive: async () => {
    set({ loading: true, error: null })
    try {
      const active = await cashRegisterService.getActive()
      set({ active, loading: false })
      if (active) {
        await get().fetchSummary(active.id)
      } else {
        set({ summary: null })
      }
    } catch {
      set({ error: 'Error al consultar la caja activa', loading: false })
    }
  },

  fetchSummary: async (id) => {
    try {
      const summary = await cashRegisterService.getSummary(id)
      set({ summary })
    } catch {
      set({ error: 'Error al consultar el resumen de caja' })
    }
  },

  fetchRegisters: async (status) => {
    set({ loading: true, error: null })
    try {
      const { data } = await cashRegisterService.getAll({
        status,
        page: 1,
        limit: 50,
      })
      set({ registers: data, loading: false })
    } catch {
      set({ error: 'Error al cargar el historial de cajas', loading: false })
    }
  },

  fetchDetail: async (id) => {
    set({ loading: true, error: null })
    try {
      const detail = await cashRegisterService.getById(id)
      set({ loading: false })
      return detail
    } catch {
      set({ error: 'Error al consultar la caja', loading: false })
      return null
    }
  },

  openRegister: async (data) => {
    set({ loading: true, error: null })
    try {
      const active = await cashRegisterService.open(data)
      set({ active, loading: false })
      await get().fetchSummary(active.id)
      return { ok: true }
    } catch (err) {
      const message = getErrorMessage(err, 'Error al abrir la caja')
      set({ error: message, loading: false })
      return { ok: false, error: message }
    }
  },

  closeRegister: async (body) => {
    const { active } = get()
    if (!active) return { ok: false, error: 'No hay caja abierta' }
    set({ loading: true, error: null })
    try {
      await cashRegisterService.close(active.id, body)
      set({ active: null, summary: null, loading: false })
      await get().fetchRegisters('closed')
      return { ok: true }
    } catch (err) {
      const message = getErrorMessage(err, 'Error al cerrar la caja')
      set({ error: message, loading: false })
      return { ok: false, error: message }
    }
  },

  addMovement: async (body) => {
    const { active } = get()
    if (!active) return { ok: false, error: 'No hay caja abierta' }
    set({ loading: true, error: null })
    try {
      await cashRegisterService.addMovement(active.id, body)
      set({ loading: false })
      await get().fetchActive()
      return { ok: true }
    } catch (err) {
      const message = getErrorMessage(err, 'Error al registrar el movimiento')
      set({ error: message, loading: false })
      return { ok: false, error: message }
    }
  },

  clearActive: () => set({ active: null, summary: null }),
}))

function getErrorMessage(err: unknown, fallback: string): string {
  const msg = (
    err as {
      response?: { data?: { message?: string | string[] } }
    }
  )?.response?.data?.message
  if (typeof msg === 'string') return msg
  if (Array.isArray(msg)) return msg.join(', ')
  return fallback
}