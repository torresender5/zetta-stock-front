import api from '../lib/api'
import type { Purchase, PurchaseItem, PaginatedResponse, PurchaseQueryParams } from '../types'

export interface CreatePurchaseDto {
  supplierId: string
  date: string
  items: PurchaseItem[]
  paymentStatus: 'paid' | 'pending'
}

export const purchaseService = {
  getAll: async (params: PurchaseQueryParams = {}): Promise<PaginatedResponse<Purchase>> => {
    const { data } = await api.get<PaginatedResponse<Purchase>>('/purchases', { params })
    return data
  },

  getById: async (id: string): Promise<Purchase> => {
    const { data } = await api.get<Purchase>(`/purchases/${id}`)
    return data
  },

  create: async (purchase: CreatePurchaseDto): Promise<Purchase> => {
    const { data } = await api.post<Purchase>('/purchases', purchase)
    return data
  },

  updatePaymentStatus: async (id: string, status: 'paid' | 'pending'): Promise<Purchase> => {
    const { data } = await api.patch<Purchase>(`/purchases/${id}`, { paymentStatus: status })
    return data
  },
}