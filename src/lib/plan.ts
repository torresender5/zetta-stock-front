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
  'Realiza el pago por pago móvil o transferencia bancaria a la cuenta de ZettaStock que aparece en esta página.',
  'El monto exacto en Bs que debes pagar está indicado junto a la orden de pago.',
  'Guarda el comprobante de tu pago y súbelo desde esta página: el plan se activará automáticamente cuando el pago sea validado.',
] as const