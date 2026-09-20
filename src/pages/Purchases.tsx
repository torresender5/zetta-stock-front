import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { useProductStore } from '../stores/productStore'
import { usePurchaseStore } from '../stores/purchaseStore'
import { useSupplierStore } from '../stores/supplierStore'
import { formatCurrency, formatDateOnly, todayLocal } from '../lib/utils'
import Modal from '../components/Modal'
import type { PurchaseItem } from '../types'

export default function Purchases() {
  const { products, fetchAllProducts } = useProductStore()
  const { suppliers, fetchSuppliers } = useSupplierStore()
  const { purchases, loading, error, fetchPurchases, addPurchase } = usePurchaseStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [date, setDate] = useState(todayLocal())
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid')
  const [items, setItems] = useState<PurchaseItem[]>([])

  useEffect(() => {
    fetchAllProducts()
    fetchSuppliers()
    fetchPurchases()
  }, [])

  const addItem = () => {
    if (products.length === 0) return
    const p = products[0]
    setItems([...items, { productId: p.id, productName: p.name, quantity: 1, unitPrice: p.purchasePrice, subtotal: p.purchasePrice }])
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    const updated = [...items]
    const item = { ...updated[index], [field]: value }
    if (field === 'productId') {
      const product = products.find((p) => p.id === value)
      if (product) {
        item.productName = product.name
        item.unitPrice = product.purchasePrice
      }
    }
    item.subtotal = item.quantity * item.unitPrice
    updated[index] = item
    setItems(updated)
  }

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const total = items.reduce((sum, item) => sum + item.subtotal, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0 || !supplierId) return
    try {
      const supplier = suppliers.find((s) => s.id === supplierId)
      await addPurchase(supplierId, supplier?.name || '', date, items, paymentStatus)
      setIsModalOpen(false)
      setSupplierId('')
      setPaymentStatus('paid')
      setItems([])
    } catch {
      // error se maneja en el store
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona tus compras a proveedores</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium">
          <Plus className="w-4 h-4" /> Nueva Compra
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm">{error}</div>
      )}

      {loading && purchases.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          <span className="ml-2 text-gray-500">Cargando compras...</span>
        </div>
      ) : (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="text-left px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Proveedor</th>
              <th className="text-left px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Fecha</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Productos</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Total</th>
              <th className="text-center px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {purchases.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay compras registradas</td></tr>
            ) : (
              [...purchases].reverse().map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{p.supplier}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDateOnly(p.date)}</td>
                  <td className="px-6 py-4 text-right">{p.items.length}</td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(p.total)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (p.paymentStatus ?? 'paid') === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {(p.paymentStatus ?? 'paid') === 'paid' ? 'Pagado' : 'Por pagar'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Compra" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Proveedor *</label>
              <select required value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all">
                <option value="">Seleccionar proveedor...</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name} - {s.document}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha *</label>
              <input required type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado de Pago *</label>
            <div className="flex gap-3">
              <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-colors ${
                paymentStatus === 'paid' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input type="radio" name="paymentStatus" value="paid" checked={paymentStatus === 'paid'}
                  onChange={() => setPaymentStatus('paid')} className="sr-only" />
                <span className="text-sm font-medium">Pagado</span>
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-colors ${
                paymentStatus === 'pending' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input type="radio" name="paymentStatus" value="pending" checked={paymentStatus === 'pending'}
                  onChange={() => setPaymentStatus('pending')} className="sr-only" />
                <span className="text-sm font-medium">Por Pagar</span>
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Productos</label>
              <button type="button" onClick={addItem} className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Agregar producto
              </button>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center border border-gray-200 rounded-xl">Agrega productos a la compra</p>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="text-left px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Producto</th>
                      <th className="text-right px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Cantidad</th>
                      <th className="text-right px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Precio Unit.</th>
                      <th className="text-right px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Subtotal</th>
                      <th className="px-6 py-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <select value={item.productId} onChange={(e) => updateItem(i, 'productId', e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all">
                            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                            className="w-20 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-right ml-auto block focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" />
                        </td>
                        <td className="px-6 py-4">
                          <input type="number" min={0} value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))}
                            className="w-28 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-right ml-auto block focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" />
                        </td>
                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                        <td className="px-6 py-4">
                          <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t">
            <span className="text-lg font-bold">Total: {formatCurrency(total)}</span>
            <div className="flex gap-3 w-full sm:w-auto">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-initial bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium px-4 py-2.5">Cancelar</button>
              <button type="submit" disabled={items.length === 0 || !supplierId} className="flex-1 sm:flex-initial bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50">
                Registrar Compra
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
