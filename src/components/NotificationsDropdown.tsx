import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Bell, CheckCheck, Inbox } from 'lucide-react'
import { useNotificationStore } from '../stores/notificationStore'
import { TYPE_ICONS, notificationRoute, type BellScope } from '../lib/notifications'
import { timeAgo } from '../lib/utils'
import type { AppNotification } from '../types'

interface NotificationsDropdownProps {
  scope: BellScope
  icon: typeof Bell
  label: string
  linkTo: string
  emptyText?: string
}

export function NotificationsDropdown({
  scope,
  icon: Icon,
  label,
  linkTo,
  emptyText = 'No tienes notificaciones',
}: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { items, unread, loading } = useNotificationStore((s) => s.bells[scope])
  const fetchBell = useNotificationStore((s) => s.fetchBell)
  const markRead = useNotificationStore((s) => s.markRead)
  const markAllRead = useNotificationStore((s) => s.markAllRead)

  useEffect(() => {
    fetchBell(scope)
  }, [scope, fetchBell])

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
    if (!open) fetchBell(scope)
  }

  const handleSelect = (notification: AppNotification) => {
    if (!notification.readAt) markRead(notification.id)
    setOpen(false)
    const route = notificationRoute(notification)
    if (route) navigate(route)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`${label}${unread > 0 ? ` (${unread} sin leer)` : ''}`}
        className="relative p-2 rounded-xl text-gray-500 hover:text-foreground hover:bg-gray-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        <Icon className="w-5 h-5" />
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
                {label}
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
                  <p className="text-sm">{loading ? 'Cargando…' : emptyText}</p>
                </div>
              ) : (
                items.map((notification) => {
                  const NotificationIcon = TYPE_ICONS[notification.type] ?? Bell
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
                        <NotificationIcon className="w-4 h-4" />
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

            <Link
              to={linkTo}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 px-4 py-3 border-t border-border text-xs font-semibold text-violet-600 hover:bg-violet-50 transition-colors"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
