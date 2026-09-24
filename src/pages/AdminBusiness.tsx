import { useEffect, useState } from 'react'
import {
  BarChart3,
  HandCoins,
  Loader2,
  Package,
  ShieldAlert,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react'
import { adminService, type AdminBusinessQuery } from '../services/adminService'
import { formatCurrency } from '../lib/utils'
import type { AdminBusinessData } from '../types'

type RangeKey = 'all' | '30d' | 'month'

const RANGES: Record<RangeKey, string> = {
  all: 'Todo el tiempo',
  '30d': 'Últimos 30 días',
  month: 'Este mes',
}

function buildQuery(range: RangeKey): AdminBusinessQuery | undefined {
  if (range === 'all') return undefined
  const end = new Date()
  const start = new Date()
  if (range === 'month') {
    start.setDate(1)
  } else {
    start.setDate(start.getDate() - 30)
  }
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  credit: 'Crédito',
}

export default function AdminBusiness() {
  const [data, setData] = useState<AdminBusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<RangeKey>('all')

  const load = async (key: RangeKey) => {
    setLoading(true)
    setError(null)
    try {
      setData(await adminService.getBusiness(buildQuery(key)))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el consolidado')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(range)
  }, [range])

  const methodRows = data
    ? Object.entries(data.byMethod)
        .map(([method, total]) => ({ method, total, label: METHOD_LABELS[method] ?? method }))
        .sort((a, b) => b.total - a.total)
    : []

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-violet-600" /> Consolidado de negocio
          </h1>
          <p className="text-sm text-muted-foreground">
            Datos de negocio de todas las empresas.
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 self-start">
          {(Object.keys(RANGES) as RangeKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                range === key ? 'bg-card text-violet-700 shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {RANGES[key]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-violet-50 p-3 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Ventas del periodo</p>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {formatCurrency(data.sales.total)}
                  </p>
                  <p className="text-xs text-muted-foreground">{data.sales.count} ventas</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-rose-50 p-3 rounded-xl">
                  <ShoppingCart className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Compras del periodo</p>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {formatCurrency(data.purchases.total)}
                  </p>
                  <p className="text-xs text-muted-foreground">{data.purchases.count} compras</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 p-3 rounded-xl">
                  <Package className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Stock bajo</p>
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {data.lowStock.length}
                  </p>
                  <p className="text-xs text-muted-foreground">productos &lt; 10 unidades</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-500" /> Métodos de pago
              </h2>
              {methodRows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Sin datos</p>
              ) : (
                <div className="space-y-2">
                  {methodRows.map((row) => (
                    <div key={row.method}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground font-medium">{row.label}</span>
                        <span className="text-muted-foreground tabular-nums">{formatCurrency(row.total)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full"
                          style={{ width: `${data.sales.total > 0 ? (row.total / data.sales.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-violet-500" /> Productos más vendidos
              </h2>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Sin ventas</p>
              ) : (
                <div className="space-y-1">
                  {data.topProducts.slice(0, 5).map((product, i) => (
                    <div key={product.productId} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-foreground truncate">{product.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">{product.quantity} uds</p>
                        <p className="text-sm font-semibold text-violet-600 tabular-nums">
                          {formatCurrency(product.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="px-6 pt-6 pb-3">
              <h2 className="text-base font-semibold text-foreground">Productos con stock bajo</h2>
              <p className="text-xs text-muted-foreground">Requieren reposición en todas las empresas</p>
            </div>
            {data.lowStock.length === 0 ? (
              <p className="px-6 pb-8 pt-2 text-sm text-muted-foreground">Sin productos con stock crítico.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="px-6 py-3.5 font-medium">Producto</th>
                      <th className="px-6 py-3.5 font-medium">Código</th>
                      <th className="px-6 py-3.5 font-medium">Empresa</th>
                      <th className="px-6 py-3.5 font-medium text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.lowStock.map((product) => (
                      <tr key={product.id} className="border-b border-border/60 last:border-0">
                        <td className="px-6 py-3.5 font-medium text-foreground">{product.name}</td>
                        <td className="px-6 py-3.5 text-muted-foreground">{product.code}</td>
                        <td className="px-6 py-3.5 text-muted-foreground">{product.companyName}</td>
                        <td className="px-6 py-3.5 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {product.stock} uds
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-emerald-600" /> Cuentas por cobrar
              </h2>
              {data.receivables.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Sin pendientes</p>
              ) : (
                <div className="space-y-1">
                  {data.receivables.map((row) => (
                    <div key={row.companyId} className="flex justify-between items-center py-2 px-3 rounded-xl hover:bg-gray-50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.count} ventas pendientes</p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600 tabular-nums shrink-0">
                        {formatCurrency(row.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-amber-600" /> Cuentas por pagar
              </h2>
              {data.payables.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Sin pendientes</p>
              ) : (
                <div className="space-y-1">
                  {data.payables.map((row) => (
                    <div key={row.companyId} className="flex justify-between items-center py-2 px-3 rounded-xl hover:bg-gray-50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.count} compras pendientes</p>
                      </div>
                      <span className="text-sm font-semibold text-amber-600 tabular-nums shrink-0">
                        {formatCurrency(row.total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}