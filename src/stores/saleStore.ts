import { create } from 'zustand'
import type { Sale, SaleItem, Invoice } from '../types'
import { saleService, invoiceService } from '../services/saleService'
import { useProductStore } from './productStore'

interface SaleStore {
  sales: Sale[]
  invoices: Invoice[]
  loading: boolean
  error: string | null
  fetchSales: () => Promise<void>
  fetchInvoices: () => Promise<void>
  addSale: (clientId: string, date: string, items: SaleItem[], paymentStatus: 'paid' | 'pending') => Promise<Invoice>
  updateSalePaymentStatus: (id: string, status: 'paid' | 'pending') => Promise<void>
  updateInvoiceStatus: (id: string, status: 'paid' | 'pending') => Promise<void>
}

export const useSaleStore = create<SaleStore>()((set) => ({
  sales: [],
  invoices: [],
  loading: false,
  error: null,

  fetchSales: async () => {
    set({ loading: true, error: null })
    try {
      const sales = await saleService.getAll()
      set({ sales, loading: false })
    } catch {
      set({ error: 'Error al cargar ventas', loading: false })
    }
  },

  fetchInvoices: async () => {
    set({ loading: true, error: null })
    try {
      const invoices = await invoiceService.getAll()
      set({ invoices, loading: false })
    } catch {
      set({ error: 'Error al cargar facturas', loading: false })
    }
  },

  addSale: async (clientId, date, items, paymentStatus) => {
    set({ loading: true, error: null })
    try {
      const { sale, invoice } = await saleService.create({ clientId, date, items, paymentStatus })
      // Reducir stock local
      const { updateStock } = useProductStore.getState()
      for (const item of items) {
        await updateStock(item.productId, -item.quantity, item.size)
      }
      set((state) => ({
        sales: [...state.sales, sale],
        invoices: [...state.invoices, invoice],
        loading: false,
      }))
      return invoice
    } catch {
      set({ error: 'Error al registrar venta', loading: false })
      throw new Error('Error al registrar venta')
    }
  },

  updateSalePaymentStatus: async (saleId, status) => {
    set({ loading: true, error: null })
    try {
      const updated = await saleService.updatePaymentStatus(saleId, status)
      set((state) => ({
        sales: state.sales.map((s) => (s.id === saleId ? updated : s)),
        invoices: state.invoices.map((inv) =>
          inv.saleId === saleId ? { ...inv, status } : inv
        ),
        loading: false,
      }))
    } catch {
      set({ error: 'Error al actualizar estado de pago', loading: false })
      throw new Error('Error al actualizar estado de pago')
    }
  },

  updateInvoiceStatus: async (id, status) => {
    set({ loading: true, error: null })
    try {
      const updated = await invoiceService.updateStatus(id, status)
      set((state) => ({
        invoices: state.invoices.map((inv) => (inv.id === id ? updated : inv)),
        loading: false,
      }))
    } catch {
      set({ error: 'Error al actualizar factura', loading: false })
      throw new Error('Error al actualizar factura')
    }
  },
}))
