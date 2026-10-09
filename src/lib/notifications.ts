import {
  BadgeAlert,
  Bell,
  CalendarClock,
  LifeBuoy,
  Megaphone,
  PackageMinus,
  Wallet,
} from 'lucide-react'
import type { AppNotification, NotificationType } from '../types'

export type NotificationScope = 'all' | 'tickets' | 'general'

/** Scopes que usa cada campana del navbar (la general excluye tickets). */
export type BellScope = Exclude<NotificationScope, 'all'>

export const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  stock_low: PackageMinus,
  apartado_due: CalendarClock,
  subscription_expiring: BadgeAlert,
  subscription_expired: BadgeAlert,
  cash_open: Wallet,
  ticket_reply: LifeBuoy,
  announcement: Megaphone,
}

export const TYPE_ROUTES: Partial<Record<NotificationType, string>> = {
  stock_low: '/products',
  apartado_due: '/apartados',
  subscription_expiring: '/suscripcion',
  subscription_expired: '/suscripcion',
  cash_open: '/caja',
  ticket_reply: '/tickets',
}

export const TYPE_LABELS: Record<NotificationType, string> = {
  stock_low: 'Stock',
  apartado_due: 'Apartado',
  subscription_expiring: 'Suscripción',
  subscription_expired: 'Suscripción',
  cash_open: 'Caja',
  ticket_reply: 'Ticket',
  announcement: 'Anuncio',
}

/** Destino al pulsar la notificación; `null` cuando no hay página asociada. */
export function notificationRoute(notification: AppNotification): string | null {
  if (notification.type === 'ticket_reply') {
    const match = /^ticket_reply:(\d+)$/.exec(notification.dedupeKey ?? '')
    return match ? `/tickets/${match[1]}` : '/tickets'
  }
  if (notification.type === 'announcement') return null
  return TYPE_ROUTES[notification.type] ?? '/'
}
