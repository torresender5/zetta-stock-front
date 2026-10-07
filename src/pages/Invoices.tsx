import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Eye,
  Printer,
  X,
  Search,
  FileText,
  ArrowLeft,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useSaleStore } from '../stores/saleStore'
import { saleService, invoiceService } from '../services/saleService'
import { formatDateOnly, todayLocal } from '../lib/utils'
import InvoiceDocument, { InvoiceStatusBadge } from '../components/InvoiceDocument'
import CurrencyToggle, { useDisplayCurrency } from '../components/CurrencyToggle'
import type { Invoice } from '../types'

type PeriodFilter = 'all' | 'day' | 'week' | 'month'
type StatusFilter = 'all' | 'paid' | 'pending' | 'cancelled'

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

function toISODate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** Rango de fechas (YYYY-MM-DD) del filtro de período para el servidor. */
function periodRange(period: PeriodFilter): { startDate: string; endDate: string } {
  const now = new Date()
  if (period === 'day') {
    const today = todayLocal()
    return { startDate: today, endDate: today }
  }
  if (period === 'week') {
    return { startDate: toISODate(getStartOfWeek(now)), endDate: todayLocal() }
  }
  if (period === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    return { startDate: toISODate(first), endDate: todayLocal() }
  }
  return { startDate: '', endDate: '' }
}

export default function Invoices() {
  const {
    invoices,
    invoicesMeta,
    invoicePage,
    invoiceLimit,
    invoiceStats,
    loading,
    setInvoicePage,
    setInvoiceLimit,
    setInvoiceFilters,
  } = useSaleStore()
  const { currency, setCurrency, fmt } = useDisplayCurrency()
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  // Filters
  const [period, setPeriod] = useState<PeriodFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const range = useMemo(() => periodRange(period), [period])

  // Aplica filtros (una sola petición server-side) al cambiar período/estado.
  useEffect(() => {
    setInvoiceFilters({
      search: searchInput,
      status: statusFilter === 'all' ? '' : statusFilter,
      startDate: range.startDate,
      endDate: range.endDate,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, statusFilter])

  // Búsqueda con debounce (sin disparo en el mount: el filtro inicial ya busca)
  const searchInitialized = useRef(false)
  useEffect(() => {
    if (!searchInitialized.current) {
      searchInitialized.current = true
      return
    }
    const t = setTimeout(() => {
      setInvoiceFilters({
        search: searchInput,
        status: statusFilter === 'all' ? '' : statusFilter,
        startDate: range.startDate,
        endDate: range.endDate,
      })
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  // Auto-open invoice when navigating from Sales with ?saleId=
  // (la factura puede no estar en la página cargada, por eso se consulta la venta)
  useEffect(() => {
    const saleId = searchParams.get('saleId')
    if (!saleId) return
    let cancelled = false
    const openInvoice = async () => {
      try {
        const sale = await saleService.getById(saleId)
        if (cancelled || !sale?.invoice) return
        setSelectedInvoice({
          ...sale.invoice,
          items: sale.invoice.items?.length ? sale.invoice.items : sale.items ?? [],
          clientName: sale.invoice.clientName || sale.clientName,
        })
      } catch {
        // venta inexistente: solo se limpia el parámetro
      } finally {
        if (!cancelled) setSearchParams({}, { replace: true })
      }
    }
    void openInvoice()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const hasActiveFilters = period !== 'all' || statusFilter !== 'all' || searchInput !== ''

  const clearFilters = () => {
    setPeriod('all')
    setStatusFilter('all')
    setSearchInput('')
  }

  const handleDownloadPdf = async () => {
    if (!selectedInvoice || downloadingPdf) return
    setPdfError(null)
    setDownloadingPdf(true)
    try {
      await invoiceService.exportPdf(selectedInvoice.id, selectedInvoice.invoiceNumber)
    } catch {
      setPdfError('No se pudo generar el PDF. Intenta de nuevo.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const total = invoicesMeta.total
  const empty = !loading && total === 0

  return (
    <div>
      {/* Page header */}
      <div className="no-print flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} factura{total === 1 ? '' : 's'} de las ventas registradas
          </p>
        </div>
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </div>

      {/* Filters */}
      <div className="no-print bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por cliente o N° factura..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
            />
          </div>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="all">Todos los períodos</option>
            <option value="day">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="all">Todos los estados</option>
            <option value="paid">Pagada</option>
            <option value="pending">Pendiente</option>
            <option value="cancelled">Cancelada</option>
          </select>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,26rem)_1fr] gap-5 items-start">
        {/* List */}
        <aside className="no-print lg:sticky lg:top-0 lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto pr-1 space-y-4">
          {/* Status stats (server-side: respeta búsqueda y fechas) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50/70 border border-green-100/60 rounded-2xl p-3">
              <p className="text-lg font-bold text-green-600 tabular-nums">{invoiceStats.paid}</p>
              <p className="text-xs text-green-700/70 font-medium">Pagadas</p>
            </div>
            <div className="bg-amber-50/70 border border-amber-100/60 rounded-2xl p-3">
              <p className="text-lg font-bold text-amber-600 tabular-nums">{invoiceStats.pending}</p>
              <p className="text-xs text-amber-700/70 font-medium">Pendientes</p>
            </div>
            <div className="bg-red-50/70 border border-red-100/60 rounded-2xl p-3">
              <p className="text-lg font-bold text-red-600 tabular-nums">{invoiceStats.cancelled}</p>
              <p className="text-xs text-red-700/70 font-medium">Canceladas</p>
            </div>
          </div>

          {empty && invoices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-9 h-9 mb-2 opacity-40 text-gray-300" aria-hidden="true" />
              <p className="text-sm text-gray-500 px-4">
                {hasActiveFilters
                  ? 'No se encontraron facturas con los filtros aplicados.'
                  : 'No hay facturas generadas. Se crean automáticamente al registrar una venta.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => {
                const isSelected = selectedInvoice?.id === inv.id
                return (
                  <button
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'border-violet-300 bg-violet-50/70 ring-2 ring-violet-500/20 shadow-md shadow-violet-500/5'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/70 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-violet-600 text-sm truncate">{inv.invoiceNumber}</span>
                      <InvoiceStatusBadge status={inv.status} />
                    </div>
                    <p className="font-medium text-gray-900 truncate mt-2.5">{inv.clientName}</p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-xs text-gray-500">{formatDateOnly(inv.date)}</span>
                      <span className="text-sm font-semibold text-gray-700 tabular-nums">{fmt(inv.total, inv.totalVes)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Server-side pagination */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center justify-between gap-2">
            <button
              onClick={() => setInvoicePage(invoicePage - 1)}
              disabled={invoicePage <= 1}
              className="flex items-center gap-1 px-3 py-2 text-sm rounded-xl border border-gray-100 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 tabular-nums">
                Página {invoicePage} de {invoicesMeta.totalPages}
              </span>
              <select
                value={invoiceLimit}
                onChange={(e) => setInvoiceLimit(Number(e.target.value))}
                className="mt-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
              >
                <option value={10}>10 / pág.</option>
                <option value={25}>25 / pág.</option>
                <option value={50}>50 / pág.</option>
              </select>
            </div>
            <button
              onClick={() => setInvoicePage(invoicePage + 1)}
              disabled={invoicePage >= invoicesMeta.totalPages}
              className="flex items-center gap-1 px-3 py-2 text-sm rounded-xl border border-gray-100 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Document (desktop) */}
        <section className="hidden lg:block">
          {selectedInvoice ? (
            <div className="space-y-3">
              <div className="no-print flex justify-end items-center gap-2">
                {pdfError && <span className="text-xs text-red-500">{pdfError}</span>}
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  {downloadingPdf ? 'Generando…' : 'Descargar PDF'}
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
              </div>
              <InvoiceDocument invoice={selectedInvoice} currency={currency} />
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 flex flex-col items-center justify-center py-24 text-center">
              <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-violet-500/20 mb-4">
                <Eye className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
              <p className="font-semibold text-gray-700">Selecciona una factura</p>
              <p className="text-sm text-gray-500 mt-1 max-w-xs px-6">Elige una factura de la lista para verla en detalle aquí.</p>
            </div>
          )}
        </section>
      </div>

      {/* Mobile overlay */}
      {selectedInvoice && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white overflow-y-auto print:static print:inset-auto print:overflow-visible">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 py-3 no-print">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                {downloadingPdf ? 'Generando…' : 'PDF'}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Imprimir
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <InvoiceDocument invoice={selectedInvoice} currency={currency} />
          </div>
        </div>
      )}
    </div>
  )
}
