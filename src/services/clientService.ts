import api from '../lib/api'
import type { Client, PaginatedResponse, ClientQueryParams } from '../types'

export type CreateClientDto = Omit<Client, 'id' | 'createdAt'>

export const clientService = {
  // Lista completa (sin paginar) para dropdowns del modal de venta
  getAll: async (): Promise<Client[]> => {
    const { data } = await api.get<Client[]>('/client/all')
    return data
  },

  // Lista paginada y filtrable para la tabla de clientes
  getPage: async (
    params: ClientQueryParams = {}
  ): Promise<PaginatedResponse<Client>> => {
    const { data } = await api.get<PaginatedResponse<Client>>('/client', {
      params,
    })
    return data
  },

  getById: async (id: string): Promise<Client> => {
    const { data } = await api.get<Client>(`/client/${id}`)
    return data
  },

  create: async (client: CreateClientDto): Promise<Client> => {
    const { data } = await api.post<Client>('/client/create', client)
    return data
  },

  update: async (id: string, client: Partial<Client>): Promise<Client> => {
    const { data } = await api.patch<Client>(`/client/${id}`, client)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/client/${id}`)
  },
}
