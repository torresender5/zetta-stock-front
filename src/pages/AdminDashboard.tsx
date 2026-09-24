import { useEffect, useState } from 'react'
import {
  Building2,
  CreditCard,
  Loader2,
  ShieldAlert,
  Timer,
  TrendingUp,
  Users,
  Wallet,
  AlertTriangle,
  ShoppingCart,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { adminService } from '../services/adminService'
import { formatCurrency } from '../lib/utils'
import type { AdminDashboardData } from '../types'

const PIE_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#6366f1']

const currencyCompact = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    notation: 'compact',
  }).format(value)

function monthLabel(month: string): string {
  const [y, m] = month.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('es-CO', { month: 'short' })
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const result = await adminService.getDashboard()
        if (!cancelled) setData(result)
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Error al cargar el dashboard')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
          {error}
        </div>
      </div>
    )
  }

  if (!data) return null

  const kpis = [
    {
      label: 'Empresas registradas',
      value: String(data.companies.total),
      sub: `${data.companies.active} activas · ${data.companies.inactive} inactivas`,
      icon: Building2,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Nuevas (30 días)',
      value: String(data.companies.newLast30Days),
      sub: 'altas recientes',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Usuarios',
      value: String(data.users.total),
      sub: 'en todo el sistema',
      icon: Users,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
    {
      label: 'MRV',
      value: formatCurrency(data.mrv),
      sub: 'ingreso mensual recurrente',
      icon: Wallet,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Suscripciones activas',
      value: String(data.subscriptions.active),
      sub: `${data.subscriptions.trial} en prueba · ${data.subscriptions.paidMonthly + data.subscriptions.paidYearly} pagas`,
      icon: CreditCard,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
    },
    {
      label: 'Por vencer (7 días)',
      value: String(data.subscriptions.expiringSoon),
      sub: `${data.subscriptions.expired} vencidas`,
      icon: Timer,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Órdenes pendientes',
      value: String(data.pendingOrders),
      sub: 'falta confirmar pago',
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Ventas del mes',
      value: formatCurrency(data.monthSales.total),
      sub: `${data.monthSales.count} ventas`,
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Compras del mes',
      value: formatCurrency(data.monthPurchases.total),
      sub: `${data.monthPurchases.count} compras`,
      icon: ShoppingCart,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ]

  const registrations = data.registrationsByMonth.map((r) => ({
    label: monthLabel(r.month),
    ...r,
  }))
  const planPie = data.plans
    .filter((p) => p.companies > 0)
    .map((p) => ({ name: p.name, value: p.companies }))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-violet-600" /> Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Panorama global de la plataforma en tiempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`${bg} p-3 rounded-xl`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-xl font-bold text-foreground tabular-nums truncate">
                  {value}
                </p>
                <p className="text-xs text-muted-foreground truncate">{sub}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-1">
            Empresas registradas
          </h2>
          <p className="text-xs text-muted-foreground mb-5">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={registrations}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(value) => [value, 'Empresas']}
              />
              <Bar dataKey="count" name="Empresas" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-1">
            Distribución por plan
          </h2>
          <p className="text-xs text-muted-foreground mb-5">Empresas por plan contratado</p>
          {planPie.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Sin datos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={planPie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  strokeWidth={0}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {planPie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-1">
          Top empresas por ventas
        </h2>
        <p className="text-xs text-muted-foreground mb-5">Últimos 6 meses</p>
        {data.topCompanies.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            Sin ventas registradas
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.topCompanies} layout="vertical" margin={{ left: 20, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tickFormatter={currencyCompact} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={130}
                tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 18) + '...' : v)}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(value) => [formatCurrency(Number(value)), 'Ventas']}
              />
              <Legend />
              <Bar dataKey="total" name="Ventas" fill="#06b6d4" radius={[0, 6, 6, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}