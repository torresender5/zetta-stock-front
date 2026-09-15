import { useState, useMemo, useEffect } from 'react'
import { Package, Users, ShoppingCart, TrendingUp, FileText, DollarSign, CreditCard, HandCoins, Trophy, Medal, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import { useProductStore } from '../stores/productStore'
import { useClientStore } from '../stores/clientStore'
import { usePurchaseStore } from '../stores/purchaseStore'
import { useSaleStore } from '../stores/saleStore'
import { formatCurrency } from '../lib/utils'
import type { Sale } from '../types'

type Period = 'day' | 'week' | 'month'

function getWeekLabel(date: Date): string {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const diff = date.getTime() - startOfYear.getTime()
  const weekNum = Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7)
  return `Sem ${weekNum} - ${date.getFullYear()}`
}

function groupSalesByPeriod(sales: Sale[], period: Period) {
  const grouped: Record<string, { label: string; count: number; amount: number; sortKey: string }> = {}

  for (const sale of sales) {
    const date = new Date(sale.date)
    let key: string
    let label: string
    let sortKey: string

    switch (period) {
      case 'day':
        key = sale.date
        label = date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
        sortKey = sale.date
        break
      case 'week':
        key = getWeekLabel(date)
        label = key
        sortKey = `${date.getFullYear()}-${String(Math.ceil(((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(date.getFullYear(), 0, 1).getDay() + 1) / 7)).padStart(2, '0')}`
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        label = date.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })
        sortKey = key
        break
    }

    if (!grouped[key]) {
      grouped[key] = { label, count: 0, amount: 0, sortKey }
    }
    grouped[key].count += 1
    grouped[key].amount += sale.total
  }

  return Object.values(grouped)
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ label, count, amount }) => ({ label, count, amount }))
}

const periodLabels: Record<Period, string> = {
  day: 'Día',
  week: 'Semana',
  month: 'Mes',
}

const currencyFormatter = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, notation: 'compact' }).format(value)

const kpiConfig = [
  { key: 'products', label: 'Productos', icon: Package, color: 'text-primary', bgLight: 'bg-primary/10' },
  { key: 'clients', label: 'Clientes', icon: Users, color: 'text-secondary', bgLight: 'bg-secondary/10' },
  { key: 'purchases', label: 'Compras', icon: ShoppingCart, color: 'text-accent', bgLight: 'bg-accent/10' },
  { key: 'sales', label: 'Ventas', icon: TrendingUp, color: 'text-primary', bgLight: 'bg-primary/10' },
  { key: 'invoices', label: 'Facturas Pendientes', icon: FileText, color: 'text-destructive', bgLight: 'bg-destructive/10' },
  { key: 'lowStock', label: 'Stock Bajo', icon: DollarSign, color: 'text-accent', bgLight: 'bg-accent/10' },
] as const

export default function Dashboard() {
  const { products, fetchAllProducts } = useProductStore()
  const { clients, fetchClients } = useClientStore()
  const { purchases, fetchPurchases } = usePurchaseStore()
  const { sales, invoices, fetchSales, fetchInvoices } = useSaleStore()
  const [period, setPeriod] = useState<Period>('day')

  useEffect(() => {
    fetchAllProducts()
    fetchClients()
    fetchPurchases()
    fetchSales()
    fetchInvoices()
  }, [])

  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0)
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0)
  const pendingInvoices = invoices.filter((i) => i.status === 'pending').length
  const lowStock = products.filter((p) => p.stock < 10).length

  const chartData = useMemo(() => groupSalesByPeriod(sales, period), [sales, period])

  const accountsPayable = useMemo(() => {
    const pending = purchases.filter((p) => (p.paymentStatus ?? 'paid') === 'pending')
    const map: Record<string, { supplier: string; total: number }> = {}
    for (const p of pending) {
      if (!map[p.supplier]) map[p.supplier] = { supplier: p.supplier, total: 0 }
      map[p.supplier].total += p.total
    }
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [purchases])

  const accountsReceivable = useMemo(() => {
    const pending = sales.filter((s) => (s.paymentStatus ?? 'paid') === 'pending')
    const map: Record<string, { clientName: string; total: number }> = {}
    for (const s of pending) {
      if (!map[s.clientId]) map[s.clientId] = { clientName: s.clientName, total: 0 }
      map[s.clientId].total += s.total
    }
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [sales])

  const totalPayable = accountsPayable.reduce((sum, a) => sum + a.total, 0)
  const totalReceivable = accountsReceivable.reduce((sum, a) => sum + a.total, 0)

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number }> = {}
    for (const sale of sales) {
      for (const item of sale.items) {
        if (!map[item.productId]) {
          map[item.productId] = { name: item.productName, quantity: 0, revenue: 0 }
        }
        map[item.productId].quantity += item.quantity
        map[item.productId].revenue += item.subtotal
      }
    }
    return Object.values(map)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8)
  }, [sales])

  const topClients = useMemo(() => {
    const map: Record<string, { name: string; purchases: number; totalSpent: number; itemCount: number }> = {}
    for (const sale of sales) {
      if (!map[sale.clientId]) {
        map[sale.clientId] = { name: sale.clientName, purchases: 0, totalSpent: 0, itemCount: 0 }
      }
      map[sale.clientId].purchases += 1
      map[sale.clientId].totalSpent += sale.total
      map[sale.clientId].itemCount += sale.items.reduce((sum, i) => sum + i.quantity, 0)
    }
    return Object.values(map)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 8)
  }, [sales])

  const kpiValues: Record<string, string | number> = {
    products: products.length,
    clients: clients.length,
    purchases: formatCurrency(totalPurchases),
    sales: formatCurrency(totalSales),
    invoices: pendingInvoices,
    lowStock,
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumen general de tu negocio</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpiConfig.map(({ key, label, icon: Icon, color, bgLight }) => (
          <div
            key={key}
            className="group relative bg-card rounded-2xl p-5 shadow-sm border border-border transition-all duration-200 hover:shadow-md hover:border-primary/30 overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <div className={`${bgLight} p-3 rounded-xl transition-colors`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold text-foreground mt-0.5 tabular-nums">{kpiValues[key]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Gráficas de Ventas</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Análisis de ventas por período</p>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1" role="tablist" aria-label="Período de ventas">
            {(['day', 'week', 'month'] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={period === p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 cursor-pointer ${
                  period === p
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mb-3 opacity-40" aria-hidden="true" />
            <p className="text-sm">No hay datos de ventas para mostrar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">Número de Ventas</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Ventas" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">Monto de Ventas</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={currencyFormatter} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Bar dataKey="amount" name="Monto" fill="#d97706" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Top Products & Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Products Sold */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-violet-500 to-indigo-500 p-2.5 rounded-xl shadow-lg shadow-violet-500/20">
                <Trophy className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Productos Más Vendidos</h2>
                <p className="text-xs text-muted-foreground">Por cantidad vendida</p>
              </div>
            </div>
          </div>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Package className="w-10 h-10 mb-2 opacity-40" aria-hidden="true" />
              <p className="text-sm">No hay datos de ventas</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                    tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + '...' : v}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    formatter={(value, name) => [value, name === 'quantity' ? 'Unidades' : 'Ingresos']}
                  />
                  <Bar dataKey="quantity" name="Unidades" fill="#8b5cf6" radius={[0, 6, 6, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-1">
                {topProducts.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-background transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-amber-100 text-amber-700' :
                        i === 1 ? 'bg-gray-200 text-gray-600' :
                        i === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">{p.quantity} uds</span>
                      <span className="text-sm font-semibold text-violet-600 tabular-nums">{formatCurrency(p.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Clients */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
                <Medal className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Mejores Clientes</h2>
                <p className="text-xs text-muted-foreground">Por total comprado</p>
              </div>
            </div>
          </div>
          {topClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Users className="w-10 h-10 mb-2 opacity-40" aria-hidden="true" />
              <p className="text-sm">No hay datos de ventas</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={topClients.slice(0, 5)}
                      dataKey="totalSpent"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      strokeWidth={0}
                      label={({ name, percent }) => `${(name ?? '').length > 10 ? (name ?? '').slice(0, 10) + '...' : name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {topClients.slice(0, 5).map((_, i) => (
                        <Cell key={i} fill={['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'][i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      formatter={(value, _name, props) => [formatCurrency(Number(value)), props.payload?.name ?? '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 shrink-0">
                  {topClients.slice(0, 5).map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'][i] }} />
                      <span className="text-foreground font-medium">{c.name}</span>
                      <span className="text-muted-foreground tabular-nums">{formatCurrency(c.totalSpent)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                {topClients.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-background transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-emerald-100 text-emerald-700' :
                        i === 1 ? 'bg-cyan-100 text-cyan-700' :
                        i === 2 ? 'bg-violet-100 text-violet-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {i + 1}
                      </span>
                      <div>
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                        <p className="text-xs text-muted-foreground">{c.purchases} compras · {c.itemCount} artículos</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 tabular-nums">{formatCurrency(c.totalSpent)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cuentas por Pagar y Cobrar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cuentas por Pagar */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-2.5 rounded-xl">
                <CreditCard className="w-5 h-5 text-accent" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Cuentas por Pagar</h2>
                <p className="text-xs text-muted-foreground">{accountsPayable.length} proveedores pendientes</p>
              </div>
            </div>
            <Link
              to="/accounts-payable"
              className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
            >
              Ver todo
            </Link>
          </div>
          {accountsPayable.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <CreditCard className="w-10 h-10 mb-2 opacity-40" aria-hidden="true" />
              <p className="text-sm">No hay cuentas pendientes</p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {accountsPayable.slice(0, 5).map(({ supplier, total }) => (
                  <div key={supplier} className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-background transition-colors">
                    <span className="text-sm font-medium text-foreground">{supplier}</span>
                    <span className="text-sm font-semibold text-accent tabular-nums">{formatCurrency(total)}</span>
                  </div>
                ))}
                {accountsPayable.length > 5 && (
                  <p className="text-xs text-muted-foreground px-3 pt-1">y {accountsPayable.length - 5} más...</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total adeudado</span>
                <span className="text-lg font-bold text-accent tabular-nums">{formatCurrency(totalPayable)}</span>
              </div>
            </>
          )}
        </div>

        {/* Cuentas por Cobrar */}
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/10 p-2.5 rounded-xl">
                <HandCoins className="w-5 h-5 text-secondary" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Cuentas por Cobrar</h2>
                <p className="text-xs text-muted-foreground">{accountsReceivable.length} clientes pendientes</p>
              </div>
            </div>
            <Link
              to="/accounts-receivable"
              className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
            >
              Ver todo
            </Link>
          </div>
          {accountsReceivable.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <HandCoins className="w-10 h-10 mb-2 opacity-40" aria-hidden="true" />
              <p className="text-sm">No hay cuentas pendientes</p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {accountsReceivable.slice(0, 5).map(({ clientName, total }) => (
                  <div key={clientName} className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-background transition-colors">
                    <span className="text-sm font-medium text-foreground">{clientName}</span>
                    <span className="text-sm font-semibold text-secondary tabular-nums">{formatCurrency(total)}</span>
                  </div>
                ))}
                {accountsReceivable.length > 5 && (
                  <p className="text-xs text-muted-foreground px-3 pt-1">y {accountsReceivable.length - 5} más...</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total por cobrar</span>
                <span className="text-lg font-bold text-secondary tabular-nums">{formatCurrency(totalReceivable)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stock Bajo */}
      {products.length > 0 && (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-destructive/10 p-2.5 rounded-xl">
              <Package className="w-5 h-5 text-destructive" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Productos con Stock Bajo</h2>
              <p className="text-xs text-muted-foreground">{lowStock} productos necesitan reposición</p>
            </div>
          </div>
          {lowStock === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Package className="w-10 h-10 mb-2 opacity-40" aria-hidden="true" />
              <p className="text-sm">Todos los productos tienen stock suficiente</p>
            </div>
          ) : (
            <div className="space-y-1">
              {products
                .filter((p) => p.stock < 10)
                .map((p) => (
                  <div key={p.id} className="flex justify-between items-center py-2.5 px-3 rounded-xl hover:bg-background transition-colors">
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      p.stock === 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.stock} unidades
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
