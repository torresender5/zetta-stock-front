import { useState, useEffect, useMemo } from 'react'
import {
  Wallet,
  Plus,
  LogOut,
  ArrowDownCircle,
  ArrowUpCircle,
  ShoppingBag,
  PiggyBank,
  Banknote,
  CreditCard,
  Landmark,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Coins,
  HandCoins,
  ChevronRight,
} from 'lucide-react'
import { useCajaStore } from '../stores/cajaStore'
import { formatCurrency, formatDate } from '../lib/utils'
import Modal from '../components/Modal'
import { useNavigate } from 'react-router-dom'
import type { CashMovement, PaymentMethod } from '../types'

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
const MOVEMENT_TYPES = [
  { value: 'expense', label: 'Gasto' },
  { value: 'withdrawal', label: 'Retiro' },
  { value: 'deposit', label: 'Depósito' },
] as const

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

export default function Caja() {
  const navigate = useNavigate()
  const {
    active,
    summary,
    registers,
    loading,
    error,
    fetchActive,
    fetchRegisters,
    fetchDetail,
    openRegister,
    closeRegister,
    addMovement,
  } = useCajaStore()

  const [movements, setMovements] = useState<CashMovement[]>([])
  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [movementModal, setMovementModal] = useState(false)
  const [baseAmount, setBaseAmount] = useState(0)
  const [counts, setCounts] = useState<Record<PaymentMethod, number>>({
    cash: 0,
    card: 0,
    transfer: 0,
    credit: 0,
  })
  const [movementType, setMovementType] =
    useState<(typeof MOVEMENT_TYPES)[number]['value']>('expense')
  const [movementMethod, setMovementMethod] = useState<PaymentMethod>('cash')
  const [movementAmount, setMovementAmount] = useState(0)
  const [movementDescription, setMovementDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    fetchActive()
    fetchRegisters()
  }, [])

  useEffect(() => {
    if (active) {
      fetchDetail(active.id).then((d) => {
        if (d) setMovements(d.movements ?? [])
      })
      setOpenModal(false)
    }
  }, [active?.id])

  const counted = useMemo(
    () => Object.values(counts).reduce((s, v) => s + (Number(v) || 0), 0),
    [counts],
  )
  const expected = summary?.expectedTotal ?? 0
  const difference = counted - expected

  const handleOpen = async () => {
    if (baseAmount < 0 || submitting) return
    setSubmitting(true)
    setActionError(null)
    const result = await openRegister({ baseAmount })
    if (!result.ok) setActionError(result.error ?? 'Error al abrir la caja')
    setSubmitting(false)
    if (result.ok) setOpenModal(false)
  }

  const handleClose = async () => {
    if (submitting) return
    setSubmitting(true)
    setActionError(null)
    const result = await closeRegister({ ...counts })
    setSubmitting(false)
    if (result.ok) {
      setCloseModal(false)
      setMovements([])
    } else {
      setActionError(result.error ?? 'Error al cerrar la caja')
    }
  }

  const handleAddMovement = async () => {
    if (movementAmount <= 0 || submitting) return
    setSubmitting(true)
    setActionError(null)
    const result = await addMovement({
      type: movementType,
      paymentMethod: movementMethod,
      amount: movementAmount,
      description: movementDescription.trim() || undefined,
    })
    setSubmitting(false)
    if (result.ok) {
      setMovementModal(false)
      setMovementAmount(0)
      setMovementDescription('')
      setMovementType('expense')
      setMovementMethod('cash')
    } else {
      setActionError(result.error ?? 'Error al registrar el movimiento')
    }
  }

  const summaryCards = [
    {
      label: 'Total esperado',
      value: expected,
      icon: Wallet,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
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
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caja</h1>
          <p className="text-sm text-gray-500 mt-1">
            Control de ingresos, egresos y arqueo por turno
          </p>
        </div>
        {!active && (
          <button
            onClick={() => { setActionError(null); setOpenModal(true) }}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Abrir caja
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {!active ? (
        <div className="bg-card rounded-3xl p-10 shadow-sm border border-border flex flex-col items-center text-center">
          <div className="p-4 bg-violet-50 rounded-2xl mb-4">
            <Wallet className="w-10 h-10 text-violet-600" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            No hay caja abierta
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Abre tu turno para registrar ventas, gastos y hacer el arqueo al
            final del día.
          </p>
          <button
            onClick={() => { setActionError(null); setOpenModal(true) }}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Abrir caja
          </button>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-3xl p-6 shadow-sm border border-border mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-3 rounded-2xl">
                  <Wallet className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {active.name}
                  </h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Abierta el {formatDate(active.openedAt)} · Base{' '}
                    {formatCurrency(active.baseAmount)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setActionError(null); setMovementModal(true) }}
                  className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Gasto / Retiro / Depósito
                </button>
                <button
                  onClick={() => {
                    setCounts({
                      cash: Math.max(0, summary?.expectedByMethod?.cash ?? 0),
                      card: Math.max(0, summary?.expectedByMethod?.card ?? 0),
                      transfer: Math.max(0, summary?.expectedByMethod?.transfer ?? 0),
                      credit: Math.max(0, summary?.expectedByMethod?.credit ?? 0),
                    })
                    setActionError(null)
                    setCloseModal(true)
                  }}
                  className="flex items-center gap-1.5 text-sm font-medium text-white bg-red-600 px-4 py-2 rounded-xl hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/25 transition-all"
                >
                  <LogOut className="w-4 h-4" /> Cerrar caja
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {MOVEMENT_METHODS.map((method) => {
                const Icon = METHOD_ICONS[method]
                const total = summary?.salesByMethod?.[method] ?? 0
                return (
                  <div
                    key={method}
                    className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3 py-2.5"
                  >
                    <Icon className="w-4 h-4 text-gray-500" aria-hidden="true" />
                    <div>
                      <p className="text-xs text-gray-500">
                        {METHOD_LABELS[method]}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 tabular-nums">
                        {formatCurrency(total)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
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
                    {movements.length} registros en este turno
                  </p>
                </div>
              </div>
            </div>

            {movements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Coins className="w-10 h-10 mb-2 opacity-40" aria-hidden="true" />
                <p className="text-sm">Sin movimientos en este turno</p>
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
                        {m.description || `${METHOD_LABELS[m.paymentMethod]} · ${formatDate(m.createdAt)}`}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold tabular-nums shrink-0 ${
                        m.amount > 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {m.amount > 0 ? '+' : ''}
                      {formatCurrency(Math.abs(m.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <PiggyBank className="w-5 h-5 text-gray-500" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-900">
            Historial de cierres
          </h2>
        </div>
        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
          {registers.filter((r) => r.status === 'closed').length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <PiggyBank className="w-10 h-10 mb-2 opacity-40" aria-hidden="true" />
              <p className="text-sm">Aún no hay cierres de caja</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {registers
                .filter((r) => r.status === 'closed')
                .map((r) => {
                const diff = r.difference ?? 0
                const Icon = r.status === 'open' ? Wallet : PiggyBank
                return (
                  <div
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/caja/${r.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/caja/${r.id}`)
                      }
                    }}
                    className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <span className="bg-gray-100 text-gray-600 p-2 rounded-xl shrink-0">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {r.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {r.user?.name ? `${r.user.name} · ` : ''}
                        {r.closedAt
                          ? `Cerrada ${formatDate(r.closedAt)}`
                          : `Abierta ${formatDate(r.openedAt)}`}
                      </p>
                    </div>
                    {r.status === 'closed' && (
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-gray-900 tabular-nums">
                          {formatCurrency(r.expectedTotal ?? 0)}
                        </p>
                        <p
                          className={`text-xs inline-flex items-center gap-1 ${
                            diff < 0 ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {diff < 0 ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {diff < 0 ? 'Faltante' : 'Sobrante'} de{' '}
                          {formatCurrency(Math.abs(diff))}
                        </p>
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" aria-hidden="true" />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title="Abrir caja"
        size="sm"
      >
        <div className="space-y-5">
          {actionError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {actionError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Monto base (apertura) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                $
              </span>
              <input
                type="number"
                min={0}
                step={1}
                required
                value={baseAmount}
                onChange={(e) => setBaseAmount(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all tabular-nums"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Dinero en efectivo con el que inicias el turno (COP).
            </p>
          </div>
          <button
            onClick={handleOpen}
            disabled={baseAmount < 0 || submitting}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50"
          >
            {submitting ? 'Abriendo...' : 'Abrir caja'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={movementModal}
        onClose={() => setMovementModal(false)}
        title="Registrar movimiento"
        size="sm"
      >
        <div className="space-y-4">
          {actionError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {actionError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tipo *
            </label>
            <div className="flex gap-2">
              {MOVEMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setMovementType(t.value)}
                  className={`flex-1 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-colors cursor-pointer ${
                    movementType === t.value
                      ? t.value === 'deposit'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-red-500 bg-red-50 text-red-600'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Medio *
              </label>
              <select
                value={movementMethod}
                onChange={(e) => setMovementMethod(e.target.value as PaymentMethod)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all bg-white"
              >
                {MOVEMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Monto *
              </label>
              <input
                type="number"
                min={0}
                step="100"
                required
                value={movementAmount}
                onChange={(e) => setMovementAmount(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all tabular-nums"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descripción
            </label>
            <textarea
              rows={2}
              value={movementDescription}
              onChange={(e) => setMovementDescription(e.target.value)}
              placeholder="Motivo del movimiento..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={() => setMovementModal(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddMovement}
              disabled={movementAmount <= 0 || submitting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={closeModal}
        onClose={() => setCloseModal(false)}
        title="Cerrar caja (arqueo)"
        size="md"
      >
        <div className="space-y-5">
          {actionError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {actionError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {MOVEMENT_METHODS.map((method) => {
              const Icon = METHOD_ICONS[method]
              return (
                <div key={method}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-gray-500" />
                    {METHOD_LABELS[method]} (COP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="100"
                    value={counts[method]}
                    onChange={(e) =>
                      setCounts((c) => ({
                        ...c,
                        [method]: Number(e.target.value),
                      }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all tabular-nums"
                    placeholder="0"
                  />
                </div>
              )
            })}
          </div>

          <div className="rounded-xl bg-gray-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total esperado</span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(expected)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total contado</span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(counted)}
              </span>
            </div>
            <div
              className={`flex justify-between font-semibold border-t pt-2 ${
                difference < 0 ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {difference < 0 ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {difference < 0 ? 'Faltante' : 'Sobrante'}
              </span>
              <span className="tabular-nums">
                {formatCurrency(Math.abs(difference))}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={() => setCloseModal(false)}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Volver
            </button>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/25 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {submitting ? 'Cerrando...' : 'Cerrar caja'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}