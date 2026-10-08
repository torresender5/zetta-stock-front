import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  PackageMinus,
  CalendarClock,
  BadgeAlert,
  Wallet,
  Inbox,
  LifeBuoy,
} from 'lucide-react'
import { useNotificationStore } from '../stores/notificationStore'
import type { AppNotification, NotificationType } from '../types'

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  stock_low: PackageMinus,
  apartado_due: CalendarClock,
  subscription_expiring: BadgeAlert,
  subscription_expired: BadgeAlert,
  cash_open: Wallet,
  ticket_reply: LifeBuoy,
}

const TYPE_ROUTES: Record<NotificationType, string> = {
  stock_low: '/products',
  apartado_due: '/apartados',
  subscription_expiring: '/suscripcion',
  subscription_expired: '/suscripcion',
  cash_open: '/caja',
  ticket_reply: '/tickets',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days} días`
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  })
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const items = useNotificationStore((s) => s.items)
  const unread = useNotificationStore((s) => s.unread)
  const fetchNotifications = useNotificationStore((s) => s.fetch)
  const markRead = useNotificationStore((s) => s.markRead)
  const markAllRead = useNotificationStore((s) => s.markAllRead)

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const handleOpen = () => {
    setOpen((v) => !v)
    if (!open) fetchNotifications()
  }

  const handleSelect = (notification: AppNotification) => {
    if (!notification.readAt) markRead(notification.id)
    setOpen(false)
    navigate(TYPE_ROUTES[notification.type] ?? '/')
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Notificaciones${unread > 0 ? ` (${unread} sin leer)` : ''}`}
        className="relative p-2 rounded-xl text-gray-500 hover:text-foreground hover:bg-gray-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-fade-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold text-foreground">
                Notificaciones
                {unread > 0 && (
                  <span className="ml-2 text-xs font-medium text-violet-600">
                    {unread} sin leer
                  </span>
                )}
              </span>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-violet-600 transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Marcar todas
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                  <Inbox className="w-8 h-8" />
                  <p className="text-sm">No tienes notificaciones</p>
                </div>
              ) : (
                items.map((notification) => {
                  const Icon = TYPE_ICONS[notification.type] ?? Bell
                  const isUnread = !notification.readAt
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleSelect(notification)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-border/60 last:border-b-0 hover:bg-muted transition-colors cursor-pointer ${
                        isUnread ? 'bg-violet-50/50' : ''
                      }`}
                    >
                      <span
                        className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                          isUnread
                            ? 'bg-violet-100 text-violet-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {notification.title}
                          </span>
                          {isUnread && (
                            <span className="shrink-0 w-2 h-2 rounded-full bg-violet-600" />
                          )}
                        </span>
                        {notification.body && (
                          <span className="block text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {notification.body}
                          </span>
                        )}
                        <span className="block text-[11px] text-gray-400 mt-1">
                          {timeAgo(notification.createdAt)}
                        </span>
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
