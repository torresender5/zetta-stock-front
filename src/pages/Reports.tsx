import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  TrendingUp,
  Package,
  Boxes,
  ShoppingCart,
  Wallet,
  HandCoins,
  CreditCard,
  PackagePlus,
  FileDown,
  FileSpreadsheet,
  Loader2,
  BarChart3,
  Trophy,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts'
import { useAuthStore } from '../stores/authStore'
import { can } from '../lib/permissions'
import type { ViewKey } from '../lib/permissions'
import { formatCurrency, formatDate, todayLocal } from '../lib/utils'
import { reportService } from '../services/reportService'
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

type TabId =
  | 'ventas'
  | 'productos'
  | 'stock'
  | 'compras'
  | 'caja'
  | 'porCobrar'
  | 'porPagar'
  | 'apartados'

interface TabConfig {
  id: TabId
  label: string
  icon: typeof TrendingUp
  view: ViewKey
}

const TAB_CONFIG: TabConfig[] = [
  { id: 'ventas', label: 'Ventas', icon: TrendingUp, view: 'sales' },
  { id: 'productos', label: 'Productos', icon: Package, view: 'sales' },
  { id: 'stock', label: 'Stock', icon: Boxes, view: 'products' },
  { id: 'compras', label: 'Compras', icon: ShoppingCart, view: 'purchases' },
  { id: 'caja', label: 'Caja', icon: Wallet, view: 'caja' },
  { id: 'porCobrar', label: 'Por Cobrar', icon: HandCoins, view: 'sales' },
  { id: 'porPagar', label: 'Por Pagar', icon: CreditCard, view: 'purchases' },
  { id: 'apartados', label: 'Apartados', icon: PackagePlus, view: 'apartados' },
]

const EXPORT_ENDPOINT: Record<TabId, Parameters<typeof reportService.export>[0]> = {
  ventas: 'sales',
  productos: 'topProducts',
  compras: 'purchases',
  stock: 'inventory',
  caja: 'cashRegisters',
  porCobrar: 'receivables',
  porPagar: 'payables',
  apartados: 'apartados',
}

const EXPORT_FILENAME: Record<TabId, string> = {
  ventas: 'reporte-ventas',
  productos: 'productos-mas-vendidos',
  compras: 'reporte-compras',
  stock: 'reporte-inventario',
  caja: 'reporte-caja',
  porCobrar: 'cuentas-por-cobrar',
  porPagar: 'cuentas-por-pagar',
  apartados: 'reporte-apartados',
}

interface Column<T> {
  header: string
  align?: 'right' | 'center'
  render: (row: T, index: number) => React.ReactNode
}

function Table<T>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <BarChart3 className="w-12 h-12 mb-3 opacity-40" aria-hidden="true" />
        <p className="text-sm">No hay datos para el período seleccionado</p>
      </div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.header}
                className={`py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wide ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-muted/40 transition-colors">
              {columns.map((col) => (
                <td
                  key={col.header}
                  className={`py-3 px-4 text-foreground ${
                    col.align === 'right' ? 'text-right tabular-nums' : ''
                  }`}
                >
                  {col.render(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const statusBadge = (active: boolean, onLabel: string, offLabel: string) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
    }`}
  >
    {active ? onLabel : offLabel}
  </span>
)

function MethodBadge({ total, method }: { total: number | undefined; method: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/50">
      <span className="text-sm font-medium text-foreground capitalize">{method}</span>
      <span className="text-sm font-semibold text-foreground tabular-nums">
        {formatCurrency(total ?? 0)}
      </span>
    </div>
  )
}

interface Stats {
  label: string
  value: string
  highlight?: boolean
}

export default function Reports() {
  const role = useAuthStore((s) => s.user?.role)
  const [activeTab, setActiveTab] = useState<TabId>('ventas')
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setDate(date.getDate() - 29)
    return date.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState<string>(todayLocal())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState<ExportFormat | null>(null)

  const [sales, setSales] = useState<SalesSummaryReport | null>(null)
  const [products, setProducts] = useState<TopProductReportRow[]>([])
  const [purchases, setPurchases] = useState<PurchasesSummaryReport | null>(null)
  const [inventory, setInventory] = useState<InventoryReport | null>(null)
  const [cashRegisters, setCashRegisters] = useState<CashRegisterReport | null>(null)
  const [receivables, setReceivables] = useState<ReceivablesReport | null>(null)
  const [payables, setPayables] = useState<PayablesReport | null>(null)
  const [apartados, setApartados] = useState<ApartadoReport | null>(null)

  const tabs = TAB_CONFIG.filter((tab) => can(role, tab.view))

  const filters: ReportFilters = useMemo(
    () => ({ startDate, endDate }),
    [startDate, endDate],
  )

  const loadTab = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      switch (activeTab) {
        case 'ventas':
          setSales(await reportService.getSales(filters))
          break
        case 'productos':
          setProducts(await reportService.getTopProducts(filters))
          break
        case 'stock':
          setInventory(await reportService.getInventory())
          break
        case 'compras':
          setPurchases(await reportService.getPurchases(filters))
          break
        case 'caja':
          setCashRegisters(await reportService.getCashRegisters(filters))
          break
        case 'porCobrar':
          setReceivables(await reportService.getReceivables(filters))
          break
        case 'porPagar':
          setPayables(await reportService.getPayables(filters))
          break
        case 'apartados':
          setApartados(await reportService.getApartados())
          break
      }
    } catch {
      setError('Error al cargar el reporte')
    } finally {
      setLoading(false)
    }
  }, [activeTab, filters])

  useEffect(() => {
    loadTab()
  }, [loadTab])

  const handleExport = async (format: ExportFormat, endpoint: Parameters<typeof reportService.export>[0], filename: string) => {
    setExporting(format)
    try {
      await reportService.export(endpoint, format, endpoint === 'inventory' || endpoint === 'apartados' ? {} : filters, filename)
    } catch {
      setError('Error al exportar el reporte')
    } finally {
      setExporting(null)
    }
  }

  const startOfWeek = useMemo(() => {
    const date = new Date()
    const day = (date.getDay() + 6) % 7
    date.setDate(date.getDate() - day)
    return date.toISOString().slice(0, 10)
  }, [])

  const monthStart = useMemo(() => {
    const date = new Date()
    date.setDate(1)
    return date.toISOString().slice(0, 10)
  }, [])

  const applyRange = (start: string, end: string) => {
    setStartDate(start)
    setEndDate(end)
  }

  const stats: Stats[] = (() => {
    switch (activeTab) {
      case 'ventas': {
        const s = sales
        return [
          { label: 'Ventas', value: s ? String(s.totalCount) : '—' },
          { label: 'Ingresos', value: s ? formatCurrency(s.totalSales) : '—', highlight: true },
          { label: 'Subtotal', value: s ? formatCurrency(s.subtotal) : '—' },
          { label: 'IVA (19%)', value: s ? formatCurrency(s.tax) : '—' },
        ]
      }
      case 'productos': {
        const totalUnits = products.reduce((sum, p) => sum + p.quantity, 0)
        const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0)
        return [
          { label: 'Productos vendidos', value: String(products.length), highlight: true },
          { label: 'Unidades', value: String(totalUnits) },
          { label: 'Ingresos generados', value: formatCurrency(totalRevenue) },
        ]
      }
      case 'compras': {
        const p = purchases
        return [
          { label: 'Compras', value: p ? String(p.totalCount) : '—' },
          { label: 'Total compras', value: p ? formatCurrency(p.totalPurchases) : '—', highlight: true },
          { label: 'Subtotal', value: p ? formatCurrency(p.subtotal) : '—' },
          { label: 'IVA', value: p ? formatCurrency(p.tax) : '—' },
        ]
      }
      case 'stock': {
        const inv = inventory
        return [
          { label: 'Total artículos', value: inv ? String(inv.totalItems) : '—' },
          { label: 'Total unidades', value: inv ? String(inv.totalStock) : '—' },
          { label: 'Valor en costos', value: inv ? formatCurrency(inv.totalStockValue) : '—' },
          { label: 'Stock bajo', value: inv ? String(inv.lowStockCount) : '—', highlight: inv?.lowStockCount ? inv.lowStockCount > 0 : false },
        ]
      }
      case 'caja': {
        const c = cashRegisters
        const diffs = c?.cashRegisters.map((r) => r.difference ?? 0) ?? []
        const sum = diffs.reduce((a, b) => a + b, 0)
        return [
          { label: 'Cierres', value: c ? String(c.count) : '—' },
          { label: 'Diferencia acumulada', value: c ? formatCurrency(sum) : '—', highlight: sum !== 0 },
        ]
      }
      case 'porCobrar':
        return [
          { label: 'Clientes con saldo', value: receivables ? String(receivables.rows.length) : '—' },
          { label: 'Total por cobrar', value: receivables ? formatCurrency(receivables.total) : '—', highlight: true },
        ]
      case 'porPagar':
        return [
          { label: 'Proveedores con saldo', value: payables ? String(payables.rows.length) : '—' },
          { label: 'Total por pagar', value: payables ? formatCurrency(payables.total) : '—', highlight: true },
        ]
      case 'apartados':
        return [
          { label: 'Apartados activos', value: apartados ? String(apartados.totalActive) : '—' },
          { label: 'Saldo pendiente', value: apartados ? formatCurrency(apartados.totalBalance) : '—', highlight: true },
        ]
      default:
        return []
    }
  })()

  const renderBody = () => {
    switch (activeTab) {
      case 'ventas': {
        const s = sales
        if (!s) return null
        const methods = Object.entries(s.byPaymentMethod ?? {})
        return (
          <div className="space-y-6">
            {s.byPeriod.length > 0 && (
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4">Ventas por día</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={s.byPeriod}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => new Intl.NumberFormat('es-CO', { notation: 'compact' }).format(v)}
                    />
                    <ChartTooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(value, name) => [
                        name === 'count' ? `${value} ventas` : formatCurrency(Number(value)),
                        name === 'count' ? 'Ventas' : 'Total',
                      ]}
                    />
                    <Bar dataKey="count" name="Ventas" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="total" name="Total" fill="#d97706" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4">Ingresos por método de pago</h3>
                <div className="space-y-2">
                  {methods.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin datos</p>
                  ) : (
                    methods.map(([method, total]) => <MethodBadge key={method} method={method} total={total} />)
                  )}
                </div>
              </div>
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4">Ingresos por estado</h3>
                <div className="space-y-2">
                  {Object.entries(s.byPaymentStatus ?? {}).map(([status, total]) => (
                    <MethodBadge key={status} method={status} total={total} />
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-card rounded-2xl shadow-sm border border-border">
              <div className="px-6 pt-5">
                <h3 className="text-sm font-semibold text-muted-foreground">Detalle por día</h3>
              </div>
              <Table
                columns={[
                  { header: 'Fecha', render: (r) => formatDate(r.date) },
                  { header: 'Ventas', align: 'right', render: (r) => r.count },
                  { header: 'Subtotal', align: 'right', render: (r) => formatCurrency(r.subtotal) },
                  { header: 'IVA', align: 'right', render: (r) => formatCurrency(r.tax) },
                  { header: 'Total', align: 'right', render: (r) => <span className="font-semibold">{formatCurrency(r.total)}</span> },
                ]}
                rows={s.byPeriod}
              />
            </div>
          </div>
        )
      }
      case 'productos': {
        if (products.length === 0) return null
        return (
          <div className="space-y-6">
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-500" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-muted-foreground">Top productos por unidad vendida</h3>
              </div>
              <ResponsiveContainer width="100%" height={Math.min(300, Math.max(180, products.length * 34))}>
                <BarChart data={products.slice(0, 10)} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={130}
                    tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 18) + '…' : v)}
                  />
                  <ChartTooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(value, name) => [value, name === 'quantity' ? 'Unidades' : 'Ingresos']}
                  />
                  <Bar dataKey="quantity" name="Unidades" fill="#8b5cf6" radius={[0, 6, 6, 0]} maxBarSize={22} />
                  <Bar dataKey="revenue" name="Ingresos" fill="#d97706" radius={[0, 6, 6, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-2xl shadow-sm border border-border">
              <div className="px-6 pt-5">
                <h3 className="text-sm font-semibold text-muted-foreground">Ranking de productos</h3>
              </div>
              <Table
                columns={[
                  { header: '#', render: (_r, i) => <span className="font-semibold text-muted-foreground">{i + 1}</span> },
                  { header: 'Producto', render: (r) => r.name },
                  { header: 'Unidades', align: 'right', render: (r) => r.quantity },
                  { header: 'Ingresos', align: 'right', render: (r) => formatCurrency(r.revenue) },
                ]}
                rows={products}
              />
            </div>
          </div>
        )
      }
      case 'stock': {
        const inv = inventory
        if (!inv) return null
        return (
          <div className="bg-card rounded-2xl shadow-sm border border-border">
            <div className="px-6 pt-5">
              <h3 className="text-sm font-semibold text-muted-foreground">Inventario actual</h3>
            </div>
            <Table
              columns={[
                { header: 'Producto', render: (r) => r.name },
                { header: 'Código', render: (r) => <span className="text-muted-foreground">{r.code}</span> },
                { header: 'Stock', align: 'right', render: (r) => r.stock },
                { header: 'Valor en costos', align: 'right', render: (r) => formatCurrency(r.stockValue) },
                { header: 'Estado', render: (r) => statusBadge(!r.lowStock, 'OK', r.stock === 0 ? 'Sin stock' : 'Stock bajo') },
              ]}
              rows={inv.products}
            />
          </div>
        )
      }
      case 'compras': {
        const p = purchases
        if (!p) return null
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4">Por estado de pago</h3>
                <div className="space-y-2">
                  {Object.keys(p.byPaymentStatus ?? {}).length === 0 && (
                    <p className="text-sm text-muted-foreground">Sin datos</p>
                  )}
                  {Object.entries(p.byPaymentStatus ?? {}).map(([status, total]) => (
                    <MethodBadge key={status} method={status} total={total} />
                  ))}
                </div>
              </div>
              <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4">Compras por proveedor</h3>
                <div className="space-y-2">
                  {p.bySupplier.length === 0 && (
                    <p className="text-sm text-muted-foreground">Sin datos</p>
                  )}
                  {p.bySupplier.map((r) => (
                    <div key={r.supplierId} className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/50">
                      <span className="text-sm font-medium text-foreground">{r.supplier}</span>
                      <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(r.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      }
      case 'caja': {
        const c = cashRegisters
        if (!c) return null
        return (
          <div className="bg-card rounded-2xl shadow-sm border border-border">
            <div className="px-6 pt-5">
              <h3 className="text-sm font-semibold text-muted-foreground">Resumen de cajas</h3>
            </div>
            <Table
              columns={[
                { header: 'Caja', render: (r) => r.name },
                { header: 'Usuario', render: (r) => <span className="text-muted-foreground">{r.user}</span> },
                { header: 'Apertura', render: (r) => formatDate(r.openedAt) },
                { header: 'Esperado', align: 'right', render: (r) => formatCurrency(r.expectedTotal) },
                { header: 'Contado', align: 'right', render: (r) => formatCurrency(r.countedTotal) },
                { header: 'Diferencia', align: 'right', render: (r) => <span className={r.difference === 0 ? '' : r.difference > 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>{formatCurrency(r.difference)}</span> },
                { header: 'Estado', render: (r) => statusBadge(r.status === 'closed', 'Cerrada', 'Abierta') },
              ]}
              rows={c.cashRegisters}
            />
          </div>
        )
      }
      case 'porCobrar':
      case 'porPagar': {
        const rows = activeTab === 'porCobrar' ? receivables : payables
        if (!rows) return null
        return (
          <div className="bg-card rounded-2xl shadow-sm border border-border">
            <div className="px-6 pt-5">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {activeTab === 'porCobrar' ? 'Cuentas por cobrar' : 'Cuentas por pagar'}
              </h3>
            </div>
            <Table
              columns={[
                { header: activeTab === 'porCobrar' ? 'Cliente' : 'Proveedor', render: (r) => r.name },
                { header: 'Facturas', align: 'right', render: (r) => r.pendingCount },
                { header: 'Hoy - 30d', align: 'right', render: (r) => formatCurrency(r.current) },
                { header: '31 - 60d', align: 'right', render: (r) => formatCurrency(r.days30) },
                { header: '61 - 90d', align: 'right', render: (r) => formatCurrency(r.days60) },
                { header: '+90d', align: 'right', render: (r) => formatCurrency(r.days90) },
                { header: 'Total', align: 'right', render: (r) => <span className="font-semibold">{formatCurrency(r.total)}</span> },
              ]}
              rows={rows.rows}
            />
          </div>
        )
      }
      case 'apartados': {
        const a = apartados
        if (!a) return null
        return (
          <div className="bg-card rounded-2xl shadow-sm border border-border">
            <div className="px-6 pt-5">
              <h3 className="text-sm font-semibold text-muted-foreground">Apartados activos y liquidados</h3>
            </div>
            <Table
              columns={[
                { header: 'Nº', render: (r) => r.apartadoNumber },
                { header: 'Cliente', render: (r) => r.client },
                { header: 'Fecha', render: (r) => formatDate(r.date) },
                { header: 'Total', align: 'right', render: (r) => formatCurrency(r.total) },
                { header: 'Pagado', align: 'right', render: (r) => formatCurrency(r.totalPaid) },
                { header: 'Saldo', align: 'right', render: (r) => <span className="font-semibold">{formatCurrency(r.balance)}</span> },
                { header: 'Estado', render: (r) => statusBadge(r.status === 'paid', 'Liquidado', 'Activo') },
              ]}
              rows={a.rows}
            />
          </div>
        )
      }
      default:
        return null
    }
  }

  if (tabs.length === 0) {
    return null
  }

  if (!tabs.some((t) => t.id === activeTab)) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Analiza el desempeño de tu negocio y exporta los informes
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tipos de reporte">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              activeTab === id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border'
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <button
            type="button"
            onClick={() => applyRange(startOfWeek, todayLocal())}
            className="text-sm px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-foreground transition-colors cursor-pointer"
          >
            Esta semana
          </button>
          <button
            type="button"
            onClick={() => applyRange(monthStart, todayLocal())}
            className="text-sm px-3 py-2 rounded-lg bg-muted/60 hover:bg-muted text-foreground transition-colors cursor-pointer"
          >
            Este mes
          </button>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Desde
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Hasta
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </label>
        </div>
        <div className="flex items-center gap-2 lg:ml-auto">
          <button
            type="button"
            onClick={() => handleExport('xlsx', EXPORT_ENDPOINT[activeTab], EXPORT_FILENAME[activeTab])}
            disabled={exporting !== null}
            className="inline-flex items-center gap-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {exporting === 'xlsx' ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
            )}
            Excel
          </button>
          <button
            type="button"
            onClick={() => handleExport('pdf', EXPORT_ENDPOINT[activeTab], EXPORT_FILENAME[activeTab])}
            disabled={exporting !== null}
            className="inline-flex items-center gap-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {exporting === 'pdf' ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileDown className="w-4 h-4" aria-hidden="true" />
            )}
            PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl px-5 py-4 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`bg-card rounded-2xl p-5 shadow-sm border transition-colors ${
              stat.highlight ? 'border-primary/60' : 'border-border'
            }`}
          >
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" aria-hidden="true" />
        </div>
      ) : (
        renderBody()
      )}
    </div>
  )
}