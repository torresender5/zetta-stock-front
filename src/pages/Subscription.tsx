import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Crown,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
  Zap,
} from 'lucide-react'
import Modal from '../components/Modal'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { formatCurrency } from '../lib/utils'
import {
  daysUntil,
  formatSubscriptionEnd,
  PAYMENT_INSTRUCTIONS,
  subscriptionExpired,
} from '../lib/plan'
import type { PaymentOrder, Plan } from '../types'

type Billing = 'monthly' | 'yearly'

const PERIOD_LABELS: Record<string, string> = {
  trial: 'Prueba gratuita',
  monthly: 'Mensual',
  yearly: 'Anual',
}

const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pendiente',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  paid: {
    label: 'Pagada',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  rejected: {
    label: 'Rechazada',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
}

function isFree(plan: Plan) {
  return plan.priceMonthly === 0 && plan.priceYearly === 0
}

export default function Subscription() {
  const {
    subscription,
    paymentOrders,
    plans,
    loading,
    error,
    fetchMySubscription,
    fetchPlans,
    purchase,
  } = useSubscriptionStore()

  const [checkout, setCheckout] = useState<Plan | null>(null)
  const [billing, setBilling] = useState<Billing>('monthly')
  const [createdOrder, setCreatedOrder] = useState<PaymentOrder | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    fetchMySubscription()
    if (plans.length === 0) fetchPlans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const expired = subscriptionExpired(subscription)
  const daysLeft = daysUntil(subscription)
  const currentKey = subscription?.plan?.key

  const handleSelect = (plan: Plan) => {
    setCreatedOrder(null)
    setNotice(null)
    setBilling('monthly')
    if (isFree(plan)) {
      void handlePurchase(plan, 'monthly')
      return
    }
    setCheckout(plan)
  }

  const handlePurchase = async (plan: Plan, period: Billing) => {
    setSubmitting(true)
    setNotice(null)
    const result = await purchase(plan.id, period)
    setSubmitting(false)
    if (!result.ok) {
      setNotice(result.error ?? 'Error al generar la orden')
      return
    }
    if (isFree(plan)) {
      setCheckout(null)
      setNotice(
        `Tu plan Gratis está activo. Tienes ${plan.trialDays ?? 30} días de prueba renovados.`,
      )
      return
    }
    setCreatedOrder(result.order ?? null)
  }

  const closeModal = () => {
    setCheckout(null)
    setCreatedOrder(null)
    setNotice(null)
  }

  const checkoutPrice = useMemo(() => {
    if (!checkout) return 0
    return billing === 'yearly' ? checkout.priceYearly : checkout.priceMonthly
  }, [checkout, billing])

  if (loading && !subscription) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (error && !subscription) {
    return (
      <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
        {error}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suscripción</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tu plan, facturación y renovación.
          </p>
        </div>
      </div>

      {/* Tarjeta del plan actual */}
      <section className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-600 via-indigo-500 to-fuchsia-500" />
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="md:w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 hidden md:flex">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-foreground">
                Plan {subscription?.plan?.name ?? 'Gratis'}
              </h2>
              {expired ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                  <AlertTriangle className="w-3 h-3" /> Vencido
                </span>
              ) : subscription?.status === 'active' ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <BadgeCheck className="w-3 h-3" /> Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3 h-3" /> Inactivo
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {subscription?.plan?.description}
            </p>

            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="w-4 h-4 text-violet-500" />
                {expired ? (
                  <span className="text-red-600 font-medium">
                    Tu plan venció{subscription?.effectiveEnd ? ` el ${formatSubscriptionEnd(subscription)}` : ''}
                  </span>
                ) : (
                  <span>
                    {subscription?.effectiveEnd
                      ? `Vence el ${formatSubscriptionEnd(subscription)}${
                          daysLeft > 0 ? ` (${daysLeft} día${daysLeft === 1 ? '' : 's'} restantes)` : ''
                        }`
                      : 'Sin fecha de vencimiento'}
                  </span>
                )}
              </div>
              {subscription && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4 text-violet-500" />
                  Hasta {subscription.plan?.maxUsers ?? 1} usuario
                  {subscription.plan?.maxUsers === 1 ? '' : 's'}
                </div>
              )}
              {subscription?.price ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="w-4 h-4 text-violet-500" />
                  {formatCurrency(subscription.price)} /{' '}
                  {PERIOD_LABELS[subscription.period] ?? subscription.period}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {expired && (
          <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
            <Lock className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">
              <p className="font-semibold">Tu acceso está restringido</p>
              <p className="mt-0.5">
                No podrás registrar ventas, crear o actualizar información,
                generar reportes ni ver facturas. Elige un plan para reactivar.
              </p>
            </div>
          </div>
        )}
        {notice && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800 font-medium">{notice}</p>
          </div>
        )}
      </section>

      {/* Selección de planes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" /> Elige tu plan
          </h2>
          {!expired && currentKey && plans.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Tu plan actual: <span className="font-semibold text-foreground">{subscription?.plan?.name}</span>
            </span>
          )}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans
            .filter((p) => p.active)
            .map((plan) => {
              const isCurrent = plan.key === currentKey && !expired
              const free = isFree(plan)
              return (
                <div
                  key={plan.id}
                  className={`bg-card border rounded-3xl p-6 flex flex-col shadow-sm ${
                    isCurrent ? 'border-violet-300 ring-2 ring-violet-500/20' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {free ? (
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Zap className="w-4 h-4 text-violet-500" />
                    )}
                    <h3 className="font-bold text-foreground">{plan.name}</h3>
                  </div>
                  <div className="mb-4">
                    {free ? (
                      <span className="text-3xl font-extrabold text-foreground">
                        $0
                      </span>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-foreground">
                            {formatCurrency(plan.priceMonthly)}
                          </span>
                          <span className="text-xs text-muted-foreground">/mes</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatCurrency(plan.priceYearly)}/año · Hasta {plan.maxUsers}{' '}
                          usuario{plan.maxUsers === 1 ? '' : 's'}
                        </p>
                      </>
                    )}
                  </div>
                  <ul className="space-y-1.5 mb-6 flex-1">
                    {(plan.features ?? []).slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={isCurrent}
                    onClick={() => handleSelect(plan)}
                    className={`w-full py-2.5 rounded-2xl font-semibold text-sm transition-colors ${
                      isCurrent
                        ? 'bg-muted text-muted-foreground cursor-default'
                        : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-violet-500/20 cursor-pointer'
                    }`}
                  >
                    {isCurrent ? 'Plan actual' : free ? 'Cambiar a plan Gratis' : 'Elegir plan'}
                  </button>
                </div>
              )
            })}
        </div>
      </section>

      {/* Historial de órdenes */}
      {paymentOrders.length > 0 && (
        <section className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">
              Historial de pagos
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="px-6 py-3 font-medium">Concepto</th>
                  <th className="px-6 py-3 font-medium">Valor</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {paymentOrders.map((order) => {
                  const status = ORDER_STATUS[order.status] ?? ORDER_STATUS.pending
                  return (
                    <tr key={order.id} className="border-b border-border/60 last:border-0">
                      <td className="px-6 py-3.5 text-foreground font-medium">
                        {order.concept}
                      </td>
                      <td className="px-6 py-3.5 text-foreground font-semibold tabular-nums">
                        {formatCurrency(order.amount)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${status.className}`}
                        >
                          {order.status === 'paid' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : order.status === 'rejected' ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal de confirmación de plan */}
      <Modal
        isOpen={!!checkout}
        onClose={closeModal}
        title={createdOrder ? 'Orden generada' : `Elegir plan ${checkout?.name ?? ''}`}
        size="md"
      >
        {checkout && createdOrder ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  Tu orden quedó pendiente de pago
                </p>
                <p className="text-sm text-emerald-700">
                  {checkout.name} · {formatCurrency(createdOrder.amount)} ·{' '}
                  {PERIOD_LABELS[createdOrder.period]}
                </p>
              </div>
            </div>
            <div className="space-y-2 p-5 rounded-2xl bg-muted/60">
              <p className="text-sm font-semibold text-foreground mb-2">
                <ShieldCheck className="inline w-4 h-4 mr-1 text-violet-500" />
                ¿Cómo completar el pago?
              </p>
              <ol className="space-y-2">
                {PAYMENT_INSTRUCTIONS.map((step, i) => (
                  <li key={step} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <button
              onClick={closeModal}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Entendido
            </button>
          </div>
        ) : checkout ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{checkout.description}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setBilling('monthly')}
                className={`flex-1 p-3 rounded-2xl border text-center transition-colors cursor-pointer ${
                  billing === 'monthly'
                    ? 'border-violet-300 bg-violet-50 text-violet-700 ring-1 ring-violet-500/30'
                    : 'border-border text-muted-foreground hover:bg-muted/60'
                }`}
              >
                <p className="text-sm font-semibold">Mensual</p>
                <p className="text-lg font-extrabold text-foreground">
                  {formatCurrency(checkout.priceMonthly)}
                </p>
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`flex-1 p-3 rounded-2xl border text-center transition-colors cursor-pointer ${
                  billing === 'yearly'
                    ? 'border-violet-300 bg-violet-50 text-violet-700 ring-1 ring-violet-500/30'
                    : 'border-border text-muted-foreground hover:bg-muted/60'
                }`}
              >
                <p className="text-sm font-semibold">Anual</p>
                <p className="text-lg font-extrabold text-foreground">
                  {formatCurrency(checkout.priceYearly)}
                </p>
              </button>
            </div>
            {notice && (
              <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
                {notice}
              </p>
            )}
            <button
              disabled={submitting}
              onClick={() => void handlePurchase(checkout, billing)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generando…
                </>
              ) : (
                <>Generar orden · {formatCurrency(checkoutPrice)}</>
              )}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              El plan se activará cuando se confirme el pago.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}