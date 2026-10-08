import api from '../lib/api'
import type {
  PaginatedResponse,
  Ticket,
  TicketCategory,
  TicketQueryParams,
  TicketStatus,
} from '../types'

export interface CreateTicketDto {
  subject: string
  category: TicketCategory
  body: string
}

export const ticketService = {
  getPage: async (
    params: TicketQueryParams = {}
  ): Promise<PaginatedResponse<Ticket>> => {
    const { data } = await api.get<PaginatedResponse<Ticket>>('/tickets', {
      params,
    })
    return data
  },

  getById: async (id: string): Promise<Ticket> => {
    const { data } = await api.get<Ticket>(`/tickets/${id}`)
    return data
  },

  // La imagen va como multipart opcional junto al mensaje inicial.
  create: async (ticket: CreateTicketDto, image?: File | null): Promise<Ticket> => {
    if (image) {
      const form = new FormData()
      form.append('subject', ticket.subject)
      form.append('category', ticket.category)
      form.append('body', ticket.body)
      form.append('image', image)
      const { data } = await api.post<Ticket>('/tickets/create', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    }
    const { data } = await api.post<Ticket>('/tickets/create', ticket)
    return data
  },

  addMessage: async (id: string, body: string): Promise<Ticket> => {
    const { data } = await api.post<Ticket>(`/tickets/${id}/messages`, { body })
    return data
  },

  updateStatus: async (id: string, status: TicketStatus): Promise<Ticket> => {
    const { data } = await api.patch<Ticket>(`/tickets/${id}/status`, { status })
    return data
  },
}
