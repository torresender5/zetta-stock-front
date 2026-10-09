import { LifeBuoy } from 'lucide-react'
import { NotificationsDropdown } from './NotificationsDropdown'
import { useAuthStore } from '../stores/authStore'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { canView } from '../lib/permissions'

export default function TicketNotificationBell() {
  const user = useAuthStore((s) => s.user)
  const plan = useSubscriptionStore((s) => s.subscription?.plan)

  if (!canView(user?.role, 'tickets', plan)) return null

  return (
    <NotificationsDropdown
      scope="tickets"
      icon={LifeBuoy}
      label="Notificaciones de tickets"
      linkTo="/notificaciones?tab=tickets"
      emptyText="No tienes respuestas de tickets"
    />
  )
}
