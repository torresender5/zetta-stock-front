import { Navigate } from 'react-router-dom'
import { isAdminAuthenticated } from '../lib/adminAuth'
import type { ReactNode } from 'react'

export default function AdminRoute({ children }: { children: ReactNode }) {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />
  }
  return <>{children}</>
}