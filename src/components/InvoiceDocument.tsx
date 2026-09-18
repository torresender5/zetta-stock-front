import { Building2, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import type { Invoice } from '../types'
import { formatCurrency, formatDate } from '../lib/utils'

export function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-600">
        <CheckCircle className="w-3 h-3" /> Pagada
      </span>
    )
  }
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600">
        <XCircle className="w-3 h-3" /> Cancelada
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-600">
      <Clock className="w-3 h-3" /> Pendiente
    </span>
  )
}

interface InvoiceDocumentProps {
  invoice: Invoice
}

export default function InvoiceDocument({ invoice }: InvoiceDocumentProps) {
  const user = useAuthStore((s) => s.user)

  const companyName = user?.companyName ?? 'ZettaStock'
  const companyDocument = user?.companyDocument
  const companyPhone = user?.companyPhoneNumber
  const companyAddress = user?.companyAddress

  return (
    <div id="invoice-print" className="bg-white rounded-3xl shadow-xl ring-1 ring-gray-900/5 overflow-hidden print:shadow-none print:ring-0">
      <div className="h-2 bg-gradient-to-r from-violet-600 to-indigo-600" aria-hidden="true" />
      <div className="p-6 sm:p-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-6">
          <div className="flex items-start gap-3">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-violet-500/20 shrink-0">
              <Building2 className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">{companyName}</p>
              <p className="text-sm text-gray-500 mt-1 space-y-0.5">
                {companyDocument && <span className="block">NIT/CC: {companyDocument}</span>}
                {companyAddress && <span className="block">{companyAddress}</span>}
                {companyPhone && <span className="block">{companyPhone}</span>}
              </p>
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Factura de venta</p>
            <p className="text-xl font-mono font-semibold text-violet-600 mt-1">{invoice.invoiceNumber}</p>
            <p className="text-sm text-gray-500 mt-1">Fecha: {formatDate(invoice.date)}</p>
            <div className="mt-2 flex justify-start sm:justify-end">
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-200 my-8" aria-hidden="true" />

        {/* Parties */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Facturado a</h3>
            <p className="font-semibold text-gray-900">{invoice.clientName}</p>
            {invoice.clientDocument && <p className="text-sm text-gray-600 mt-0.5">NIT/CC: {invoice.clientDocument}</p>}
            {invoice.clientAddress && <p className="text-sm text-gray-600 mt-0.5">{invoice.clientAddress}</p>}
          </div>
          <div className="sm:text-right">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Detalle</h3>
            <p className="text-sm text-gray-600">Estado: {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}</p>
            {invoice.status === 'pending' && (
              <p className="text-sm text-amber-600 mt-0.5">Por cobrar al cliente</p>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Producto</th>
                <th className="text-right py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider min-w-[70px]">Cantidad</th>
                <th className="text-right py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider min-w-[110px]">Precio Unit.</th>
                <th className="text-right py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider min-w-[120px]">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items ?? []).map((item, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="py-3.5 pr-4">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    {item.size && <p className="text-xs text-gray-400">Talla: {item.size}</p>}
                  </td>
                  <td className="py-3.5 text-right text-gray-600 tabular-nums">{item.quantity}</td>
                  <td className="py-3.5 text-right text-gray-600 tabular-nums">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-3.5 text-right font-medium text-gray-900 tabular-nums">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cancelled banner */}
        {invoice.status === 'cancelled' && (
          <div className="mt-6 flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" aria-hidden="true" />
            <div>
              <p className="font-semibold">Esta factura fue cancelada</p>
              {invoice.cancelledReason && <p className="mt-1">Motivo: {invoice.cancelledReason}</p>}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>IVA (19%)</span>
              <span className="tabular-nums">{formatCurrency(invoice.tax)}</span>
            </div>
            <div className="flex justify-between items-center bg-violet-50 rounded-xl px-4 py-3 mt-2">
              <span className="text-sm font-semibold text-violet-700">TOTAL</span>
              <span className="text-xl font-bold text-violet-700 tabular-nums">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-dashed border-gray-200 text-center">
          <p className="text-sm font-medium text-gray-700">¡Gracias por tu compra!</p>
          <p className="text-xs text-gray-400 mt-1">
            {companyName}
            {companyPhone ? ` · ${companyPhone}` : ''}
          </p>
          <p className="text-[11px] text-gray-300 mt-3">Generado con ZettaStock</p>
        </div>
      </div>
    </div>
  )
}