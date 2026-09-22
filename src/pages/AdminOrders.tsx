import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  ListOrdered,
  Loader2,
  ShieldAlert,
  XCircle,
  Check,
} from 'lucide-react'
import { subscriptionService } from '../services/subscriptionService'
import { formatCurrency } from '../lib/utils'
import type { PaymentOrder } from '../types'

type AdminOrder = PaymentOrder & { companyId: number; companyName: string }

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setOrders(await subscriptionService.getPaymentOrders())
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar las órdenes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const process = async (id: number, action: 'confirm' | 'reject') => {
    setNotice(null)
    setError(null)
    try {
      if (action === 'confirm') {
        await subscriptionService.confirmPaymentOrder(id)
        setNotice('Pago confirmado y suscripción activada')
      } else {
        await subscriptionService.rejectPaymentOrder(id)
        setNotice('Orden rechazada')
      }
      await load()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al procesar la orden')
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-violet-600" /> Órdenes de pago
        </h1>
        <p className="text-sm text-muted-foreground">
          Confirma o rechaza los pagos recibidos para activar los planes.
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
      ) : orders.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-10 text-center">
          <ListOrdered className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No hay órdenes de pago registradas
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="px-6 py-3.5 font-medium">Empresa</th>
                  <th className="px-6 py-3.5 font-medium">Concepto</th>
                  <th className="px-6 py-3.5 font-medium">Valor</th>
                  <th className="px-6 py-3.5 font-medium">Estado</th>
                  <th className="px-6 py-3.5 font-medium">Fecha</th>
                  <th className="px-6 py-3.5 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border/60 last:border-0">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {order.companyName}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {order.concept}
                      <span className="block text-xs text-muted-foreground/70 uppercase">
                        {order.period}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground tabular-nums">
                      {formatCurrency(order.amount)}
                    </td>
                    <td className="px-6 py-4">
                      {order.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                          <Clock className="w-3 h-3" /> Pendiente
                        </span>
                      ) : order.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Confirmada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border bg-red-50 text-red-700 border-red-200">
                          <XCircle className="w-3 h-3" /> Rechazada
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {order.status === 'pending' ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => void process(order.id, 'confirm')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Confirmar
                          </button>
                          <button
                            onClick={() => void process(order.id, 'reject')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-300 transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Rechazar
                          </button>
                        </div>
                      ) : (
                        <span className="block text-right text-xs text-muted-foreground">
                          {order.paidAt
                            ? `Procesada ${new Date(order.paidAt).toLocaleDateString('es-CO', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}`
                            : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}