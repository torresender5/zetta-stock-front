import { sanitizeMoneyInput } from '../lib/utils'

interface MoneyInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
}

export default function MoneyInput({ value, onChange, placeholder = '0', required, className }: MoneyInputProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
      <input
        type="text"
        inputMode="decimal"
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(sanitizeMoneyInput(e.target.value))}
        className={`w-full border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm tabular-nums transition-all ${className ?? ''}`}
      />
    </div>
  )
}