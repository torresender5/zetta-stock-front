import { useEffect, useState } from 'react'
import { Check, Landmark, Loader2, ShieldAlert } from 'lucide-react'
import { subscriptionService } from '../services/subscriptionService'
import type { PaymentDetails } from '../types'

const FIELDS: Array<{
  key: keyof PaymentDetails
  label: string
  placeholder?: string
  wide?: boolean
}> = [
  { key: 'bankName', label: 'Banco', placeholder: 'Banco de Venezuela' },
  { key: 'accountType', label: 'Tipo de cuenta', placeholder: 'Corriente / Ahorro' },
  { key: 'accountNumber', label: 'Cuenta o teléfono (pago móvil)', placeholder: '0134XXXXXXXXXXXX' },
  { key: 'accountHolder', label: 'Titular', placeholder: 'Nombre y apellido' },
  { key: 'holderDocument', label: 'Cédula / RIF', placeholder: 'V-12345678' },
  { key: 'phone', label: 'Teléfono', placeholder: '04141234567' },
  { key: 'email', label: 'Correo', placeholder: 'pagos@empresa.com' },
  { key: 'instructions', label: 'Instrucciones adicionales', wide: true },
]

const EMPTY: PaymentDetails = {
  bankName: '',
  accountType: '',
  accountNumber: '',
  accountHolder: '',
  holderDocument: '',
  phone: '',
  email: '',
  instructions: '',
}

export default function AdminPaymentSettings() {
  const [form, setForm] = useState<PaymentDetails>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const details = await subscriptionService.getPaymentSettings()
        setForm({
          bankName: details.bankName ?? '',
          accountType: details.accountType ?? '',
          accountNumber: details.accountNumber ?? '',
          accountHolder: details.accountHolder ?? '',
          holderDocument: details.holderDocument ?? '',
          phone: details.phone ?? '',
          email: details.email ?? '',
          instructions: details.instructions ?? '',
        })
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar la configuración')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const save = async () => {
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const saved = await subscriptionService.updatePaymentSettings({
        bankName: form.bankName,
        accountType: form.accountType,
        accountNumber: form.accountNumber,
        accountHolder: form.accountHolder,
        holderDocument: form.holderDocument,
        phone: form.phone,
        email: form.email,
        instructions: form.instructions,
      })
      setForm({
        bankName: saved.bankName ?? '',
        accountType: saved.accountType ?? '',
        accountNumber: saved.accountNumber ?? '',
        accountHolder: saved.accountHolder ?? '',
        holderDocument: saved.holderDocument ?? '',
        phone: saved.phone ?? '',
        email: saved.email ?? '',
        instructions: saved.instructions ?? '',
      })
      setNotice('Datos bancarios guardados. Los clientes los verán al pagar.')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Landmark className="w-5 h-5 text-violet-600" /> Cuenta de pago
        </h1>
        <p className="text-sm text-muted-foreground">
          Datos bancarios que verán los clientes para realizar pagos móviles o
          transferencias. Las órdenes manuales se validan automáticamente contra
          los movimientos de la cuenta (Pabilo).
        </p>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-sm font-medium flex items-center gap-2">
          <Check className="w-4 h-4" /> {notice}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FIELDS.map(({ key, label, placeholder, wide }) => (
              <label
                key={key}
                className={`block text-xs font-medium text-muted-foreground ${
                  wide ? 'sm:col-span-2' : ''
                }`}
              >
                {label}
                {wide ? (
                  <textarea
                    value={form[key] ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    rows={3}
                    placeholder="Ej. Realiza el pago y adjunta el capture con la referencia."
                    className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={form[key] ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    maxLength={120}
                    placeholder={placeholder}
                    className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                )}
              </label>
            ))}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            La cuenta debe ser la que recibirá los pagos de los clientes; la
            validación automática de Pabilo verifica los movimientos reales de
            esta cuenta.
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Guardando…
              </>
            ) : (
              'Guardar datos bancarios'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
