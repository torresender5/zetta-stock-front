import { useState } from 'react'
import ProductImageInput from './ProductImageInput'
import { TICKET_CATEGORY_LABELS } from '../types'
import type { TicketCategory } from '../types'

interface TicketFormProps {
  submitLabel?: string
  onCancel: () => void
  onSubmit: (form: {
    subject: string
    category: TicketCategory
    body: string
    image: File | null
  }) => Promise<void>
}

export function TicketForm({ submitLabel = 'Crear ticket', onCancel, onSubmit }: TicketFormProps) {
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState<TicketCategory>('consulta')
  const [body, setBody] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputClass =
    'w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ subject: subject.trim(), category, body: body.trim(), image })
    } catch {
      setError('No se pudo crear el ticket. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Asunto *</label>
        <input
          required
          type="text"
          minLength={3}
          maxLength={150}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ej: Error al generar una factura"
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de solicitud *</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as TicketCategory)}
          className={inputClass}
        >
          {(Object.keys(TICKET_CATEGORY_LABELS) as TicketCategory[]).map((c) => (
            <option key={c} value={c}>
              {TICKET_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción *</label>
        <textarea
          required
          rows={4}
          maxLength={5000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Cuéntanos con detalle qué necesitas o qué falla ocurrió..."
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Captura de pantalla (opcional)
        </label>
        <p className="text-xs text-gray-400 mb-2">
          Por ejemplo, el comprobante del pago de tu suscripción. JPG, PNG, WebP o GIF hasta 5 MB.
        </p>
        <ProductImageInput value={null} onChange={setImage} />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? 'Enviando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
