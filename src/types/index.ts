export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ProductQueryParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  startDate?: string
  endDate?: string
}

export interface ProductSize {
  size: string
  stock?: number
}

export interface Product {
  id: string
  name: string
  description: string
  code: string
  type: string
  sku: string
  category: string
  purchasePrice: number
  salePrice: number
  stock: number
  image?: string | null
  sizes?: ProductSize[] | null
  createdAt: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  document: string // NIT o cédula
  createdAt: string
}

export interface Supplier {
  id: string
  name: string
  document: string // NIT o cédula
  email: string
  phone: string
  address: string
  createdAt: string
}

export interface PurchaseItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Purchase {
  id: string
  supplierId: string
  supplier: string
  date: string
  items: PurchaseItem[]
  total: number
  paymentStatus: 'paid' | 'pending'
  createdAt: string
}

export interface SaleItem {
  productId: string
  productName: string
  size?: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Sale {
  id: string
  clientId: string
  clientName: string
  client?: {
    id?: string | number
    name?: string
    document?: string
    address?: string
    phone?: string
    email?: string
  } | null
  saleNumber?: string | null
  date: string
  items: SaleItem[]
  subtotal: number
  tax: number
  total: number
  paymentStatus: 'paid' | 'pending' | 'cancelled'
  paymentMethod?: PaymentMethod
  receivedAmount?: number | null
  changeAmount?: number | null
  cancelledReason?: string | null
  refundAmount?: number | null
  refundMethod?: string | null
  invoice?: Invoice | null
  createdAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  saleId: string
  clientId: string
  clientName: string
  clientDocument: string
  clientAddress: string
  date: string
  items: SaleItem[]
  subtotal: number
  tax: number
  total: number
  status: 'paid' | 'pending' | 'cancelled'
  cancelledReason?: string | null
  sale?: { items?: SaleItem[] } | null
  createdAt: string
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'credit'

export type CashMovementType =
  | 'opening'
  | 'sale'
  | 'expense'
  | 'withdrawal'
  | 'deposit'
  | 'refund'
  | 'apartado'
  | 'closing'

export interface CashMovement {
  id: string
  cashRegisterId: string
  saleId?: string | null
  apartadoId?: string | null
  type: CashMovementType
  paymentMethod: PaymentMethod
  amount: number
  description?: string | null
  createdAt: string
}

export interface ApartadoItem {
  id?: string
  apartadoId?: string
  productId: string
  productName: string
  size?: string | null
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface ApartadoPayment {
  id: string
  apartadoId: string
  amount: number
  paymentMethod: PaymentMethod
  date: string
  description?: string | null
  cashRegisterId?: string | null
  createdAt: string
}

export type ApartadoStatus = 'active' | 'paid' | 'cancelled'

export interface Apartado {
  id: string
  apartadoNumber: string
  clientId: string
  client?: Client | null
  date: string
  subtotal: number
  tax: number
  total: number
  initialPayment: number
  totalPaid: number
  status: ApartadoStatus
  dueDate?: string | null
  notes?: string | null
  saleId?: string | null
  sale?: Sale | null
  items: ApartadoItem[]
  payments?: ApartadoPayment[]
  createdAt: string
  updatedAt: string
}

export interface CashRegister {
  id: string
  name: string
  baseAmount: number
  openedAt: string
  closedAt?: string | null
  status: 'open' | 'closed'
  expectedTotal?: number | null
  countedTotal?: number | null
  difference?: number | null
  user?: { name?: string; role?: string } | null
  movements: CashMovement[]
}

export interface CashRegisterSummary {
  baseAmount: number
  expectedTotal: number
  countedTotal: number | null
  difference: number | null
  status: 'open' | 'closed'
  salesTotal: number
  outcomesTotal: number
  incomesTotal: number
  salesByMethod: Partial<Record<PaymentMethod, number>>
  expectedByMethod: Partial<Record<PaymentMethod, number>>
  movementCount: number
}
