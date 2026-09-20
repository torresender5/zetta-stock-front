import { useState, useEffect, useRef } from 'react'
import { Plus, Minus, Trash2, FileText, CheckCircle, Clock, XCircle, ShoppingBag, AlertTriangle, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProductStore } from '../stores/productStore'
import { useClientStore } from '../stores/clientStore'
import { useSaleStore } from '../stores/saleStore'
import { formatCurrency, formatDateOnly, TAX_RATE, todayLocal } from '../lib/utils'
import Modal from '../components/Modal'
import ActionDropdown from '../components/ActionDropdown'
import DataTable from '../components/DataTable'
import { ProductSelect } from '../components/ProductSelect'
import { ClientSelect } from '../components/ClientSelect'
import type { Column } from '../components/DataTable/types'
import type { Sale, SaleItem, Product, PaymentMethod } from '../types'

const REFUND_METHODS = ['Efectivo', 'Transferencia', 'Otro']

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'credit', label: 'Crédito' },
]

const statusBadge = (status: Sale['paymentStatus']) => {
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-600">
        <CheckCircle className="w-3 h-3" /> Pagado
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
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-600">
      <Clock className="w-3 h-3" /> Por cobrar
    </span>
  )
}

const columns: Column<Sale>[] = [
  {
    key: 'saleNumber',
    header: 'N° Venta',
    width: '7rem',
    render: (s) =>
      s.saleNumber ? (
        <span className="font-mono font-medium text-blue-600">{s.saleNumber}</span>
      ) : (
        <span className="text-gray-300">—</span>
      ),
  },
  { key: 'clientName', header: 'Cliente', cellClassName: 'font-medium text-gray-900', truncate: true },
  { key: 'date', header: 'Fecha', hideBelow: 'sm', cellClassName: 'text-gray-500', render: (s) => formatDateOnly(s.date) },
  { key: 'items', header: 'Productos', align: 'right', hideBelow: 'md', render: (s) => s.items.length },
  { key: 'subtotal', header: 'Subtotal', align: 'right', hideBelow: 'lg', render: (s) => formatCurrency(s.subtotal) },
  { key: 'tax', header: 'IVA', align: 'right', hideBelow: 'xl', render: (s) => formatCurrency(s.tax) },
  { key: 'total', header: 'Total', align: 'right', width: '6.5rem', cellClassName: 'font-medium', render: (s) => formatCurrency(s.total) },
  {
    key: 'paymentStatus',
    header: 'Estado',
    align: 'right',
    hideBelow: 'sm',
    width: '6rem',
    render: (s) => statusBadge(s.paymentStatus ?? 'pending'),
  },
]

export default function Sales() {
  const { products, fetchAllProducts } = useProductStore()
  const { fetchClients } = useClientStore()
  const {
    salesList, salesMeta, page, limit, loading, error,
    fetchSalesPage, fetchInvoices, addSale, setPage, setLimit, updateSalePaymentStatus,
  } = useSaleStore()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState(todayLocal())
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [receivedAmount, setReceivedAmount] = useState(0)
  const [items, setItems] = useState<SaleItem[]>([])
  const [draftProductId, setDraftProductId] = useState('')
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null)
  const [pendingSize, setPendingSize] = useState('')
  const [pendingQty, setPendingQty] = useState(1)
  const [cancelSale, setCancelSale] = useState<Sale | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [refundAmount, setRefundAmount] = useState(0)
  const [refundMethod, setRefundMethod] = useState(REFUND_METHODS[0])
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  useEffect(() => {
    fetchAllProducts()
    fetchClients()
    fetchSalesPage()
    fetchInvoices()
  }, [])

  const maxStockFor = (item: Product | SaleItem) => {
    const product = 'productId' in item
      ? products.find((p) => p.id === item.productId)
      : item
    if (!product) return 0
    const size = 'size' in item ? item.size : undefined
    if (size && product.sizes && product.sizes.length > 0) {
      const s = product.sizes.find((s) => s.size === size)
      return s?.stock ?? 0
    }
    return product.stock
  }

  const openAddModal = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product || product.stock <= 0) return
    setPendingProduct(product)
    setPendingSize('')
    setPendingQty(1)
  }

  const closeAddModal = () => setPendingProduct(null)

  const confirmAdd = () => {
    if (!pendingProduct || pendingProduct.stock <= 0) return
    const hasSizes = (pendingProduct.sizes ?? []).length > 0
    if (hasSizes && !pendingSize) return
    const max = maxStockFor({ ...pendingProduct, size: hasSizes ? pendingSize : undefined })
    if (pendingQty < 1 || pendingQty > max) return
    setItems([
      ...items,
      {
        productId: pendingProduct.id,
        productName: pendingProduct.name,
        size: hasSizes ? pendingSize : undefined,
        quantity: pendingQty,
        unitPrice: pendingProduct.salePrice,
        subtotal: pendingProduct.salePrice * pendingQty,
      },
    ])
    closeAddModal()
    setDraftProductId('')
  }

  const updateItem = (index: number, quantity: number) => {
    const updated = [...items]
    const item = { ...updated[index] }
    const max = maxStockFor(item)
    item.quantity = Math.max(1, Math.min(Math.max(quantity, 1), max > 0 ? max : 1))
    item.subtotal = item.quantity * item.unitPrice
    updated[index] = item
    setItems(updated)
  }

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const tax = Math.round(subtotal * TAX_RATE)
  const total = subtotal + tax

  const hasSizes = (pendingProduct?.sizes?.length ?? 0) > 0
  const available = pendingProduct ? maxStockFor({ ...pendingProduct, size: hasSizes ? pendingSize : undefined }) : 0
  const qtyCap = available > 0 ? available : 1
  const sizeMissing = hasSizes && !pendingSize

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0 || !clientId) return
    try {
      await addSale(
        clientId,
        date,
        items,
        paymentStatus,
        paymentStatus === 'paid' ? paymentMethod : 'credit',
        paymentStatus === 'paid' && paymentMethod === 'cash'
          ? Number(receivedAmount) || 0
          : undefined,
      )
      setIsModalOpen(false)
      setClientId('')
      setPaymentStatus('paid')
      setPaymentMethod('cash')
      setReceivedAmount(0)
      setItems([])
      setDraftProductId('')
    } catch {
      // error se maneja en el store
    }
  }

  const openCancelModal = (s: Sale) => {
    setCancelSale(s)
    setCancelReason('')
    setRefundAmount(s.total)
    setRefundMethod(REFUND_METHODS[0])
  }

  const handleCancel = async () => {
    if (!cancelSale || submittingRef.current) return
    if (!cancelReason.trim()) return
    submittingRef.current = true
    setSubmitting(true)
    try {
      const wasPaid = cancelSale.paymentStatus === 'paid'
      await updateSalePaymentStatus(
        cancelSale.id,
        'cancelled',
        cancelReason.trim(),
        wasPaid ? Number(refundAmount) || 0 : undefined,
        wasPaid ? refundMethod : undefined,
      )
      setCancelSale(null)
    } catch {
      // error se maneja en el store
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const cancelIsPaid = cancelSale?.paymentStatus === 'paid'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
          <p className="text-sm text-gray-500 mt-1">{salesMeta.total} ventas registradas</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium">
          <Plus className="w-4 h-4" /> Nueva Venta
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={salesList}
        getRowKey={(s) => s.id}
        loading={loading && salesList.length === 0}
        emptyIcon={<ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-40" />}
        emptyMessage={loading ? 'Cargando ventas...' : 'No hay ventas registradas'}
        pagination={{
          page,
          limit,
          total: salesMeta.total,
          totalPages: salesMeta.totalPages,
          onPageChange: setPage,
          onLimitChange: setLimit,
        }}
        actions={(s) => (
          <div className="flex justify-end gap-1">
            <ActionDropdown
              actions={[
                {
                  label: 'Detalles',
                  icon: <Info className="w-4 h-4" />,
                  onClick: () => navigate(`/sales/${s.id}`),
                },
                {
                  label: 'Ver factura',
                  icon: <FileText className="w-4 h-4" />,
                  onClick: () => navigate(`/invoices?saleId=${s.id}`),
                },
                ...(s.paymentStatus === 'pending'
                  ? [
                      {
                        label: 'Marcar como pagada',
                        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
                        onClick: () => updateSalePaymentStatus(s.id, 'paid'),
                      },
                      {
                        label: 'Cancelar venta',
                        icon: <XCircle className="w-4 h-4" />,
                        className: 'text-red-600 hover:bg-red-50',
                        onClick: () => openCancelModal(s),
                      },
                    ]
                  : []),
                ...(s.paymentStatus === 'paid'
                  ? [
                      {
                        label: 'Marcar como por cobrar',
                        icon: <Clock className="w-4 h-4 text-orange-500" />,
                        onClick: () => updateSalePaymentStatus(s.id, 'pending'),
                      },
                      {
                        label: 'Cancelar venta (reembolso)',
                        icon: <XCircle className="w-4 h-4" />,
                        className: 'text-red-600 hover:bg-red-50',
                        onClick: () => openCancelModal(s),
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Venta" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cliente *</label>
              <ClientSelect value={clientId} onChange={setClientId} />
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
                <span className="text-sm font-medium">Por Cobrar</span>
              </label>
            </div>
          </div>

          {paymentStatus === 'paid' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Método de pago *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.value}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-colors ${
                      paymentMethod === m.value
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.value}
                      checked={paymentMethod === m.value}
                      onChange={() => setPaymentMethod(m.value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{m.label}</span>
                  </label>
                ))}
              </div>

              {paymentMethod === 'cash' && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Recibido (COP)</label>
                    <input
                      type="number"
                      min={0}
                      step="100"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all tabular-nums"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Vuelto</label>
                    <div className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 text-sm font-semibold tabular-nums">
                      {receivedAmount > total ? formatCurrency(receivedAmount - total) : formatCurrency(0)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Productos</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <ProductSelect value={draftProductId} onChange={setDraftProductId} products={products} />
              </div>
              <button
                type="button"
                onClick={() => openAddModal(draftProductId)}
                disabled={!draftProductId}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-sm font-medium text-violet-600 border border-violet-200 bg-violet-50 rounded-xl px-5 py-2 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Plus className="w-3 h-3" /> Agregar producto
              </button>
            </div>
          </div>
            {items.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-200 rounded-xl">Agrega productos a la venta</p>
            ) : (
              <div className="space-y-3">
                {items.map((item, i) => {
                  const product = products.find((p) => p.id === item.productId)
                  const max = maxStockFor(item)
                  return (
                    <div
                      key={`${item.productId}_${item.size ?? ''}_${i}`}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-gray-200 p-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {product?.image ? (
                          <img
                            src={product.image}
                            alt={item.productName}
                            className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600 flex items-center justify-center text-lg font-bold shrink-0">
                            {item.productName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                            {item.size && (
                              <span className="inline-flex px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-xs font-semibold shrink-0">
                                {item.size}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{formatCurrency(item.unitPrice)} c/u · Stock: {max}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateItem(i, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label={`Disminuir cantidad de ${item.productName}`}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateItem(i, item.quantity + 1)}
                            disabled={item.quantity >= max}
                            aria-label={`Aumentar cantidad de ${item.productName}`}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-violet-600 tabular-nums w-24 text-right sm:text-left">
                          {formatCurrency(item.subtotal)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          aria-label={`Eliminar ${item.productName}`}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg p-1.5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

          <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>IVA (19%):</span><span>{formatCurrency(tax)}</span></div>
            <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total:</span><span>{formatCurrency(total)}</span></div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium px-4 py-2.5">Cancelar</button>
            <button type="submit" disabled={items.length === 0 || !clientId}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50">
              Registrar Venta
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!pendingProduct} onClose={closeAddModal} title="Agregar producto" size="md">
        {pendingProduct && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              {pendingProduct.image ? (
                <img
                  src={pendingProduct.image}
                  alt={pendingProduct.name}
                  className="w-14 h-14 rounded-xl object-cover bg-gray-100 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600 flex items-center justify-center text-xl font-bold shrink-0">
                  {pendingProduct.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{pendingProduct.name}</p>
                <p className="text-sm text-gray-500">{pendingProduct.code} · {formatCurrency(pendingProduct.salePrice)} c/u</p>
              </div>
            </div>

            {(pendingProduct.sizes ?? []).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Talla *</label>
                <div className="flex flex-wrap gap-2">
                  {(pendingProduct.sizes ?? []).map((s) => {
                    const stock = s.stock ?? 0
                    const selected = pendingSize === s.size
                    return (
                      <button
                        key={s.size}
                        type="button"
                        onClick={() => {
                          const next = selected ? '' : s.size
                          setPendingSize(next)
                          setPendingQty(1)
                        }}
                        disabled={stock <= 0}
                        className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${
                          selected
                            ? 'border-violet-500 bg-violet-50 text-violet-700'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${stock <= 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {s.size}
                        <span className="ml-1.5 text-xs text-gray-400 font-normal">{stock}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad *</label>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPendingQty(Math.max(1, pendingQty - 1))}
                    disabled={pendingQty <= 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={qtyCap}
                    value={pendingQty}
                    onChange={(e) => setPendingQty(Math.max(1, Math.min(Number(e.target.value) || 1, qtyCap)))}
                    className="w-20 text-center border border-gray-200 rounded-xl px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setPendingQty(Math.min(available, pendingQty + 1))}
                    disabled={pendingQty >= available}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">Stock disponible: {available}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-lg font-bold text-gray-900 tabular-nums">{formatCurrency(pendingProduct.salePrice * pendingQty)}</span>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={closeAddModal}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmAdd}
                disabled={sizeMissing || pendingQty < 1 || pendingQty > available || available <= 0}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar a la venta
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!cancelSale} onClose={() => { if (!submitting) setCancelSale(null) }} title="Cancelar Venta">
        <div className="space-y-5">
          {cancelSale && (
            <div className="space-y-1 text-sm">
              <p className="font-medium text-gray-900">{cancelSale.clientName}</p>
              <p className="text-gray-500">Total: <span className="font-semibold text-gray-900">{formatCurrency(cancelSale.total)}</span></p>
              <p className="text-gray-500">Estado actual: {statusBadge(cancelSale.paymentStatus ?? 'pending')}</p>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              Al cancelar la venta se restaurará el stock de los productos y la factura quedará como cancelada. Esta acción no se puede deshacer.
            </p>
          </div>

          {cancelIsPaid && (
            <div className="space-y-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
              <p className="flex items-center gap-2 text-sm font-medium text-amber-700">
                <AlertTriangle className="w-4 h-4" /> Reembolso de la venta pagada
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Monto a reembolsar *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Método de reembolso *</label>
                  <select
                    required
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all bg-white"
                  >
                    {REFUND_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo de la cancelación *</label>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Describe el motivo de la cancelación de la venta..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCancelSale(null)}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={!cancelReason.trim() || submitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Cancelando...' : 'Cancelar venta'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}