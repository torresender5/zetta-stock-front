import { useApartadoStore } from './apartadoStore'
import { useCajaStore } from './cajaStore'
import { useCartStore } from './cartStore'
import { useCategoryStore } from './categoryStore'
import { useClientStore } from './clientStore'
import { useNotificationStore } from './notificationStore'
import { useProductStore } from './productStore'
import { usePurchaseStore } from './purchaseStore'
import { useRateStore } from './rateStore'
import { useSaleStore } from './saleStore'
import { useSubscriptionStore } from './subscriptionStore'
import { useSupplierStore } from './supplierStore'
import { useTicketStore } from './ticketStore'

/**
 * Al cambiar de sesión (login/register/logout o token expirado) se limpia
 * todo el estado que pertenece a la empresa anterior, para que un usuario
 * nuevo no vea datos de otra company en la misma pestaña.
 *
 * No importa authStore para evitar un ciclo de imports; el llamante
 * (authStore.logout o el interceptor 401 de api.ts) se encarga del usuario.
 */
export function resetAllSessionStores(): void {
  useCajaStore.getState().resetSession()
  useSubscriptionStore.getState().resetSession()
  useProductStore.getState().resetSession()
  useSaleStore.getState().resetSession()
  useClientStore.getState().resetSession()
  useSupplierStore.getState().resetSession()
  usePurchaseStore.getState().resetSession()
  useApartadoStore.getState().resetSession()
  useTicketStore.getState().resetSession()
  useCategoryStore.getState().resetSession()
  useNotificationStore.getState().resetSession()
  useRateStore.getState().resetSession()
  useCartStore.getState().resetSession()
}
