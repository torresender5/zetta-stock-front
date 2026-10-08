import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import LegalConsentCheckbox from './LegalConsentCheckbox'

/**
 * Modal de aceptación forzada para usuarios sin consentimiento registrado
 * (subcuentas creadas por un admin). No se puede cerrar: exige aceptar
 * Términos y Privacidad antes de usar la aplicación.
 */
export default function LegalAcceptanceModal() {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const acceptLegal = useAuthStore((s) => s.acceptLegal)
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState('')

  if (!user?.requiresLegalAcceptance) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!checked) {
      setError('Debes aceptar los Términos y la Política de Privacidad para continuar')
      return
    }
    const result = await acceptLegal({
      acceptTerms: true,
      acceptPrivacy: true,
      over18: true,
    })
    if (!result.ok) {
      setError(result.error || 'Error al registrar la aceptación')
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Aceptación de términos y política de privacidad"
        className="relative w-full max-w-lg rounded-3xl bg-card shadow-2xl p-6 sm:p-8 animate-modal-in"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/15">
            <ShieldCheck className="h-5 w-5 text-violet-500" />
          </span>
          <h2 className="text-lg font-semibold text-foreground">
            Aceptación de términos
          </h2>
        </div>

        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Tu cuenta fue creada por un administrador de la empresa. Para continuar
          necesitamos que aceptes nuestros documentos legales:
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <LegalConsentCheckbox checked={checked} onChange={setChecked} id="legal-accept-modal" />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !checked}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-3 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Guardando...' : 'Aceptar y continuar'}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}
