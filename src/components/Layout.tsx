import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import CartFab from './CartFab'
import SubscriptionBanner from './SubscriptionBanner'
import ExpiredLock from './ExpiredLock'
import NotificationBell from './NotificationBell'
import { useAuthStore } from '../stores/authStore'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { useRateStore } from '../stores/rateStore'
import { useNotificationStore } from '../stores/notificationStore'
import { subscriptionExpired } from '../lib/plan'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const subscription = useSubscriptionStore((s) => s.subscription)
  const loading = useSubscriptionStore((s) => s.loading)
  const fetchMySubscription = useSubscriptionStore((s) => s.fetchMySubscription)
  const fetchRate = useRateStore((s) => s.fetchRate)
  const fetchNotifications = useNotificationStore((s) => s.fetch)
  const location = useLocation()

  useEffect(() => {
    if (user?.companyId) fetchMySubscription()
  }, [user?.companyId, fetchMySubscription])

  useEffect(() => {
    fetchRate()
  }, [fetchRate])

  useEffect(() => {
    if (!user?.companyId) return
    fetchNotifications()
    const interval = setInterval(() => fetchNotifications(), 60000)
    return () => clearInterval(interval)
  }, [user?.companyId, fetchNotifications])

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
        <div className="flex items-center justify-end px-4 sm:px-6 py-2 border-b border-border bg-card/60 backdrop-blur sticky top-0 z-20 no-print">
          <NotificationBell />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav onOpenMenu={() => setSidebarOpen(true)} />
      <CartFab />
    </div>
  )
}