interface SubscriptionLike {
  status?: string
  effectiveEnd?: string | null
}

export function subscriptionExpired(sub: SubscriptionLike | null | undefined): boolean {
  if (!sub) return false
  if (sub.status === 'expired') return true
  const end = sub.effectiveEnd ? new Date(sub.effectiveEnd).getTime() : NaN
  return !Number.isNaN(end) && end <= Date.now()
}

export function daysUntil(sub: SubscriptionLike | null | undefined): number {
  if (!sub?.effectiveEnd) return 0
  return Math.max(0, Math.ceil((new Date(sub.effectiveEnd).getTime() - Date.now()) / 86400000))
}

export function formatSubscriptionEnd(sub: SubscriptionLike | null | undefined): string {
  if (!sub?.effectiveEnd) return ''
  return new Date(sub.effectiveEnd).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const PAYMENT_INSTRUCTIONS = [
  'Realiza el pago por transferencia bancaria o Nequi a la cuenta de ZettaStock que te indique el equipo de soporte.',
  'Guarda el comprobante de tu pago.',
  'Comparte el comprobante con el equipo de soporte o espera la confirmación: el plan se activará automáticamente.',
] as const