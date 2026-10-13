import { create } from 'zustand'
import { subscriptionService } from '../services/subscriptionService'
import type {
  PaymentDetails,
  PaymentMethods,
  PaymentOrder,
  Plan,
  Subscription,
} from '../types'

interface SubscriptionStore {
  subscription: Subscription | null
  paymentOrders: PaymentOrder[]
  plans: Plan[]
  loading: boolean
  error: string | null
  fetchMySubscription: () => Promise<{ ok: boolean; error?: string }>
  fetchPlans: () => Promise<{ ok: boolean; error?: string }>
  purchase: (
    planId: number,
    period: 'monthly' | 'yearly',
    provider?: 'stripe' | 'pabilo' | 'manual',
    acceptedTerms?: boolean,
    fxRate?: number,
  ) => Promise<{
    ok: boolean
    error?: string
    order?: PaymentOrder | null
    subscription?: Subscription | null
  }>
  paymentMethods: PaymentMethods | null
  fetchPaymentMethods: () => Promise<void>
  paymentDetails: PaymentDetails | null
  fetchPaymentDetails: () => Promise<void>
  resetSession: () => void
}

export const useSubscriptionStore = create<SubscriptionStore>()((set, get) => ({
  subscription: null,
  paymentOrders: [],
  plans: [],
  loading: false,
  error: null,
  paymentMethods: null,
  paymentDetails: null,

  fetchMySubscription: async () => {
    set({ loading: true, error: null })
    try {
      const data = await subscriptionService.getMySubscription()
      set({
        subscription: data.subscription,
        paymentOrders: data.paymentOrders,
        loading: false,
      })
      return { ok: true }
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Error al cargar tu suscripción'
      set({ error: message, loading: false })
      return { ok: false, error: message }
    }
  },

  fetchPlans: async () => {
    try {
      const plans = await subscriptionService.getPlans()
      set({ plans })
      return { ok: true }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al cargar los planes'
      set({ error: message })
      return { ok: false, error: message }
    }
  },

  purchase: async (planId, period, provider, acceptedTerms, fxRate) => {
    set({ loading: true, error: null })
    try {
      const result = await subscriptionService.purchase(
        planId,
        period,
        provider,
        acceptedTerms,
        fxRate,
      )
      set({ loading: false })
      if (!result.order?.checkoutUrl) {
        // Solo recarga la suscripción si no salimos al checkout del proveedor
        await get().fetchMySubscription()
      }
      return {
        ok: true,
        order: result.order,
        subscription: result.subscription,
      }
    } catch (err: any) {
      const message =
        typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : 'Error al seleccionar el plan'
      set({ error: message, loading: false })
      return { ok: false, error: message }
    }
  },

  fetchPaymentMethods: async () => {
    try {
      const methods = await subscriptionService.getPaymentMethods()
      set({ paymentMethods: methods })
    } catch {
      // sin métodos online disponibles: queda en null (solo transferencia)
      set({ paymentMethods: null })
    }
  },

  fetchPaymentDetails: async () => {
    try {
      const details = await subscriptionService.getPaymentDetails()
      set({ paymentDetails: details })
    } catch {
      // sin configuración de cuenta: el checkout mostrará un aviso
      set({ paymentDetails: null })
    }
  },

  resetSession: () =>
    set({
      subscription: null,
      paymentOrders: [],
      loading: false,
      error: null,
      paymentMethods: null,
      paymentDetails: null,
    }),
}))