import { create } from 'zustand'
import type { Client, PaginationMeta } from '../types'
import { clientService, type CreateClientDto } from '../services/clientService'

const emptyMeta: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 }

interface ClientStore {
  clients: Client[]
  allClients: Client[]
  meta: PaginationMeta
  loading: boolean
  error: string | null
  page: number
  limit: number
  search: string
  startDateFilter: string
  endDateFilter: string
  fetchClients: () => Promise<void>
  fetchClientsPage: () => Promise<void>
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSearch: (search: string) => void
  setStartDateFilter: (date: string) => void
  setEndDateFilter: (date: string) => void
  addClient: (client: CreateClientDto) => Promise<Client>
  updateClient: (id: string, client: Partial<Client>) => Promise<void>
  deleteClient: (id: string) => Promise<void>
}

export const useClientStore = create<ClientStore>()((set, get) => ({
  clients: [],
  allClients: [],
  meta: emptyMeta,
  loading: false,
  error: null,
  page: 1,
  limit: 10,
  search: '',
  startDateFilter: '',
  endDateFilter: '',

  fetchClients: async () => {
    try {
      const allClients = await clientService.getAll()
      set({ allClients })
    } catch {
      // El dropdown puede degradar a lista vacía sin bloquear la UI
      set({ allClients: [] })
    }
  },

  fetchClientsPage: async () => {
    const { page, limit, search, startDateFilter, endDateFilter } = get()
    set({ loading: true, error: null })
    try {
      const { data, meta } = await clientService.getPage({
        page,
        limit,
        search: search || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
      })
      set({ clients: data, meta, loading: false })
    } catch (error) {
      set({ error: 'Error al cargar clientes', loading: false })
    }
  },

  setPage: (page) => {
    set({ page })
    get().fetchClientsPage()
  },

  setLimit: (limit) => {
    set({ limit, page: 1 })
    get().fetchClientsPage()
  },

  setSearch: (search) => {
    set({ search, page: 1 })
    get().fetchClientsPage()
  },

  setStartDateFilter: (startDateFilter) => {
    set({ startDateFilter, page: 1 })
    get().fetchClientsPage()
  },

  setEndDateFilter: (endDateFilter) => {
    set({ endDateFilter, page: 1 })
    get().fetchClientsPage()
  },

  addClient: async (client) => {
    set({ loading: true, error: null })
    try {
      const newClient = await clientService.create(client)
      set((state) => ({
        clients: [...state.clients, newClient],
        allClients: [...state.allClients, newClient],
        loading: false,
      }))
      return newClient
    } catch (error) {
      set({ error: 'Error al crear cliente', loading: false })
      throw error
    }
  },

  updateClient: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const updated = await clientService.update(id, updates)
      set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? updated : c)),
        allClients: state.allClients.map((c) => (c.id === id ? updated : c)),
        loading: false,
      }))
    } catch (error) {
      set({ error: 'Error al actualizar cliente', loading: false })
      throw error
    }
  },

  deleteClient: async (id) => {
    set({ loading: true, error: null })
    try {
      await clientService.delete(id)
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== id),
        allClients: state.allClients.filter((c) => c.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: 'Error al eliminar cliente', loading: false })
      throw error
    }
  },
}))