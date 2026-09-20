import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Banknote,
  Wallet,
  PiggyBank,
  ShoppingBag,
  CreditCard,
  Landmark,
  HandCoins,
  ArrowUpCircle,
  ArrowDownCircle,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Coins,
  User,
} from 'lucide-react'
import { cashRegisterService } from '../services/cajaService'
import { formatCurrency, formatDate } from '../lib/utils'
import type {
  CashMovement,
  CashRegister,
  CashRegisterSummary,
  PaymentMethod,
} from '../types'

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  credit: 'Crédito',
}

const MOVEMENT_LABELS: Record<CashMovement['type'], string> = {
  opening: 'Apertura',
  sale: 'Venta',
  expense: 'Gasto',
  withdrawal: 'Retiro',
  deposit: 'Depósito',
  refund: 'Reembolso',
  apartado: 'Apartado',
  closing: 'Cierre',
}

const METHOD_ICONS: Record<PaymentMethod, typeof Banknote> = {
  cash: Banknote,
  card: CreditCard,
  transfer: Landmark,
  credit: HandCoins,
}

const MOVEMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'transfer', 'credit']

const typeColor = (type: CashMovement['type']) => {
  if (type === 'opening' || type === 'closing') return 'bg-gray-100 text-gray-600'
  if (type === 'sale' || type === 'deposit' || type === 'apartado')
    return 'bg-emerald-50 text-emerald-600'
  if (type === 'expense' || type === 'withdrawal' || type === 'refund')
    return 'bg-red-50 text-red-600'
  return 'bg-gray-100 text-gray-600'
}

const typeIcon = (type: CashMovement['type']) => {
  switch (type) {
    case 'opening':
      return <Banknote className="w-4 h-4" />
    case 'sale':
      return <ShoppingBag className="w-4 h-4" />
    case 'apartado':
      return <HandCoins className="w-4 h-4" />
    case 'expense':
    case 'withdrawal':
    case 'refund':
      return <ArrowUpCircle className="w-4 h-4" />
    case 'deposit':
      return <ArrowDownCircle className="w-4 h-4" />
    case 'closing':
      return <LogOut className="w-4 h-4" />
  }
}

function getErrorMessage(err: unknown, fallback: string): string {
  const msg = (
    err as { response?: { data?: { message?: string | string[] } } }
  )?.response?.data?.message
  if (typeof msg === 'string') return msg
  if (Array.isArray(msg)) return msg.join(', ')
  return fallback
}

export default function CashRegisterDetails() {
  const { id } = useParams<{ id: string }>()
  const [register, setRegister] = useState<CashRegister | null>(null)
  const [summary, setSummary] = useState<CashRegisterSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setNotFound(false)
    Promise.all([
      cashRegisterService.getById(id),
      cashRegisterService.getSummary(id),
    ])
      .then(([reg, sum]) => {
        if (cancelled) return
        if (!reg) {
          setNotFound(true)
          return
        }
        setRegister(reg)
        setSummary(sum)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(getErrorMessage(err, 'Error al cargar la caja'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading && !register) {
    return (
      <div className="max-w-6xl mx-auto animate-pulse">
        <div className="h-6 w-40 bg-gray-100 rounded-lg mb-6" />
        <div className="h-40 bg-gradient-to-r from-violet-200 to-indigo-200 rounded-3xl mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
          ))}
        </div>
        <div className="mt-6 h-64 bg-gray-100 rounded-3xl" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="max-w-6xl mx-auto">
        <Link
          to="/caja"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Caja
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <PiggyBank className="w-12 h-12 mb-3 opacity-40" aria-hidden="true" />
          <p className="text-lg font-medium text-gray-900">Caja no encontrada</p>
          <p className="text-sm">La caja solicitada no existe o no tienes acceso.</p>
        </div>
      </div>
    )
  }

  if (!register || (error && !loading)) {
    return (
      <div className="max-w-6xl mx-auto">
        <Link
          to="/caja"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Caja
        </Link>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mb-3 opacity-40" aria-hidden="true" />
          <p className="text-sm">{error ?? 'No se pudo cargar la caja'}</p>
        </div>
      </div>
    )
  }

  const diff = register.difference ?? 0
  const movements = register.movements ?? []
  const expected = summary?.expectedTotal ?? 0
  const counted = summary?.countedTotal ?? 0
  const isSobrante = diff >= 0

  const summaryCards = [
    {
      label: 'Total esperado',
      value: expected,
      icon: Wallet,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Total contado',
      value: counted,
      icon: Coins,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Diferencia',
      value: Math.abs(diff),
      icon: isSobrante ? CheckCircle2 : AlertTriangle,
      color: isSobrante ? 'text-emerald-600' : 'text-red-600',
      bg: isSobrante ? 'bg-emerald-50' : 'bg-red-50',
    },
    {
      label: 'Ventas',
      value: summary?.salesTotal ?? 0,
      icon: ShoppingBag,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Egresos (gastos/retiros)',
      value: Math.abs(summary?.outcomesTotal ?? 0),
      icon: ArrowUpCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Depósitos',
      value: summary?.incomesTotal ?? 0,
      icon: ArrowDownCircle,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        to="/caja"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a Caja
      </Link>

      <div className="rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-6 mb-6">
        <div className="flex items-center gap-3">
          <span className="bg-white/20 p-2.5 rounded-xl">
            <PiggyBank className="w-5 h-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold truncate">{register.name}</h1>
            <p className="text-sm text-white/80 flex items-center gap-1 mt-0.5">
              <User className="w-3.5 h-3.5" aria-hidden="true" />
              {register.user?.name ?? 'Sin usuario'} · Cerrada el{' '}
              {formatDate(register.closedAt ?? register.openedAt)}
            </p>
          </div>
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold shrink-0">
            Cerrada
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
          <span>Abierta {formatDate(register.openedAt)}</span>
          <span>
            Base {formatCurrency(register.baseAmount)}
          </span>
          <span>
            {summary?.movementCount ?? movements.length} movimientos
          </span>
          <span className="inline-flex items-center gap-1">
            {isSobrante ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {isSobrante ? 'Sobrante' : 'Faltante'} de{' '}
            {formatCurrency(Math.abs(diff))}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl border border-border p-4 bg-card"
          >
            <div className={`${bg} p-2.5 rounded-xl w-fit mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} aria-hidden="true" />
            </div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold text-foreground mt-1 tabular-nums">
              {formatCurrency(value)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MOVEMENT_METHODS.map((method) => {
          const Icon = METHOD_ICONS[method]
          const expectedM = summary?.expectedByMethod?.[method] ?? 0
          const salesM = summary?.salesByMethod?.[method] ?? 0
          return (
            <div
              key={method}
              className="rounded-2xl border border-border p-4 bg-card"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-gray-600" aria-hidden="true" />
                <p className="text-sm font-medium text-foreground">
                  {METHOD_LABELS[method]}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">Esperado</p>
              <p className="text-base font-bold text-foreground tabular-nums">
                {formatCurrency(expectedM)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Ventas</p>
              <p className="text-sm font-semibold text-emerald-600 tabular-nums">
                {formatCurrency(salesM)}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-6 bg-card rounded-3xl p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2.5 rounded-xl">
              <Coins className="w-5 h-5 text-gray-600" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Movimientos
              </h3>
              <p className="text-xs text-muted-foreground">
                {movements.length} registros
              </p>
            </div>
          </div>
        </div>

        {movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Coins className="w-10 h-10 mb-2 opacity-40" aria-hidden="true" />
            <p className="text-sm">Sin movimientos en esta caja</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {movements.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span
                  className={`${typeColor(m.type)} p-2 rounded-xl shrink-0`}
                >
                  {typeIcon(m.type)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {MOVEMENT_LABELS[m.type]}{' '}
                    {m.type === 'sale' && m.saleId
                      ? `· ${METHOD_LABELS[m.paymentMethod]}`
                      : ''}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {m.description ||
                      `${METHOD_LABELS[m.paymentMethod]} · ${formatDate(m.createdAt)}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      m.amount > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {m.amount > 0 ? '+' : ''}
                    {formatCurrency(Math.abs(m.amount))}
                  </span>
                  <p className="text-xs text-gray-400">
                    {formatDate(m.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}