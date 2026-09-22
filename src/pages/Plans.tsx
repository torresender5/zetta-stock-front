import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Crown, Loader2, Sparkles, Zap } from 'lucide-react'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { formatCurrency } from '../lib/utils'
import type { Plan } from '../types'

type Billing = 'monthly' | 'yearly'

function isFree(plan: Plan) {
  return plan.priceMonthly === 0 && plan.priceYearly === 0
}

function PlanCard({
  plan,
  billing,
  highlight,
  onSelect,
}: {
  plan: Plan
  billing: Billing
  highlight: boolean
  onSelect: () => void
}) {
  const price = billing === 'yearly' ? plan.priceYearly : plan.priceMonthly
  const free = isFree(plan)
  return (
    <div
      className={`relative flex flex-col bg-card border rounded-3xl p-6 sm:p-7 shadow-lg transition-transform hover:-translate-y-1 ${
        highlight
          ? 'border-violet-300 ring-2 ring-violet-500/30 shadow-violet-500/20'
          : 'border-border shadow-slate-200/60'
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-violet-500/30">
          <Crown className="w-3 h-3" /> Recomendado
        </span>
      )}
      <div className="flex items-center gap-2 mb-1">
        {free ? (
          <Sparkles className="w-5 h-5 text-emerald-500" />
        ) : (
          <Zap className="w-5 h-5 text-violet-500" />
        )}
        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        {plan.description}
      </p>
      <div className="mb-6">
        {free ? (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-foreground">$0</span>
            <span className="text-muted-foreground text-sm">para siempre</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-foreground">
              {formatCurrency(price)}
            </span>
            <span className="text-muted-foreground text-sm">
              /{billing === 'yearly' ? 'año' : 'mes'}
            </span>
          </div>
        )}
        {!free && billing === 'yearly' && (
          <p className="text-xs text-emerald-600 font-medium mt-1">
            Ahorra 2 meses pagando anual
          </p>
        )}
      </div>
      <ul className="space-y-2.5 mb-7 flex-1">
        {(plan.features ?? []).map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        className={`w-full py-3 rounded-2xl font-semibold text-sm transition-colors cursor-pointer ${
          highlight
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:opacity-90'
            : 'bg-muted text-foreground hover:bg-gray-200'
        }`}
      >
        {free ? 'Empezar gratis' : 'Contratar plan'}
      </button>
    </div>
  )
}

export default function Plans() {
  const [billing, setBilling] = useState<Billing>('monthly')
  const plans = useSubscriptionStore((s) => s.plans)
  const loading = useSubscriptionStore((s) => s.loading)
  const error = useSubscriptionStore((s) => s.error)
  const fetchPlans = useSubscriptionStore((s) => s.fetchPlans)

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const recommendedKey = useMemo(() => {
    if (plans.length === 0) return 'pro'
    return plans[plans.length - 1]?.key ?? 'pro'
  }, [plans])

  if (error) {
    return (
      <PublicShell>
        <div className="text-center p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl">
          {error}
        </div>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-600 bg-violet-50 border border-violet-100 px-3 py-1.5 rounded-full mb-4">
          <Crown className="w-3.5 h-3.5" /> Planes y precios
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">
          El plan perfecto para tu negocio
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Empieza gratis con 30 días de prueba y crece cuando lo necesites. Sin
          tarjeta de crédito.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 mb-10">
        <button
          onClick={() => setBilling('monthly')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
            billing === 'monthly'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-gray-200'
          }`}
        >
          Mensual
        </button>
        <button
          onClick={() => setBilling('yearly')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
            billing === 'yearly'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-gray-200'
          }`}
        >
          Anual
          <span className="ml-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
            -17%
          </span>
        </button>
      </div>

      {loading && !plans.length ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {plans
            .filter((p) => p.active)
            .map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billing={billing}
                highlight={plan.key === recommendedKey}
                onSelect={() => (window.location.href = '/register')}
              />
            ))}
        </div>
      )}
    </PublicShell>
  )
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-violet-50/40">
      <header className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
        <Link to="/login" className="flex items-center gap-2">
          <img src="/logo.png" alt="zettastock" className="h-8 w-auto object-contain" />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-opacity shadow-md shadow-violet-500/20"
          >
            Crear cuenta
          </Link>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-5 pb-16">{children}</main>
      <footer className="border-t border-border/60 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ZettaStock · Facturación e inventario para
        tu negocio
      </footer>
    </div>
  )
}