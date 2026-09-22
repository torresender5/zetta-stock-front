import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import SubscriptionBanner from './SubscriptionBanner'
import ExpiredLock from './ExpiredLock'
import { useAuthStore } from '../stores/authStore'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { subscriptionExpired } from '../lib/plan'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const subscription = useSubscriptionStore((s) => s.subscription)
  const loading = useSubscriptionStore((s) => s.loading)
  const fetchMySubscription = useSubscriptionStore((s) => s.fetchMySubscription)
  const location = useLocation()

  useEffect(() => {
    if (user?.companyId) fetchMySubscription()
  }, [user?.companyId, fetchMySubscription])

  const expired = !loading && subscriptionExpired(subscription)
  const locked = expired && !location.pathname.startsWith('/suscripcion')

  if (locked) {
    return <ExpiredLock />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="no-print lg:hidden sticky top-0 z-30 bg-card/90 backdrop-blur-xl px-4 py-3 flex items-center gap-3 border-b border-border shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <img src="/logo.png" alt="zettastock" className="h-7 w-auto object-contain" />
        </header>
        <SubscriptionBanner />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}