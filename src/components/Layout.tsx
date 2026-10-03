import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import CartFab from './CartFab'
import SubscriptionBanner from './SubscriptionBanner'
import ExpiredLock from './ExpiredLock'
import { useAuthStore } from '../stores/authStore'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { useRateStore } from '../stores/rateStore'
import { subscriptionExpired } from '../lib/plan'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const subscription = useSubscriptionStore((s) => s.subscription)
  const loading = useSubscriptionStore((s) => s.loading)
  const fetchMySubscription = useSubscriptionStore((s) => s.fetchMySubscription)
  const fetchRate = useRateStore((s) => s.fetchRate)
  const location = useLocation()

  useEffect(() => {
    if (user?.companyId) fetchMySubscription()
  }, [user?.companyId, fetchMySubscription])

  useEffect(() => {
    fetchRate()
  }, [fetchRate])

  const expired = !loading && subscriptionExpired(subscription)
  const locked = expired && !location.pathname.startsWith('/suscripcion')

  if (locked) {
    return <ExpiredLock />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <SubscriptionBanner />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav onOpenMenu={() => setSidebarOpen(true)} />
      <CartFab />
    </div>
  )
}