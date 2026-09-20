import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  PackagePlus,
  CheckCircle,
  Clock,
  XCircle,
  HandCoins,
  Trash2,
  CreditCard,
  Landmark,
  Banknote,
  FileText,
  TrendingDown,
  AlertTriangle,
  User,
  CalendarDays,
} from 'lucide-react'
import { useApartadoStore } from '../stores/apartadoStore'
import { formatCurrency, formatDate, formatDateOnly } from '../lib/utils'
import Modal from '../components/Modal'
import type { ApartadoStatus, PaymentMethod } from '../types'

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  credit: 'Crédito',
}

const METHOD_ICONS: Record<PaymentMethod, typeof Banknote> = {
  cash: Banknote,
  card: CreditCard,
  transfer: Landmark,
  credit: HandCoins,
}

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'transfer']

function statusBadge(status: ApartadoStatus) {
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-green-50 text-green-600">
        <CheckCircle className="w-4 h-4" /> Saldado
      </span>
    )
  }
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600">
        <XCircle className="w-4 h-4" /> Cancelado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-orange-50 text-orange-600">
      <Clock className="w-4 h-4" /> Activo
    </span>
  )
}

export default function ApartadoDetails() {
  const { id } = useParams<{ id: string }>()
  const {
    apartado,
    loading,
    error,
    fetchApartadoById,
    addPayment,
    completeApartado,
    cancelApartado,
  } = useApartadoStore()

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [cancelReason, setCancelReason] = useState('')
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('cash')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    void fetchApartadoById(id).catch(() => {})
  }, [id, fetchApartadoById])

  const balance = useMemo(
    () => (apartado ? Math.max(apartado.total - apartado.totalPaid, 0) : 0),
    [apartado],
  )
  const progress = useMemo(
    () =>
      apartado && apartado.total > 0
        ? Math.min((apartado.totalPaid / apartado.total) * 100, 100)
        : 0,
    [apartado],
  )

  const openPayment = () => {
    setAmount(balance)
    setMethod('cash')
    setFormError(null)
    setPaymentOpen(true)
  }

  const openComplete = () => {
    setMethod('cash')
    setFormError(null)
    setCompleteOpen(true)
  }

  const openCancel = () => {
    setCancelReason('')
    setRefundMethod('cash')
    setFormError(null)
    setCancelOpen(true)
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apartado || submitting) return
    const value = Number(amount) || 0
    if (value <= 0) {
      setFormError('El monto debe ser mayor a 0')
      return
    }
    if (value > balance) {
      setFormError('El abono no puede superar el saldo pendiente')
      return
    }
    setSubmitting(true)
    setFormError(null)
    const result = await addPayment(apartado.id, value, method)
    setSubmitting(false)
    if (result.ok) {
      setPaymentOpen(false)
    } else {
      setFormError(result.error ?? 'Error al registrar el abono')
    }
  }

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apartado || submitting) return
    setSubmitting(true)
    setFormError(null)
    const result = await completeApartado(apartado.id, method)
    setSubmitting(false)
    if (result.ok) {
      setCompleteOpen(false)
    } else {
      setFormError(result.error ?? 'Error al completar el apartado')
    }
  }

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apartado || submitting) return
    if (!cancelReason.trim()) {
      setFormError('Indica el motivo de la cancelación')
      return
    }
    setSubmitting(true)
    setFormError(null)
    const result = await cancelApartado(
      apartado.id,
      cancelReason.trim(),
      apartado.totalPaid > 0 ? refundMethod : undefined,
    )
    setSubmitting(false)
    if (result.ok) {
      setCancelOpen(false)
    } else {
      setFormError(result.error ?? 'Error al cancelar el apartado')
    }
  }

  if (loading && !apartado) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 text-sm">
        Cargando apartado...
      </div>
    )
  }

  if (error || !apartado) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <PackagePlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600">{error ?? 'El apartado no existe'}</p>
        <Link
          to="/apartados"
          className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-violet-600 hover:text-violet-700"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a apartados
        </Link>
      </div>
    )
  }

  const isActive = apartado.status === 'active'

  return (
    <div className="space-y-6">
      <Link
        to="/apartados"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a apartados
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">
              {apartado.apartadoNumber}
            </h1>
            {statusBadge(apartado.status)}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Creado el {formatDate(apartado.createdAt)}
          </p>
        </div>
        {isActive && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={openPayment}
              className="flex items-center gap-2 bg-white border border-border text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <HandCoins className="w-4 h-4" /> Registrar abono
            </button>
            <button
              onClick={openComplete}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium"
            >
              <CheckCircle className="w-4 h-4" /> Completar y facturar
            </button>
            <button
              onClick={openCancel}
              className="flex items-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" /> Cancelar
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Productos apartados
            </h2>
            <div className="divide-y divide-gray-100">
              {apartado.items.map((item, index) => (
                <div
                  key={item.id ?? `${item.productId}-${index}`}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.productName}
                      {item.size ? ` · ${item.size}` : ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-3 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="tabular-nums">
                  {formatCurrency(apartado.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>IVA (19%)</span>
                <span className="tabular-nums">{formatCurrency(apartado.tax)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span className="tabular-nums">
                  {formatCurrency(apartado.total)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Historial de pagos
            </h2>
            {apartado.payments && apartado.payments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {apartado.payments.map((p) => {
                  const Icon = METHOD_ICONS[p.paymentMethod]
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-50 text-violet-600 shrink-0">
                          <Icon className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {METHOD_LABELS[p.paymentMethod]}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(p.date)}
                            {p.description ? ` · ${p.description}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600 tabular-nums">
                        +{formatCurrency(p.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aún no hay pagos registrados</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Cliente</h2>
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-500">
                <User className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {apartado.client?.name ?? '—'}
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  {apartado.client?.document ?? ''}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                <span>Fecha: {formatDateOnly(apartado.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                <span>
                  Vence:{' '}
                  {apartado.dueDate ? formatDateOnly(apartado.dueDate) : '—'}
                </span>
              </div>
            </div>
            {apartado.notes && (
              <p className="mt-4 pt-4 border-t border-border text-sm text-gray-600">
                {apartado.notes}
              </p>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Pagos</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(apartado.total)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Abonado</span>
                <span className="font-medium text-emerald-600 tabular-nums">
                  {formatCurrency(apartado.totalPaid)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Saldo pendiente</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(balance)}
                </span>
              </div>
            </div>
          </div>

          {apartado.status === 'paid' && apartado.saleId && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm">
                <CheckCircle className="w-4 h-4" /> Venta generada
              </div>
              <p className="text-xs text-emerald-600 mt-1.5">
                Este apartado se completó y generó la venta y factura
                correspondientes.
              </p>
              <Link
                to={`/sales/${apartado.saleId}`}
                className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                <FileText className="w-4 h-4" /> Ver venta
              </Link>
            </div>
          )}

          {apartado.status === 'cancelled' && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
                <XCircle className="w-4 h-4" /> Apartado cancelado
              </div>
              <p className="text-xs text-red-600 mt-1.5">
                El stock fue restaurado
                {apartado.totalPaid > 0
                  ? ' y se registró el reembolso de los abonos en la caja.'
                  : '.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Registrar abono"
      >
        <form onSubmit={handlePayment} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {formError}
            </div>
          )}
          <p className="text-sm text-gray-500">
            Saldo pendiente:{' '}
            <span className="font-semibold text-gray-900">
              {formatCurrency(balance)}
            </span>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Monto (COP)
            </label>
            <input
              required
              type="number"
              min={1}
              max={balance}
              step={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Medio de pago
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {METHOD_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setPaymentOpen(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Registrar abono'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={completeOpen}
        onClose={() => setCompleteOpen(false)}
        title="Completar apartado"
      >
        <form onSubmit={handleComplete} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {formError}
            </div>
          )}
          <div className="rounded-xl bg-violet-50 p-4 text-sm text-violet-700 space-y-1.5">
            <div className="flex justify-between">
              <span>Saldo a cobrar</span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(balance)}
              </span>
            </div>
            <p className="text-xs text-violet-600">
              Se generará la venta y la factura del apartado al confirmar.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Medio de pago del saldo
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {METHOD_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setCompleteOpen(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50"
            >
              {submitting ? 'Procesando...' : 'Confirmar y facturar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancelar apartado"
      >
        <form onSubmit={handleCancel} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {formError}
            </div>
          )}
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Se restaurará el stock de los productos
              {apartado.totalPaid > 0
                ? ` y se reembolsará ${formatCurrency(apartado.totalPaid)} en la caja.`
                : '.'}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Motivo *
            </label>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="Describe el motivo de la cancelación"
            />
          </div>
          {apartado.totalPaid > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Medio del reembolso
              </label>
              <select
                value={refundMethod}
                onChange={(e) =>
                  setRefundMethod(e.target.value as PaymentMethod)
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setCancelOpen(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <TrendingDown className="w-4 h-4" />
              {submitting ? 'Cancelando...' : 'Confirmar cancelación'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}