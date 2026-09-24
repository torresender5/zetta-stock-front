import { create } from 'zustand'
import type { Supplier, PaginationMeta } from '../types'
import { supplierService, type CreateSupplierDto } from '../services/supplierService'

const emptyMeta: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 }

interface SupplierStore {
  suppliers: Supplier[]
  allSuppliers: Supplier[]
  meta: PaginationMeta
  loading: boolean
  error: string | null
  page: number
  limit: number
  search: string
  startDateFilter: string
  endDateFilter: string
  fetchSuppliers: () => Promise<void>
  fetchAllSuppliers: () => Promise<void>
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSearch: (search: string) => void
  setStartDateFilter: (date: string) => void
  setEndDateFilter: (date: string) => void
  addSupplier: (supplier: CreateSupplierDto) => Promise<Supplier>
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>
  deleteSupplier: (id: string) => Promise<void>
}

export const useSupplierStore = create<SupplierStore>()((set, get) => ({
  suppliers: [],
  allSuppliers: [],
  meta: emptyMeta,
  loading: false,
  error: null,
  page: 1,
  limit: 10,
  search: '',
  startDateFilter: '',
  endDateFilter: '',

  fetchSuppliers: async () => {
    const { page, limit, search, startDateFilter, endDateFilter } = get()
    set({ loading: true, error: null })
    try {
      const { data, meta } = await supplierService.getAllPaginated({
        page,
        limit,
        search: search || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
      })
      set({ suppliers: data, meta, loading: false })
    } catch {
      set({ error: 'Error al cargar proveedores', loading: false })
    }
  },

  fetchAllSuppliers: async () => {
    try {
      const allSuppliers = await supplierService.getAll()
      set({ allSuppliers })
    } catch {
      // El dropdown puede degradar a lista vacía sin bloquear la UI
      set({ allSuppliers: [] })
    }
  },

  setPage: (page) => {
    set({ page })
    get().fetchSuppliers()
  },

  setLimit: (limit) => {
    set({ limit, page: 1 })
    get().fetchSuppliers()
  },

  setSearch: (search) => {
    set({ search, page: 1 })
    get().fetchSuppliers()
  },

  setStartDateFilter: (startDateFilter) => {
    set({ startDateFilter, page: 1 })
    get().fetchSuppliers()
  },

  setEndDateFilter: (endDateFilter) => {
    set({ endDateFilter, page: 1 })
    get().fetchSuppliers()
  },

  addSupplier: async (supplier) => {
    set({ loading: true, error: null })
    try {
      const newSupplier = await supplierService.create(supplier)
      set((state) => ({
        suppliers: [...state.suppliers, newSupplier],
        allSuppliers: [...state.allSuppliers, newSupplier],
        loading: false,
      }))
      return newSupplier
    } catch {
      set({ error: 'Error al crear proveedor', loading: false })
      throw new Error('Error al crear proveedor')
    }
  },

  updateSupplier: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const updated = await supplierService.update(id, updates)
      set((state) => ({
        suppliers: state.suppliers.map((s) => (s.id === id ? updated : s)),
        allSuppliers: state.allSuppliers.map((s) => (s.id === id ? updated : s)),
        loading: false,
      }))
    } catch {
      set({ error: 'Error al actualizar proveedor', loading: false })
      throw new Error('Error al actualizar proveedor')
    }
  },

  deleteSupplier: async (id) => {
    set({ loading: true, error: null })
    try {
      await supplierService.delete(id)
      set((state) => ({
        suppliers: state.suppliers.filter((s) => s.id !== id),
        allSuppliers: state.allSuppliers.filter((s) => s.id !== id),
        loading: false,
      }))
    } catch {
      set({ error: 'Error al eliminar proveedor', loading: false })
      throw new Error('Error al eliminar proveedor')
    }
  },
}))
