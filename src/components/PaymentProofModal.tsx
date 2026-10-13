import { useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ImagePlus,
  Landmark,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react'
import { subscriptionService } from '../services/subscriptionService'
import { formatUsd, formatVes } from '../lib/utils'
import { PAYMENT_INSTRUCTIONS } from '../lib/plan'
import type {
  PaymentDetails,
  PaymentOrder,
  PaymentVerificationResult,
} from '../types'

const METHOD_OPTIONS = [
  { key: 'movil' as const, label: 'Pago móvil', Icon: Smartphone },
  { key: 'transferencia' as const, label: 'Transferencia', Icon: Landmark },
]

const VERIFICATION_MESSAGES: Record<string, string> = {
  PAYMENT_NOT_FOUND:
    'El pago aún no aparece en la cuenta bancaria. Si acabas de pagar, espera unos minutos y re-valida.',
  NO_CREDITS:
    'La validación automática no está disponible en este momento; revisaremos el pago manualmente.',
  INVALID_DATA:
    'Pabilo rechazó los datos del pago. Revisa la referencia y el monto e inténtalo de nuevo.',
  API_ERROR:
    'No pudimos consultar el pago ahora mismo. Re-valida en unos minutos.',
  NOT_CONFIGURED:
    'La validación automática no está configurada; revisaremos el pago manualmente.',
}

interface PaymentProofModalProps {
  order: PaymentOrder
  paymentDetails: PaymentDetails | null
  onClose: () => void
  /** Se invoca tras un pago verificado para refrescar la suscripción. */
  onSettled?: () => void
}

function todayIso(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function bankDetailRows(details: PaymentDetails | null): Array<{
  label: string
  value: string
}> {
  if (!details) return []
  const rows: Array<{ label: string; value: string }> = []
  if (details.bankName) rows.push({ label: 'Banco', value: details.bankName })
  if (details.accountType)
    rows.push({ label: 'Tipo de cuenta', value: details.accountType })
  if (details.accountNumber)
    rows.push({ label: 'Cuenta / teléfono', value: details.accountNumber })
  if (details.accountHolder)
    rows.push({ label: 'Titular', value: details.accountHolder })
  if (details.holderDocument)
    rows.push({ label: 'Cédula / RIF', value: details.holderDocument })
  if (details.phone) rows.push({ label: 'Teléfono', value: details.phone })
  if (details.email) rows.push({ label: 'Correo', value: details.email })
  return rows
}

export default function PaymentProofModal({
  order,
  paymentDetails,
  onClose,
  onSettled,
}: PaymentProofModalProps) {
  const [bankReference, setBankReference] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'movil' | 'transferencia'>(
    'movil',
  )
  const [paymentDate, setPaymentDate] = useState(todayIso)
  const [payerDni, setPayerDni] = useState('')
  const [payerPhone, setPayerPhone] = useState('')
  const [payerBankCode, setPayerBankCode] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [paid, setPaid] = useState(order.status === 'paid')
  const [pendingMessage, setPendingMessage] = useState<string | null>(
    order.status === 'awaiting_reverify'
      ? VERIFICATION_MESSAGES.PAYMENT_NOT_FOUND
      : null,
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasProof = !!order.proofUrl
  const needsProof = !hasProof || order.status === 'rejected'
  const detailRows = useMemo(() => bankDetailRows(paymentDetails), [paymentDetails])

  const applyResult = (result: PaymentVerificationResult) => {
    if (result.status === 'paid') {
      setPaid(true)
      setPendingMessage(null)
      setErrorMessage(null)
      onSettled?.()
      return
    }
    setPendingMessage(
      VERIFICATION_MESSAGES[result.code] ?? VERIFICATION_MESSAGES.API_ERROR,
    )
  }

  const handleError = (err: any, fallback: string) => {
    const raw = err.response?.data?.message
    setErrorMessage(typeof raw === 'string' ? raw : fallback)
  }

  const handleFile = (selected: File | null) => {
    setErrorMessage(null)
    if (!selected) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(selected.type)) {
      setErrorMessage('El comprobante debe ser JPG, PNG, WebP o GIF')
      return
    }
    if (selected.size > 5 * 1024 * 1024) {
      setErrorMessage('El comprobante no puede superar 5 MB')
      return
    }
    setFile(selected)
    setFilePreview(URL.createObjectURL(selected))
  }

  const submitProof = async () => {
    setErrorMessage(null)
    const reference = bankReference.trim()
    if (!reference) {
      setErrorMessage('Indica la referencia bancaria del pago')
      return
    }
    if (!file) {
      setErrorMessage('Adjunta el capture del comprobante de pago')
      return
    }
    setBusy(true)
    try {
      const result = await subscriptionService.submitPaymentProof(order.id, {
        bankReference: reference,
        paymentMethod,
        paymentDate: paymentDate || undefined,
        payerDni: payerDni.trim() || undefined,
        payerPhone: payerPhone.trim() || undefined,
        payerBankCode: payerBankCode.trim() || undefined,
      }, file)
      applyResult(result)
    } catch (err: any) {
      handleError(err, 'No se pudo enviar el comprobante')
    } finally {
      setBusy(false)
    }
  }

  const reverify = async () => {
    setErrorMessage(null)
    setBusy(true)
    try {
      const result = await subscriptionService.reverifyPaymentProof(order.id)
      applyResult(result)
    } catch (err: any) {
      handleError(err, 'No se pudo re-validar el pago')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Resumen de la orden */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">{order.concept}</p>
          <p className="text-xs text-muted-foreground">
            Orden #{order.id} · {formatUsd(order.amount)}
            {order.amountVes ? ` · ${formatVes(order.amountVes)}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {paid ? (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="text-sm text-emerald-800">
            <p className="font-semibold">Pago verificado</p>
            <p className="mt-0.5">
              Confirmamos el pago en tu banco. Tu suscripción ya está activa.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Datos de la cuenta receptora */}
          <div className="rounded-2xl border border-border bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Landmark className="w-4 h-4 text-violet-500" />
              Datos para realizar el pago
            </p>
            {detailRows.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-2.5">
                Aún no hay datos bancarios configurados. Contacta a soporte
                (soporte@zettastock.com) para obtener la cuenta de pago.
              </p>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                {detailRows.map((row) => (
                  <div key={row.label} className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="font-semibold text-foreground tabular-nums">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {order.amountVes && (
              <p className="text-sm font-bold text-violet-700 bg-violet-50 border border-violet-100 rounded-xl p-2.5 tabular-nums">
                Monto exacto a pagar: {formatVes(order.amountVes)}
                <span className="block text-xs font-medium text-violet-600">
                  Paga exactamente este monto; la validación lo compara con el
                  movimiento del banco.
                </span>
              </p>
            )}
            {paymentDetails?.instructions && (
              <p className="text-xs text-muted-foreground">
                {paymentDetails.instructions}
              </p>
            )}
          </div>

          {/* Instrucciones */}
          <div className="space-y-2 p-4 rounded-2xl bg-muted/60">
            <p className="text-sm font-semibold text-foreground">
              <ShieldCheck className="inline w-4 h-4 mr-1 text-violet-500" />
              Pasos
            </p>
            <ol className="space-y-1.5">
              {PAYMENT_INSTRUCTIONS.map((step, i) => (
                <li
                  key={step}
                  className="flex gap-2 text-xs text-muted-foreground"
                >
                  <span className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Comprobante previo (re-validación) */}
          {hasProof && (
            <div className="rounded-2xl border border-border p-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Comprobante enviado
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {order.bankReference && (
                  <span>
                    Ref. bancaria:{' '}
                    <span className="font-semibold text-foreground">
                      {order.bankReference}
                    </span>
                  </span>
                )}
                {order.proofUrl && (
                  <a
                    href={order.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-600 underline underline-offset-2"
                  >
                    Ver capture
                  </a>
                )}
              </div>
              {pendingMessage && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  {pendingMessage}
                </div>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => void reverify()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 cursor-pointer"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Re-validar con el banco
              </button>
            </div>
          )}

          {/* Formulario de comprobante */}
          {needsProof && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Datos del pago y comprobante
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-xs font-medium text-muted-foreground">
                  Referencia bancaria *
                  <input
                    type="text"
                    value={bankReference}
                    onChange={(e) => setBankReference(e.target.value)}
                    maxLength={40}
                    placeholder="Ej. 0004832910"
                    className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </label>
                <label className="block text-xs font-medium text-muted-foreground">
                  Fecha del pago
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </label>
                <label className="block text-xs font-medium text-muted-foreground">
                  Cédula del pagador (opcional)
                  <input
                    type="text"
                    value={payerDni}
                    onChange={(e) => setPayerDni(e.target.value)}
                    maxLength={20}
                    placeholder="V-12345678"
                    className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </label>
                <label className="block text-xs font-medium text-muted-foreground">
                  Teléfono del pagador (opcional)
                  <input
                    type="text"
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    maxLength={15}
                    placeholder="04141234567"
                    className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </label>
                <label className="block text-xs font-medium text-muted-foreground">
                  Banco origen, código (opcional)
                  <input
                    type="text"
                    value={payerBankCode}
                    onChange={(e) => setPayerBankCode(e.target.value)}
                    maxLength={4}
                    placeholder="0102"
                    className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </label>
                <div className="text-xs font-medium text-muted-foreground">
                  Método usado
                  <div className="mt-1 flex gap-2">
                    {METHOD_OPTIONS.map(({ key, label, Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPaymentMethod(key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                          paymentMethod === key
                            ? 'border-violet-300 bg-violet-50 text-violet-700 ring-1 ring-violet-500/30'
                            : 'border-border text-muted-foreground hover:bg-muted/60'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:border-violet-400 hover:text-violet-600 transition-colors cursor-pointer"
              >
                {filePreview ? (
                  <img
                    src={filePreview}
                    alt="Comprobante de pago"
                    className="max-h-40 rounded-xl object-contain"
                  />
                ) : (
                  <>
                    <ImagePlus className="w-5 h-5" />
                    Adjuntar capture del comprobante (JPG/PNG, máx. 5 MB)
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />

              {errorMessage && (
                <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
                  {errorMessage}
                </p>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={() => void submitProof()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Validando con
                    el banco…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Enviar y validar pago
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-muted-foreground">
                Verificamos el pago contra el movimiento real de tu banco con
                Pabilo; el plan se activa al confirmarse.
              </p>
            </div>
          )}
        </>
      )}

      {paid && (
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity cursor-pointer"
        >
          Entendido
        </button>
      )}
    </div>
  )
}
