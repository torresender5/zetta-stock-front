import { create } from 'zustand'
import type {
  Apartado,
  ApartadoStatus,
  PaginationMeta,
  PaymentMethod,
} from '../types'
import {
  apartadoService,
  type CreateApartadoDto,
} from '../services/apartadoService'
import { useProductStore } from './productStore'

const emptyMeta: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 }

interface ApartadoStore {
  apartados: Apartado[]
  meta: PaginationMeta
  page: number
  limit: number
  statusFilter: ApartadoStatus | ''
  apartado: Apartado | null
  loading: boolean
  error: string | null
  fetchApartados: () => Promise<void>
  fetchApartadoById: (id: string) => Promise<void>
  setPage: (page: number) => void
  setStatusFilter: (status: ApartadoStatus | '') => void
  createApartado: (
    data: CreateApartadoDto,
  ) => Promise<{ ok: boolean; error?: string; apartado?: Apartado }>
  addPayment: (
    id: string,
    amount: number,
    paymentMethod: PaymentMethod,
  ) => Promise<{ ok: boolean; error?: string }>
  completeApartado: (
    id: string,
    paymentMethod: PaymentMethod,
  ) => Promise<{ ok: boolean; error?: string }>
  cancelApartado: (
    id: string,
    reason?: string,
    refundMethod?: PaymentMethod,
  ) => Promise<{ ok: boolean; error?: string }>
}

export const useApartadoStore = create<ApartadoStore>()((set, get) => ({
  apartados: [],
  meta: emptyMeta,
  page: 1,
  limit: 10,
  statusFilter: '',
  apartado: null,
  loading: false,
  error: null,

  fetchApartados: async () => {
    const { page, limit, statusFilter } = get()
    set({ loading: true, error: null })
    try {
      const { data, meta } = await apartadoService.getPage({
        page,
        limit,
        status: statusFilter || undefined,
      })
      set({ apartados: data, meta, loading: false })
    } catch {
      set({ error: 'Error al cargar apartados', loading: false })
    }
  },

  fetchApartadoById: async (id) => {
    set({ loading: true, error: null, apartado: null })
    try {
      const apartado = await apartadoService.getById(id)
      set({ apartado, loading: false })
    } catch (error) {
      const message =
        (error as { response?: { status?: number } })?.response?.status === 404
          ? 'El apartado no existe o no tienes acceso a él.'
          : 'Error al cargar el apartado'
      set({ error: message, loading: false })
      throw error
    }
  },

  setPage: (page) => {
    set({ page })
    get().fetchApartados()
  },

  setStatusFilter: (statusFilter) => {
    set({ statusFilter, page: 1 })
    get().fetchApartados()
  },

  createApartado: async (data) => {
    set({ loading: true, error: null })
    try {
      const apartado = await apartadoService.create(data)
      await useProductStore.getState().fetchAllProducts()
      set({ loading: false })
      await get().fetchApartados()
      return { ok: true, apartado }
    } catch (err) {
      const message = getErrorMessage(err, 'Error al crear el apartado')
      set({ error: message, loading: false })
      return { ok: false, error: message }
    }
  },

  addPayment: async (id, amount, paymentMethod) => {
    set({ loading: true, error: null })
    try {
      await apartadoService.addPayment(id, { amount, paymentMethod })
      set({ loading: false })
      await get().fetchApartadoById(id)
      await get().fetchApartados()
      return { ok: true }
    } catch (err) {
      const message = getErrorMessage(err, 'Error al registrar el abono')
      set({ error: message, loading: false })
      return { ok: false, error: message }
    }
  },

  completeApartado: async (id, paymentMethod) => {
    set({ loading: true, error: null })
    try {
      await apartadoService.complete(id, { paymentMethod })
      set({ loading: false })
      await get().fetchApartadoById(id)
      await get().fetchApartados()
      return { ok: true }
    } catch (err) {
      const message = getErrorMessage(err, 'Error al completar el apartado')
      set({ error: message, loading: false })
      return { ok: false, error: message }
    }
  },

  cancelApartado: async (id, reason, refundMethod) => {
    set({ loading: true, error: null })
    try {
      await apartadoService.cancel(id, {
        reason,
        refundMethod,
      })
      await useProductStore.getState().fetchAllProducts()
      set({ loading: false })
      await get().fetchApartadoById(id)
      await get().fetchApartados()
      return { ok: true }
    } catch (err) {
      const message = getErrorMessage(err, 'Error al cancelar el apartado')
      set({ error: message, loading: false })
      return { ok: false, error: message }
    }
  },
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