import { create } from 'zustand'
import type { Sale, SaleItem, Invoice, PaginationMeta, PaymentMethod } from '../types'
import { saleService, invoiceService, type UpdateSaleDto } from '../services/saleService'
import { useProductStore } from './productStore'

const emptyMeta: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 }

const toSale = (s: Sale): Sale => ({
  ...s,
  clientName: s.client?.name ?? s.clientName,
})

const toInvoice = (inv: Invoice): Invoice => ({
  ...inv,
  items: inv.sale?.items ?? inv.items ?? [],
})

interface SaleStore {
  sales: Sale[]
  salesList: Sale[]
  salesMeta: PaginationMeta
  page: number
  limit: number
  search: string
  paymentStatusFilter: '' | 'paid' | 'pending' | 'cancelled'
  startDateFilter: string
  endDateFilter: string
  invoices: Invoice[]
  sale: Sale | null
  loading: boolean
  error: string | null
  fetchSales: () => Promise<void>
  fetchSalesPage: () => Promise<void>
  fetchSaleById: (id: string) => Promise<void>
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  setSearch: (search: string) => void
  setPaymentStatusFilter: (status: '' | 'paid' | 'pending' | 'cancelled') => void
  setStartDateFilter: (date: string) => void
  setEndDateFilter: (date: string) => void
  fetchInvoices: () => Promise<void>
  addSale: (
    clientId: string,
    date: string,
    items: SaleItem[],
    paymentStatus: 'paid' | 'pending',
    paymentMethod: PaymentMethod,
    receivedAmount?: number,
    fxRate?: number,
  ) => Promise<Invoice>
  updateSalePaymentStatus: (
    id: string,
    status: 'paid' | 'pending' | 'cancelled',
    cancelledReason?: string,
    refundAmount?: number,
    refundMethod?: string,
    paymentMethod?: PaymentMethod,
  ) => Promise<void>
  updateSale: (id: string, body: UpdateSaleDto) => Promise<{ ok: boolean; error?: string }>
  updateInvoiceStatus: (id: string, status: 'paid' | 'pending') => Promise<void>
}

export const useSaleStore = create<SaleStore>()((set, get) => ({
  sales: [],
  salesList: [],
  salesMeta: emptyMeta,
  page: 1,
  limit: 10,
  search: '',
  paymentStatusFilter: '',
  startDateFilter: '',
  endDateFilter: '',
  invoices: [],
  sale: null,
  loading: false,
  error: null,

  fetchSales: async () => {
    set({ loading: true, error: null })
    try {
      const sales = await saleService.getAll()
      set({ sales: sales.map(toSale), loading: false })
    } catch {
      set({ error: 'Error al cargar ventas', loading: false })
    }
  },

  fetchSalesPage: async () => {
    const { page, limit, search, paymentStatusFilter, startDateFilter, endDateFilter } = get()
    set({ loading: true, error: null })
    try {
      const { data, meta } = await saleService.getPage({
        page,
        limit,
        search: search || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
      })
      set({ salesList: data.map(toSale), salesMeta: meta, loading: false })
    } catch {
      set({ error: 'Error al cargar ventas', loading: false })
    }
  },

  fetchSaleById: async (id: string) => {
    set({ loading: true, error: null, sale: null })
    try {
      const sale = await saleService.getById(id)
      set({ sale, loading: false })
    } catch (error) {
      const message =
        (error as { response?: { status?: number } })?.response?.status === 404
          ? 'La venta no existe o no tienes acceso a ella.'
          : 'Error al cargar la venta'
      set({ error: message, loading: false })
      throw error
    }
  },

  setPage: (page) => {
    set({ page })
    get().fetchSalesPage()
  },

  setLimit: (limit) => {
    set({ limit, page: 1 })
    get().fetchSalesPage()
  },

  setSearch: (search) => {
    set({ search, page: 1 })
    get().fetchSalesPage()
  },

  setPaymentStatusFilter: (paymentStatusFilter) => {
    set({ paymentStatusFilter, page: 1 })
    get().fetchSalesPage()
  },

  setStartDateFilter: (startDateFilter) => {
    set({ startDateFilter, page: 1 })
    get().fetchSalesPage()
  },

  setEndDateFilter: (endDateFilter) => {
    set({ endDateFilter, page: 1 })
    get().fetchSalesPage()
  },

  fetchInvoices: async () => {
    set({ loading: true, error: null })
    try {
      const invoices = await invoiceService.getAll()
      set({ invoices: invoices.map(toInvoice), loading: false })
    } catch {
      set({ error: 'Error al cargar facturas', loading: false })
    }
  },

  addSale: async (clientId, date, items, paymentStatus, paymentMethod, receivedAmount, fxRate) => {
    set({ loading: true, error: null })
    try {
      const { sale, invoice } = await saleService.create({
        // Si no hay cliente seleccionado se omite: el API registra la venta
        // con el cliente genérico "Consumidor final"
        ...(clientId ? { clientId } : {}),
        date,
        items,
        paymentStatus,
        paymentMethod,
        receivedAmount,
        fxRate,
      })
      // El API ya descuenta el stock en transacción (incluye tallas);
      // solo refrescamos productos para reflejar el stock actualizado
      const { fetchAllProducts } = useProductStore.getState()
      await fetchAllProducts()
      set((state) => ({
        sales: [...state.sales, toSale(sale)],
        invoices: [...state.invoices, toInvoice(invoice)],
        loading: false,
      }))
      await get().fetchSalesPage()
      return invoice
    } catch {
      set({ error: 'Error al registrar venta', loading: false })
      throw new Error('Error al registrar venta')
    }
  },

  updateSalePaymentStatus: async (saleId, status, cancelledReason, refundAmount, refundMethod, paymentMethod) => {
    set({ loading: true, error: null })
    try {
      const updated = await saleService.updatePaymentStatus(saleId, {
        paymentStatus: status,
        cancelledReason,
        refundAmount,
        refundMethod,
        paymentMethod,
      })
      set((state) => ({
        sales: state.sales.map((s) => (s.id === saleId ? toSale(updated) : s)),
        salesList: state.salesList.map((s) => (s.id === saleId ? toSale(updated) : s)),
        invoices: state.invoices.map((inv) =>
          inv.saleId === saleId
            ? { ...inv, status, cancelledReason: status === 'cancelled' ? cancelledReason ?? null : null }
            : inv
        ),
        loading: false,
      }))
    } catch {
      set({ error: 'Error al actualizar estado de pago', loading: false })
      throw new Error('Error al actualizar estado de pago')
    }
  },

  updateSale: async (saleId, body) => {
    set({ loading: true, error: null })
    try {
      const updated = await saleService.update(saleId, body)
      const prev = get().sale
      const merged: Sale = {
        ...toSale(updated),
        // El PUT no incluye la factura: conservamos la existente (número y
        // estado no cambian; montos se recalculan en el servidor)
        invoice: prev?.id === saleId ? (prev.invoice ?? null) : null,
      }
      set((state) => ({
        sale: state.sale?.id === saleId ? merged : state.sale,
        sales: state.sales.map((s) =>
          s.id === saleId ? { ...merged, invoice: s.invoice ?? merged.invoice ?? null } : s
        ),
        salesList: state.salesList.map((s) =>
          s.id === saleId ? { ...merged, invoice: s.invoice ?? merged.invoice ?? null } : s
        ),
        loading: false,
      }))
      // El cambio de ítems puede reversar/aplicar stock: refrescamos el catálogo
      await useProductStore.getState().fetchAllProducts()
      return { ok: true }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string | string[] } } }
      const m = e?.response?.data?.message
      const error = Array.isArray(m) ? m.join(', ') : typeof m === 'string' && m ? m : 'Error al actualizar venta'
      set({ error, loading: false })
      return { ok: false, error }
    }
  },

  updateInvoiceStatus: async (id, status) => {
    set({ loading: true, error: null })
    try {
      const updated = await invoiceService.updateStatus(id, status)
      set((state) => ({
          invoices: state.invoices.map((inv) => (inv.id === id ? toInvoice(updated) : inv)),
        loading: false,
      }))
    } catch {
      set({ error: 'Error al actualizar factura', loading: false })
      throw new Error('Error al actualizar factura')
    }
  },
}))