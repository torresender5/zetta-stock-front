import api from '../lib/api'
import type {
  CashRegister,
  CashRegisterSummary,
  CashMovement,
  PaginatedResponse,
  PaymentMethod,
} from '../types'

export interface OpenCashRegisterDto {
  baseAmount: number
  name?: string
}

export interface CreateCashMovementDto {
  type: 'expense' | 'withdrawal' | 'deposit'
  paymentMethod: PaymentMethod
  amount: number
  description?: string
}

export interface CloseCashRegisterDto {
  cash?: number
  card?: number
  transfer?: number
  credit?: number
}

export interface ListCashRegistersParams {
  status?: 'open' | 'closed'
  page?: number
  limit?: number
}

export const cashRegisterService = {
  getActive: async (): Promise<CashRegister | null> => {
    const { data } = await api.get<CashRegister>('/cash-registers/active')
    return data
  },

  getAll: async (
    params: ListCashRegistersParams,
  ): Promise<PaginatedResponse<CashRegister>> => {
    const { data } = await api.get<PaginatedResponse<CashRegister>>(
      '/cash-registers',
      { params },
    )
    return data
  },

  getById: async (id: string | number): Promise<CashRegister> => {
    const { data } = await api.get<CashRegister>(`/cash-registers/${id}`)
    return data
  },

  open: async (body: OpenCashRegisterDto): Promise<CashRegister> => {
    const { data } = await api.post<CashRegister>('/cash-registers/open', body)
    return data
  },

  close: async (
    id: string | number,
    body: CloseCashRegisterDto,
  ): Promise<CashRegister> => {
    const { data } = await api.post<CashRegister>(
      `/cash-registers/${id}/close`,
      body,
    )
    return data
  },

  addMovement: async (
    id: string | number,
    body: CreateCashMovementDto,
  ): Promise<CashMovement> => {
    const { data } = await api.post<CashMovement>(
      `/cash-registers/${id}/movements`,
      body,
    )
    return data
  },

  getSummary: async (id: string | number): Promise<CashRegisterSummary> => {
    const { data } = await api.get<CashRegisterSummary>(
      `/cash-registers/${id}/summary`,
    )
    return data
  },
}