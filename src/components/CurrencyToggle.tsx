import { useCallback, useState } from 'react'
import { formatUsd, formatVes } from '../lib/utils'
import { useRate } from '../stores/rateStore'

export type DisplayCurrency = 'USD' | 'VES'

export function useDisplayCurrency(initial: DisplayCurrency = 'USD') {
  const [currency, setCurrency] = useState<DisplayCurrency>(initial)
  const rate = useRate()

  // Convierte un monto USD (con, opcionalmente, su equivalente Bs ya guardado)
  // según la moneda seleccionada.
  const fmt = useCallback(
    (usd: number, ves?: number | null): string => {
      if (currency !== 'VES') return formatUsd(usd)
      if (rate && rate > 0) return formatVes(ves ?? usd * rate)
      return formatUsd(usd)
    },
    [currency, rate],
  )

  const toggle = useCallback(() => {
    setCurrency((c) => (c === 'USD' ? 'VES' : 'USD'))
  }, [])

  return { currency, setCurrency, toggle, fmt, rate }
}

interface CurrencyToggleProps {
  value: DisplayCurrency
  onChange: (currency: DisplayCurrency) => void
  className?: string
}

export default function CurrencyToggle({
  value,
  onChange,
  className = '',
}: CurrencyToggleProps) {
  return (
    <div
      className={`inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5 ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange('USD')}
        className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
          value === 'USD'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        US$
      </button>
      <button
        type="button"
        onClick={() => onChange('VES')}
        className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
          value === 'VES'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Bs
      </button>
    </div>
  )
}