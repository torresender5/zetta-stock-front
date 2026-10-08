import { Link } from 'react-router-dom'

interface LegalConsentCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  id?: string
  error?: string
}

/**
 * Consentimiento legal bloqueante (Ley OPDP 1733): aceptación de Términos y
 * Privacidad + declaración de mayoría de edad. Se usa en el registro y en el
 * modal de aceptación forzada del primer login.
 */
export default function LegalConsentCheckbox({
  checked,
  onChange,
  id = 'legal-consent',
  error,
}: LegalConsentCheckboxProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer transition-colors hover:bg-white/10"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-violet-600 cursor-pointer"
        />
        <span className="text-sm text-gray-300 leading-relaxed">
          He leído y acepto los{' '}
          <Link
            to="/terminos"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
          >
            Términos y Condiciones
          </Link>{' '}
          y la{' '}
          <Link
            to="/privacidad"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
          >
            Política de Privacidad
          </Link>
          . Declaro tener 18 años o más.
        </span>
      </label>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  )
}
