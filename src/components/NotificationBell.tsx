import { Bell } from 'lucide-react'
import { NotificationsDropdown } from './NotificationsDropdown'

export default function NotificationBell() {
  return (
    <NotificationsDropdown
      scope="general"
      icon={Bell}
      label="Notificaciones"
      linkTo="/notificaciones"
      emptyText="No tienes notificaciones"
    />
  )
}
