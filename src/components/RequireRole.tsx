import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { can, planAllows } from '../lib/permissions'
import type { ViewKey } from '../lib/permissions'
import type { ReactNode } from 'react'

export default function RequireRole({
  view,
  children,
}: {
  view: ViewKey
  children: ReactNode
}) {
  const user = useAuthStore((s) => s.user)
  const subscription = useSubscriptionStore((s) => s.subscription)
  const loading = useSubscriptionStore((s) => s.loading)
  if (!can(user?.role, view)) return <Navigate to="/" replace />
  // Mientras la suscripción aún carga, no redirigir innecesariamente.
  if (loading) return <>{children}</>
  if (!planAllows(subscription?.plan, view)) return <Navigate to="/" replace />
  return <>{children}</>
}