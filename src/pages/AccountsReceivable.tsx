import { useMemo, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'
import { useSaleStore } from '../stores/saleStore'
import { formatCurrency, formatDateOnly } from '../lib/utils'

export default function AccountsReceivable() {
  const { sales, fetchSales, updateSalePaymentStatus } = useSaleStore()

  useEffect(() => {
    fetchSales()
  }, [])

  const pendingSales = useMemo(
    () => sales.filter((s) => (s.paymentStatus ?? 'paid') === 'pending'),
    [sales]
  )

  const groupedByClient = useMemo(() => {
    const map: Record<string, { clientName: string; total: number; sales: typeof pendingSales }> = {}
    for (const s of pendingSales) {
      const key = s.clientId
      if (!map[key]) {
        map[key] = { clientName: s.clientName, total: 0, sales: [] }
      }
      map[key].total += s.total
      map[key].sales.push(s)
    }
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [pendingSales])

  const totalReceivable = pendingSales.reduce((sum, s) => sum + s.total, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cuentas por Cobrar</h1>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total por cobrar</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalReceivable)}</p>
        </div>
      </div>

      {groupedByClient.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-500">
          No hay cuentas por cobrar pendientes.
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByClient.map(({ clientName, total, sales: clientSales }) => (
            <div key={clientName} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-blue-50/80">
                <div>
                  <h2 className="font-semibold text-lg">{clientName}</h2>
                  <p className="text-sm text-gray-500">{clientSales.length} venta(s) pendiente(s)</p>
                </div>
                <span className="text-lg font-bold text-blue-700">{formatCurrency(total)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="text-left px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Fecha</th>
                      <th className="text-right px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Productos</th>
                      <th className="text-right px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Total</th>
                      <th className="text-center px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clientSales.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">{formatDateOnly(s.date)}</td>
                        <td className="px-6 py-4 text-right">{s.items.length}</td>
                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(s.total)}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => updateSalePaymentStatus(s.id, 'paid')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Marcar cobrado
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
