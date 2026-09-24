import { create } from 'zustand'
import type { Purchase, PurchaseItem, PaginationMeta } from '../types'
import { purchaseService } from '../services/purchaseService'
import { useProductStore } from './productStore'

const emptyMeta: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 }

interface PurchaseStore {
  purchases: Purchase[]
  purchase: Purchase | null
  meta: PaginationMeta
  loading: boolean
  error: string | null
  page: number
  limit: number
  search: string
  supplierFilter: string
  paymentStatusFilter: '' | 'paid' | 'pending'
  startDateFilter: string
  endDateFilter: string
  fetchPurchases: () => Promise<void>
  fetchPurchaseById: (id: string) => Promise<void>
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSearch: (search: string) => void
  setSupplierFilter: (supplierId: string) => void
  setPaymentStatusFilter: (status: '' | 'paid' | 'pending') => void
  setStartDateFilter: (date: string) => void
  setEndDateFilter: (date: string) => void
  addPurchase: (supplierId: string, date: string, items: PurchaseItem[], paymentStatus: 'paid' | 'pending') => Promise<void>
  updatePurchasePaymentStatus: (id: string, status: 'paid' | 'pending') => Promise<void>
}

export const usePurchaseStore = create<PurchaseStore>()((set, get) => ({
  purchases: [],
  purchase: null,
  meta: emptyMeta,
  loading: false,
  error: null,
  page: 1,
  limit: 10,
  search: '',
  supplierFilter: '',
  paymentStatusFilter: '',
  startDateFilter: '',
  endDateFilter: '',

  fetchPurchases: async () => {
    const { page, limit, search, supplierFilter, paymentStatusFilter, startDateFilter, endDateFilter } = get()
    set({ loading: true, error: null })
    try {
      const { data, meta } = await purchaseService.getAll({
        page,
        limit,
        search: search || undefined,
        supplierId: supplierFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
      })
      set({ purchases: data, meta, loading: false })
    } catch {
      set({ error: 'Error al cargar compras', loading: false })
    }
  },

  fetchPurchaseById: async (id: string) => {
    set({ loading: true, error: null, purchase: null })
    try {
      const purchase = await purchaseService.getById(id)
      set({ purchase, loading: false })
    } catch (error) {
      const message =
        (error as { response?: { status?: number } })?.response?.status === 404
          ? 'La compra no existe o no tienes acceso a ella.'
          : 'Error al cargar la compra'
      set({ error: message, loading: false })
      throw error
    }
  },

  setPage: (page) => {
    set({ page })
    get().fetchPurchases()
  },

  setLimit: (limit) => {
    set({ limit, page: 1 })
    get().fetchPurchases()
  },

  setSearch: (search) => {
    set({ search, page: 1 })
    get().fetchPurchases()
  },

  setSupplierFilter: (supplierFilter) => {
    set({ supplierFilter, page: 1 })
    get().fetchPurchases()
  },

  setPaymentStatusFilter: (paymentStatusFilter) => {
    set({ paymentStatusFilter, page: 1 })
    get().fetchPurchases()
  },

  setStartDateFilter: (startDateFilter) => {
    set({ startDateFilter, page: 1 })
    get().fetchPurchases()
  },

  setEndDateFilter: (endDateFilter) => {
    set({ endDateFilter, page: 1 })
    get().fetchPurchases()
  },

  addPurchase: async (supplierId, date, items, paymentStatus) => {
    set({ loading: true, error: null })
    try {
      await purchaseService.create({
        supplierId,
        date,
        items,
        paymentStatus,
      })
      // El API ya incrementa el stock en transacción; solo refrescamos productos
      const { fetchAllProducts } = useProductStore.getState()
      await fetchAllProducts()
      set({ loading: false })
      await get().fetchPurchases()
    } catch {
      set({ error: 'Error al registrar compra', loading: false })
      throw new Error('Error al registrar compra')
    }
  },

  updatePurchasePaymentStatus: async (id, status) => {
    set({ loading: true, error: null })
    try {
      const updated = await purchaseService.updatePaymentStatus(id, status)
      set((state) => ({
        purchases: state.purchases.map((p) => (p.id === id ? updated : p)),
        loading: false,
      }))
    } catch {
      set({ error: 'Error al actualizar estado de pago', loading: false })
      throw new Error('Error al actualizar estado de pago')
    }
  },
}))