import { create } from 'zustand'
import type { PaginationMeta, Ticket, TicketQueryParams, TicketStatus } from '../types'
import { ticketService, type CreateTicketDto } from '../services/ticketService'

const emptyMeta: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 }

interface TicketStore {
  tickets: Ticket[]
  meta: PaginationMeta
  loading: boolean
  error: string | null
  page: number
  limit: number
  search: string
  statusFilter: TicketStatus | ''
  fetchTicketsPage: () => Promise<void>
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSearch: (search: string) => void
  setStatusFilter: (status: TicketStatus | '') => void
  createTicket: (ticket: CreateTicketDto, image?: File | null) => Promise<Ticket>
  resetSession: () => void
}

export const useTicketStore = create<TicketStore>()((set, get) => ({
  tickets: [],
  meta: emptyMeta,
  loading: false,
  error: null,
  page: 1,
  limit: 10,
  search: '',
  statusFilter: '',

  fetchTicketsPage: async () => {
    const { page, limit, search, statusFilter } = get()
    set({ loading: true, error: null })
    try {
      const params: TicketQueryParams = { page, limit }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const { data, meta } = await ticketService.getPage(params)
      set({ tickets: data, meta, loading: false })
    } catch {
      set({ error: 'Error al cargar los tickets', loading: false })
    }
  },

  setPage: (page) => {
    set({ page })
    get().fetchTicketsPage()
  },

  setLimit: (limit) => {
    set({ limit, page: 1 })
    get().fetchTicketsPage()
  },

  setSearch: (search) => {
    set({ search, page: 1 })
    get().fetchTicketsPage()
  },

  setStatusFilter: (statusFilter) => {
    set({ statusFilter, page: 1 })
    get().fetchTicketsPage()
  },

  createTicket: async (ticket, image) => {
    set({ loading: true, error: null })
    try {
      const newTicket = await ticketService.create(ticket, image)
      set({ loading: false, page: 1, search: '', statusFilter: '' })
      await get().fetchTicketsPage()
      return newTicket
    } catch {
      set({ error: 'Error al crear el ticket', loading: false })
      throw new Error('Error al crear el ticket')
    }
  },

  resetSession: () =>
    set({
      tickets: [],
      meta: emptyMeta,
      loading: false,
      error: null,
      page: 1,
      limit: 10,
      search: '',
      statusFilter: '',
    }),
}))
