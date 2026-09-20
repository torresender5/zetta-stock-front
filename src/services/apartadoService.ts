import api from '../lib/api'
import type {
  Apartado,
  ApartadoStatus,
  PaymentMethod,
  PaginatedResponse,
  Sale,
} from '../types'

export interface CreateApartadoItemDto {
  productId: string
  quantity: number
  size?: string
  unitPrice?: number
}

export interface CreateApartadoDto {
  clientId: string
  date: string
  items: CreateApartadoItemDto[]
  initialPayment?: number
  initialPaymentMethod?: PaymentMethod
  dueDate?: string
  notes?: string
}

export interface AddApartadoPaymentDto {
  amount: number
  paymentMethod?: PaymentMethod
}

export interface CompleteApartadoDto {
  paymentMethod?: PaymentMethod
}

export interface CancelApartadoDto {
  reason?: string
  refundMethod?: PaymentMethod
}

export interface ApartadoPaymentResult {
  apartadoId: string | number
  status: ApartadoStatus
  totalPaid?: number
  remaining?: number
  sale?: Sale
}

export interface CompleteApartadoResult {
  apartadoId: string | number
  status: ApartadoStatus
  sale: Sale
}

export interface ListApartadosParams {
  status?: ApartadoStatus
  page?: number
  limit?: number
}

export const apartadoService = {
  getPage: async (
    params: ListApartadosParams,
  ): Promise<PaginatedResponse<Apartado>> => {
    const { data } = await api.get<PaginatedResponse<Apartado>>('/apartados', {
      params,
    })
    return data
  },

  getAll: async (status?: ApartadoStatus): Promise<Apartado[]> => {
    const limit = 100
    let page = 1
    let totalPages = 1
    const all: Apartado[] = []
    do {
      const { data } = await api.get<PaginatedResponse<Apartado>>('/apartados', {
        params: { status, page, limit },
      })
      all.push(...data.data)
      totalPages = data.meta.totalPages
      page += 1
    } while (page <= totalPages)
    return all
  },

  getById: async (id: string): Promise<Apartado> => {
    const { data } = await api.get<Apartado>(`/apartados/${id}`)
    return data
  },

  create: async (body: CreateApartadoDto): Promise<Apartado> => {
    const { data } = await api.post<Apartado>('/apartados', body)
    return data
  },

  addPayment: async (
    id: string,
    body: AddApartadoPaymentDto,
  ): Promise<ApartadoPaymentResult> => {
    const { data } = await api.post<ApartadoPaymentResult>(
      `/apartados/${id}/payments`,
      body,
    )
    return data
  },

  complete: async (
    id: string,
    body: CompleteApartadoDto,
  ): Promise<CompleteApartadoResult> => {
    const { data } = await api.post<CompleteApartadoResult>(
      `/apartados/${id}/complete`,
      body,
    )
    return data
  },

  cancel: async (id: string, body: CancelApartadoDto): Promise<Apartado> => {
    const { data } = await api.post<Apartado>(`/apartados/${id}/cancel`, body)
    return data
  },
}