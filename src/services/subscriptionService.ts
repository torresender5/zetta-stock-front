import api from '../lib/api'
import type { MySubscriptionResponse, PaymentOrder, Plan, Subscription } from '../types'

export interface PurchaseResult {
  subscription: Subscription | null
  order: PaymentOrder | null
}

export const subscriptionService = {
  getPlans: async (): Promise<Plan[]> => {
    const { data } = await api.get<Plan[]>('/plans')
    return data
  },

  getMySubscription: async (): Promise<MySubscriptionResponse> => {
    const { data } = await api.get<MySubscriptionResponse>('/subscription/me')
    return data
  },

  purchase: async (planId: number, period: 'monthly' | 'yearly'): Promise<PurchaseResult> => {
    const { data } = await api.post<PurchaseResult>('/subscription/purchase', { planId, period })
    return data
  },

  // ---------- Superadmin ----------
  getAllPlans: async (): Promise<Plan[]> => {
    const { data } = await api.get<Plan[]>('/admin/plans')
    return data
  },

  createPlan: async (plan: Partial<Plan>): Promise<Plan> => {
    const { data } = await api.post<Plan>('/admin/plans', plan)
    return data
  },

  updatePlan: async (id: number, plan: Partial<Plan>): Promise<Plan> => {
    const { data } = await api.patch<Plan>(`/admin/plans/${id}`, plan)
    return data
  },

  deletePlan: async (id: number): Promise<void> => {
    await api.delete(`/admin/plans/${id}`)
  },

  getPaymentOrders: async (): Promise<
    (PaymentOrder & { companyId: number; companyName: string })[]
  > => {
    const { data } = await api.get('/admin/payment-orders')
    return data
  },

  confirmPaymentOrder: async (id: number): Promise<void> => {
    await api.post(`/admin/payment-orders/${id}/confirm`)
  },

  rejectPaymentOrder: async (id: number): Promise<void> => {
    await api.post(`/admin/payment-orders/${id}/reject`)
  },

  getSubscriptions: async (): Promise<
    {
      id: number
      companyId: number
      companyName: string
      status: string
      period: string
      price: number
      effectiveEnd: string | null
      plan: Plan
      userCount: number
    }[]
  > => {
    const { data } = await api.get('/admin/subscriptions')
    return data
  },
}