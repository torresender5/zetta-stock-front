import api from '../lib/api'
import type {
  MySubscriptionResponse,
  PaymentDetails,
  PaymentMethods,
  PaymentOrder,
  PaymentProofPayload,
  PaymentVerificationResult,
  Plan,
  Subscription,
} from '../types'

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

  purchase: async (
    planId: number,
    period: 'monthly' | 'yearly',
    provider?: 'stripe' | 'pabilo' | 'manual',
    acceptedTerms?: boolean,
    fxRate?: number,
  ): Promise<PurchaseResult> => {
    const { data } = await api.post<PurchaseResult>('/subscription/purchase', {
      planId,
      period,
      ...(provider ? { provider } : {}),
      ...(acceptedTerms !== undefined ? { acceptedTerms } : {}),
      ...(fxRate ? { fxRate } : {}),
    })
    return data
  },

  getPaymentMethods: async (): Promise<PaymentMethods> => {
    const { data } = await api.get<PaymentMethods>('/subscription/payment-methods')
    return data
  },

  getPaymentDetails: async (): Promise<PaymentDetails> => {
    const { data } = await api.get<PaymentDetails>('/subscription/payment-details')
    return data
  },

  submitPaymentProof: async (
    orderId: number,
    payload: PaymentProofPayload,
    file: File,
  ): Promise<PaymentVerificationResult> => {
    const form = new FormData()
    form.append('image', file)
    form.append('bankReference', payload.bankReference)
    form.append('paymentMethod', payload.paymentMethod)
    if (payload.paymentDate) form.append('paymentDate', payload.paymentDate)
    if (payload.payerDni) form.append('payerDni', payload.payerDni)
    if (payload.payerPhone) form.append('payerPhone', payload.payerPhone)
    if (payload.payerBankCode) form.append('payerBankCode', payload.payerBankCode)
    const { data } = await api.post<PaymentVerificationResult>(
      `/subscription/payment-orders/${orderId}/proof`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  },

  reverifyPaymentProof: async (
    orderId: number,
  ): Promise<PaymentVerificationResult> => {
    const { data } = await api.post<PaymentVerificationResult>(
      `/subscription/payment-orders/${orderId}/reverify`,
    )
    return data
  },

  // ---------- Superadmin ----------
  getPaymentSettings: async (): Promise<PaymentDetails> => {
    const { data } = await api.get<PaymentDetails>('/admin/payment-settings')
    return data
  },

  updatePaymentSettings: async (
    payload: Partial<Record<keyof PaymentDetails, string | null>>,
  ): Promise<PaymentDetails> => {
    const { data } = await api.put<PaymentDetails>(
      '/admin/payment-settings',
      payload,
    )
    return data
  },

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