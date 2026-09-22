import api from '../lib/api'
import type {
  ReportFilters,
  ExportFormat,
  SalesSummaryReport,
  TopProductReportRow,
  PurchasesSummaryReport,
  InventoryReport,
  CashRegisterReport,
  ReceivablesReport,
  PayablesReport,
  ApartadoReport,
} from '../types'

const REPORT_ENDPOINTS = {
  sales: '/reports/sales',
  topProducts: '/reports/top-products',
  purchases: '/reports/purchases',
  inventory: '/reports/inventory',
  cashRegisters: '/reports/cash-registers',
  receivables: '/reports/accounts-receivable',
  payables: '/reports/accounts-payable',
  apartados: '/reports/apartados',
} as const

type ReportEndpoint = keyof typeof REPORT_ENDPOINTS

function buildParams(filters: ReportFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.startDate) params.startDate = filters.startDate
  if (filters.endDate) params.endDate = filters.endDate
  if (filters.status) params.status = filters.status
  return params
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const reportService = {
  async getSales(filters: ReportFilters): Promise<SalesSummaryReport> {
    const { data } = await api.get<SalesSummaryReport>(REPORT_ENDPOINTS.sales, {
      params: buildParams(filters),
    })
    return data
  },

  async getTopProducts(filters: ReportFilters): Promise<TopProductReportRow[]> {
    const { data } = await api.get<TopProductReportRow[]>(
      REPORT_ENDPOINTS.topProducts,
      { params: buildParams(filters) },
    )
    return data
  },

  async getPurchases(filters: ReportFilters): Promise<PurchasesSummaryReport> {
    const { data } = await api.get<PurchasesSummaryReport>(
      REPORT_ENDPOINTS.purchases,
      { params: buildParams(filters) },
    )
    return data
  },

  async getInventory(): Promise<InventoryReport> {
    const { data } = await api.get<InventoryReport>(REPORT_ENDPOINTS.inventory)
    return data
  },

  async getCashRegisters(filters: ReportFilters): Promise<CashRegisterReport> {
    const { data } = await api.get<CashRegisterReport>(
      REPORT_ENDPOINTS.cashRegisters,
      { params: buildParams(filters) },
    )
    return data
  },

  async getReceivables(filters: ReportFilters): Promise<ReceivablesReport> {
    const { data } = await api.get<ReceivablesReport>(
      REPORT_ENDPOINTS.receivables,
      { params: buildParams(filters) },
    )
    return data
  },

  async getPayables(filters: ReportFilters): Promise<PayablesReport> {
    const { data } = await api.get<PayablesReport>(REPORT_ENDPOINTS.payables, {
      params: buildParams(filters),
    })
    return data
  },

  async getApartados(): Promise<ApartadoReport> {
    const { data } = await api.get<ApartadoReport>(REPORT_ENDPOINTS.apartados)
    return data
  },

  async export(
    endpoint: ReportEndpoint,
    format: ExportFormat,
    filters: ReportFilters = {},
    filename: string,
  ): Promise<void> {
    const { data } = await api.get<Blob>(REPORT_ENDPOINTS[endpoint], {
      params: { ...buildParams(filters), export: format },
      responseType: 'blob',
    })
    downloadBlob(data, `${filename}.${format}`)
  },
}