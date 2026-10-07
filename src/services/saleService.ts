import api from '../lib/api'
import { downloadBlob } from '../lib/utils'
import type {
  Sale,
  SaleItem,
  Invoice,
  InvoiceQueryParams,
  InvoiceStats,
  PaymentMethod,
  PaginatedResponse,
  SaleQueryParams,
} from '../types'

export interface CreateSaleDto {
  clientId?: string
  date: string
  items: SaleItem[]
  paymentStatus: 'paid' | 'pending'
  paymentMethod: PaymentMethod
  receivedAmount?: number
  fxRate?: number
}

export interface UpdateSaleStatusDto {
  paymentStatus: 'paid' | 'pending' | 'cancelled'
  cancelledReason?: string
  refundAmount?: number
  refundMethod?: string
  paymentMethod?: PaymentMethod
}

export interface UpdateSaleItemDto {
  productId: string
  productName: string
  size?: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface UpdateSaleDto {
  notes?: string
  clientId?: string
  date?: string
  paymentMethod?: PaymentMethod
  items?: UpdateSaleItemDto[]
}

export interface SaleWithInvoice {
  sale: Sale
  invoice: Invoice
}

export const saleService = {
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

  update: async (id: string, body: UpdateSaleDto): Promise<Sale> => {
    const { data } = await api.put<Sale>(`/sales/${id}`, body)
    return data
  },
}

export const invoiceService = {
  getPage: async (params: InvoiceQueryParams = {}): Promise<PaginatedResponse<Invoice>> => {
    const { data } = await api.get<PaginatedResponse<Invoice>>('/invoices', { params })
    return data
  },

  /** Conteos por estado (respeta búsqueda y fechas, no el filtro de estado). */
  getStats: async (params: Omit<InvoiceQueryParams, 'page' | 'limit' | 'status'> = {}): Promise<InvoiceStats> => {
    const { data } = await api.get<InvoiceStats>('/invoices/stats', { params })
    return data
  },

  exportPdf: async (id: string, invoiceNumber?: string): Promise<void> => {
    const { data } = await api.get<Blob>(`/invoices/${id}/export`, {
      params: { format: 'pdf' },
      responseType: 'blob',
    })
    downloadBlob(data, `factura-${invoiceNumber ?? id}.pdf`)
  },

  updateStatus: async (id: string, status: 'paid' | 'pending'): Promise<Invoice> => {
    const { data } = await api.patch<Invoice>(`/invoices/${id}`, { status })
    return data
  },
}
