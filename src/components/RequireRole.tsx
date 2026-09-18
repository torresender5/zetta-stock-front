import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { can } from '../lib/permissions'
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
  if (!can(user?.role, view)) return <Navigate to="/" replace />
  return <>{children}</>
}