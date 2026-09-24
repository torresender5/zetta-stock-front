import api from '../lib/api'
import type {
  Sale,
  SaleItem,
  Invoice,
  PaymentMethod,
  PaginatedResponse,
  SaleQueryParams,
} from '../types'

export interface CreateSaleDto {
  clientId: string
  date: string
  items: SaleItem[]
  paymentStatus: 'paid' | 'pending'
  paymentMethod: PaymentMethod
  receivedAmount?: number
}

export interface UpdateSaleStatusDto {
  paymentStatus: 'paid' | 'pending' | 'cancelled'
  cancelledReason?: string
  refundAmount?: number
  refundMethod?: string
  paymentMethod?: PaymentMethod
}

export interface SaleWithInvoice {
  sale: Sale
  invoice: Invoice
}

export const saleService = {
  getAll: async (): Promise<Sale[]> => {
    const limit = 100
    let page = 1
    let totalPages = 1
    const all: Sale[] = []
    do {
      const { data } = await api.get<PaginatedResponse<Sale>>('/sales', { params: { page, limit } })
      all.push(...data.data)
      totalPages = data.meta.totalPages
      page += 1
    } while (page <= totalPages)
    return all
  },

  getPage: async (params: SaleQueryParams): Promise<PaginatedResponse<Sale>> => {
    const { data } = await api.get<PaginatedResponse<Sale>>('/sales', { params })
    return data
  },

  getById: async (id: string): Promise<Sale> => {
    const { data } = await api.get<Sale>(`/sales/${id}`)
    return data
  },

  create: async (sale: CreateSaleDto): Promise<SaleWithInvoice> => {
    const { data } = await api.post<SaleWithInvoice>('/sales', sale)
    return data
  },

  updatePaymentStatus: async (id: string, body: UpdateSaleStatusDto): Promise<Sale> => {
    const { data } = await api.patch<Sale>(`/sales/${id}`, body)
    return data
  },
}

export const invoiceService = {
  getAll: async (): Promise<Invoice[]> => {
    const { data } = await api.get<Invoice[]>('/invoices')
    return data
  },

  updateStatus: async (id: string, status: 'paid' | 'pending'): Promise<Invoice> => {
    const { data } = await api.patch<Invoice>(`/invoices/${id}`, { status })
    return data
  },
}
