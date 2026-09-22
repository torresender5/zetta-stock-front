import { useEffect, useState } from 'react'
import {
  BadgeCheck,
  CalendarClock,
  CreditCard,
  Loader2,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { subscriptionService } from '../services/subscriptionService'
import { formatCurrency } from '../lib/utils'
import { formatSubscriptionEnd } from '../lib/plan'
import type { Plan } from '../types'

type AdminSubscription = {
  id: number
  companyId: number
  companyName: string
  status: string
  period: string
  price: number
  effectiveEnd: string | null
  plan: Plan
  userCount: number
}

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await subscriptionService.getSubscriptions()
        if (!cancelled) setSubscriptions(data)
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Error al cargar las suscripciones')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const isExpired = (sub: AdminSubscription) =>
    !!sub.effectiveEnd && new Date(sub.effectiveEnd).getTime() <= Date.now()

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-violet-600" /> Suscripciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Estado de las suscripciones de todas las empresas.
        </p>
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
      ) : subscriptions.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-10 text-center">
          <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No hay suscripciones registradas
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subscriptions.map((sub) => {
            const expired = isExpired(sub)
            return (
              <div key={sub.id} className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-foreground">{sub.companyName}</h3>
                  {expired ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                      Vencida
                    </span>
                  ) : sub.status === 'active' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <BadgeCheck className="w-3 h-3" /> Activa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Inactiva
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Plan <span className="font-semibold text-foreground">{sub.plan?.name}</span> ·{' '}
                  <span className="uppercase text-xs">{sub.period}</span>
                </p>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-violet-500" />
                    {sub.userCount} usuario{sub.userCount === 1 ? '' : 's'}
                    {sub.plan?.maxUsers ? ` / ${sub.plan.maxUsers}` : ''}
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-violet-500" />
                    {sub.effectiveEnd
                      ? `Vence el ${formatSubscriptionEnd(sub)}`
                      : 'Sin fecha de corte'}
                  </p>
                  {sub.price > 0 && (
                    <p className="font-semibold text-foreground tabular-nums">
                      {formatCurrency(sub.price)} / <span className="uppercase text-xs">{sub.period}</span>
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}