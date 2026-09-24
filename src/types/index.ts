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
  size?: string | null
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Purchase {
  id: string
  supplierId: string
  supplier: Supplier | null
  date: string
  items: PurchaseItem[]
  subtotal: number
  tax: number
  total: number
  paymentStatus: 'paid' | 'pending'
  createdAt: string
}

export interface PurchaseQueryParams {
  page?: number
  limit?: number
  search?: string
  supplierId?: string
  paymentStatus?: 'paid' | 'pending' | ''
  startDate?: string
  endDate?: string
}

export interface SupplierQueryParams {
  page?: number
  limit?: number
  search?: string
  startDate?: string
  endDate?: string
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

export interface ReportFilters {
  startDate?: string
  endDate?: string
  status?: 'paid' | 'pending'
}

export type ExportFormat = 'xlsx' | 'pdf'

export interface SalesByPeriodRow {
  date: string
  count: number
  subtotal: number
  tax: number
  total: number
}

export interface SalesSummaryReport {
  startDate: string
  endDate: string
  totalSales: number
  totalCount: number
  subtotal: number
  tax: number
  byPaymentMethod: Partial<Record<PaymentMethod, number>>
  byPaymentStatus: Partial<Record<'paid' | 'pending' | 'cancelled', number>>
  byPeriod: SalesByPeriodRow[]
}

export interface TopProductReportRow {
  productId: number
  name: string
  quantity: number
  revenue: number
}

export interface PurchaseBySupplierRow {
  supplierId: number
  supplier: string
  count: number
  total: number
}

export interface PurchasesSummaryReport {
  startDate: string
  endDate: string
  totalPurchases: number
  totalCount: number
  subtotal: number
  tax: number
  byPaymentStatus: Partial<Record<'paid' | 'pending', number>>
  bySupplier: PurchaseBySupplierRow[]
}

export interface InventoryReportRow {
  productId: number
  name: string
  code: string
  category: string
  stock: number
  purchasePrice: number
  stockValue: number
  lowStock: boolean
}

export interface InventoryReport {
  products: InventoryReportRow[]
  totalItems: number
  totalStock: number
  totalStockValue: number
  lowStockCount: number
}

export interface CashRegisterReportRow {
  id: number
  name: string
  status: 'open' | 'closed'
  user: string
  openedAt: string
  closedAt: string | null
  baseAmount: number
  expectedTotal: number
  countedTotal: number
  difference: number
}

export interface CashRegisterReport {
  cashRegisters: CashRegisterReportRow[]
  count: number
}

export interface AgingReportRow {
  id: number
  name: string
  pendingCount: number
  total: number
  current: number
  days30: number
  days60: number
  days90: number
}

export interface ReceivablesReport {
  startDate: string
  endDate: string
  rows: AgingReportRow[]
  total: number
}

export interface PayablesReport {
  startDate: string
  endDate: string
  rows: AgingReportRow[]
  total: number
}

export interface ApartadoReportRow {
  id: number
  apartadoNumber: string
  client: string
  date: string
  total: number
  totalPaid: number
  balance: number
  status: 'active' | 'paid'
}

export interface ApartadoReport {
  rows: ApartadoReportRow[]
  totalActive: number
  totalBalance: number
}

// ----------------------- Planes & Suscripciones -----------------------

export interface Plan {
  id: number
  key: string
  name: string
  description: string | null
  features: string[]
  allowedViews: string[]
  priceMonthly: number
  priceYearly: number
  maxUsers: number
  trialDays: number | null
  sortOrder: number
  active: boolean
}

export interface Subscription {
  id: number
  status: 'active' | 'expired' | string
  period: 'trial' | 'monthly' | 'yearly' | string
  price: number
  startsAt: string
  trialEndsAt: string | null
  expiresAt: string | null
  effectiveEnd: string | null
  plan: Plan | null
}

export interface PaymentOrder {
  id: number
  planKey: string
  period: string
  amount: number
  concept: string
  status: 'pending' | 'paid' | 'rejected' | string
  paidAt: string | null
  createdAt: string
}

export interface MySubscriptionResponse {
  subscription: Subscription | null
  paymentOrders: PaymentOrder[]
}

// ----------------------- Superadmin -----------------------

export interface AdminPlanDistribution {
  id: number
  key: string
  name: string
  companies: number
}

export interface AdminTopCompany {
  id: number
  name: string
  total: number
  count: number
}

export interface AdminRegistrationMonth {
  month: string
  count: number
}

export interface AdminDashboardData {
  companies: { total: number; active: number; inactive: number; newLast30Days: number }
  users: { total: number }
  subscriptions: {
    active: number
    expired: number
    trial: number
    paidMonthly: number
    paidYearly: number
    expiringSoon: number
  }
  mrv: number
  pendingOrders: number
  monthSales: { total: number; count: number }
  monthPurchases: { total: number; count: number }
  plans: AdminPlanDistribution[]
  topCompanies: AdminTopCompany[]
  registrationsByMonth: AdminRegistrationMonth[]
}

export interface AdminCompany {
  id: number
  name: string
  kind: string
  document: string | null
  phoneNumber: string | null
  address: string | null
  active: boolean
  createdAt: string
  usersCount: number
  salesCount: number
  productsCount: number
  lastSaleAt: string | null
  lastSaleTotal: number | null
  plan: { key: string; name: string } | null
  subscriptionStatus: string | null
  period: string | null
}

export interface AdminCompanyUser {
  id: number
  name: string
  email: string
  role: string
  active: boolean
  createdAt: string
}

export interface AdminCompanyDetail {
  id: number
  name: string
  kind: string
  document: string | null
  phoneNumber: string | null
  address: string | null
  active: boolean
  createdAt: string
  users: AdminCompanyUser[]
  subscription: {
    id: number
    status: string
    period: string
    price: number
    plan: Plan | null
  } | null
  lastSales: {
    id: number
    date: string
    total: number
    paymentStatus: string
    clientName: string
  }[]
  _count: { sales: number; products: number; clients: number; suppliers: number; purchases: number }
}

export interface AdminUser {
  id: number
  name: string
  email: string
  role: string
  active: boolean
  createdAt: string
  companyId: number | null
  companyName: string | null
  companyActive: boolean | null
}

export interface AdminTopProduct {
  productId: number
  name: string
  quantity: number
  revenue: number
}

export interface AdminLowStock {
  id: number
  name: string
  code: string
  stock: number
  companyName: string
}

export interface AdminPortfolioRow {
  companyId: number
  name: string
  total: number
  count: number
}

export interface AdminBusinessData {
  sales: { total: number; count: number }
  purchases: { total: number; count: number }
  byMethod: Record<string, number>
  topProducts: AdminTopProduct[]
  lowStock: AdminLowStock[]
  receivables: AdminPortfolioRow[]
  payables: AdminPortfolioRow[]
}
