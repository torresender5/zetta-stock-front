import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  productName: string
  size?: string
  unitPrice: number
  quantity: number
  maxStock: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: string, size?: string) => void
  updateQuantity: (productId: string, quantity: number, size?: string) => void
  clear: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const key = (i: CartItem) => `${i.productId}_${i.size || ''}`
          const newKey = `${item.productId}_${item.size || ''}`
          const existing = state.items.find((i) => key(i) === newKey)
          if (existing) {
            const newQty = Math.min(existing.quantity + (item.quantity || 1), item.maxStock)
            return {
              items: state.items.map((i) =>
                key(i) === newKey ? { ...i, quantity: newQty } : i
              ),
            }
          }
          return {
            items: [...state.items, { ...item, quantity: item.quantity || 1 }],
          }
        }),
      removeItem: (productId, size) =>
        set((state) => ({
          items: state.items.filter((i) => !(i.productId === productId && (i.size || '') === (size || ''))),
        })),
      updateQuantity: (productId, quantity, size) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && (i.size || '') === (size || '')
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
              : i
          ),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: 'cart-store' }
  )
)
