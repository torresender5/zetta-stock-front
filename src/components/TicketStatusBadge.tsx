import { CheckCircle2, CircleDot, Clock, Hourglass } from 'lucide-react'
import { TICKET_STATUS_LABELS } from '../types'
import type { TicketStatus } from '../types'

const STYLES: Record<
  TicketStatus,
  { className: string; icon: typeof CircleDot }
> = {
  abierto: { className: 'bg-blue-50 text-blue-600', icon: CircleDot },
  pendiente: { className: 'bg-amber-50 text-amber-600', icon: Clock },
  en_proceso: { className: 'bg-violet-50 text-violet-600', icon: Hourglass },
  finalizado: { className: 'bg-green-50 text-green-600', icon: CheckCircle2 },
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const style = STYLES[status] ?? STYLES.abierto
  const Icon = style.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold ${style.className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {TICKET_STATUS_LABELS[status]}
    </span>
  )
}
