import { AlertTriangle, ArrowRight, BadgeCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { daysUntil, formatSubscriptionEnd, subscriptionExpired } from '../lib/plan'

export default function SubscriptionBanner() {
  const subscription = useSubscriptionStore((s) => s.subscription)
  const loading = useSubscriptionStore((s) => s.loading)

  if (loading || !subscription) return null

  const expired = subscriptionExpired(subscription)
  const daysLeft = daysUntil(subscription)
  const isPaid = subscription.period === 'monthly' || subscription.period === 'yearly'
  const isTrial = subscription.period === 'trial'

  // Suscripción de pago vigente: aviso discreto.
  if (isPaid && !expired) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-4 no-print">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">
          <BadgeCheck className="w-4 h-4 shrink-0" />
          <span className="flex-1">
            Plan {subscription.plan?.name ?? ''} activo hasta{' '}
            {formatSubscriptionEnd(subscription)}
          </span>
          <Link
            to="/suscripcion"
            className="text-emerald-700 font-semibold hover:underline shrink-0"
          >
            Ver detalle
          </Link>
        </div>
      </div>
    )
  }

  if (expired) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-4 no-print">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">
            Tu plan ha vencido. Reactiva tu suscripción para seguir usando
            ZettaStock.
          </span>
          <Link
            to="/suscripcion"
            className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0"
          >
            Renovar <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    )
  }

  // Prueba gratuita cerca de vencer.
  if (isTrial && daysLeft <= 7) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 pt-4 no-print">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">
            Tu plan gratuito vence el {formatSubscriptionEnd(subscription)}{' '}
            {daysLeft === 1 ? '(mañana)' : `(${daysLeft} días)`}. Elige un plan
            para no interrumpir tu operación.
          </span>
          <Link
            to="/suscripcion"
            className="inline-flex items-center gap-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            Mejorar plan <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    )
  }

  return null
}