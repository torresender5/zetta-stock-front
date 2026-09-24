import { useState, useEffect } from 'react'
import { Plus, Minus, Trash2, Info, CheckCircle, Clock, ShoppingBag, Search, Calendar, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProductStore } from '../stores/productStore'
import { usePurchaseStore } from '../stores/purchaseStore'
import { useSupplierStore } from '../stores/supplierStore'
import { formatCurrency, formatDateOnly, TAX_RATE, todayLocal } from '../lib/utils'
import Modal from '../components/Modal'
import ActionDropdown from '../components/ActionDropdown'
import DataTable from '../components/DataTable'
import { ProductSelect } from '../components/ProductSelect'
import { SupplierSelect } from '../components/SupplierSelect'
import type { Column } from '../components/DataTable/types'
import type { Purchase, PurchaseItem, Product } from '../types'

const statusBadge = (status: Purchase['paymentStatus']) => {
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-600">
        <CheckCircle className="w-3 h-3" /> Pagado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-600">
      <Clock className="w-3 h-3" /> Por pagar
    </span>
  )
}

const columns: Column<Purchase>[] = [
  {
    key: 'purchaseNumber',
    header: 'N° Compra',
    width: '8rem',
    render: (p) =>
      p.purchaseNumber ? (
        <span className="font-mono font-medium text-blue-600">{p.purchaseNumber}</span>
      ) : (
        <span className="text-gray-300">—</span>
      ),
  },
  {
    key: 'supplier',
    header: 'Proveedor',
    cellClassName: 'font-medium text-gray-900',
    truncate: true,
    render: (p) => p.supplier?.name ?? 'Sin proveedor',
  },
  { key: 'date', header: 'Fecha', hideBelow: 'sm', cellClassName: 'text-gray-500', render: (p) => formatDateOnly(p.date) },
  { key: 'items', header: 'Productos', align: 'right', hideBelow: 'md', render: (p) => p.items.length },
  { key: 'subtotal', header: 'Subtotal', align: 'right', hideBelow: 'lg', render: (p) => formatCurrency(p.subtotal) },
  { key: 'tax', header: 'IVA', align: 'right', hideBelow: 'xl', render: (p) => formatCurrency(p.tax) },
  { key: 'total', header: 'Total', align: 'right', width: '6.5rem', cellClassName: 'font-medium', render: (p) => formatCurrency(p.total) },
  {
    key: 'paymentStatus',
    header: 'Estado',
    align: 'right',
    hideBelow: 'sm',
    width: '6rem',
    render: (p) => statusBadge(p.paymentStatus ?? 'pending'),
  },
]

export default function Purchases() {
  const { products, fetchAllProducts } = useProductStore()
  const { fetchAllSuppliers } = useSupplierStore()
  const {
    purchases,
    meta,
    loading,
    error,
    page,
    limit,
    search,
    paymentStatusFilter,
    startDateFilter,
    endDateFilter,
    fetchPurchases,
    addPurchase,
    updatePurchasePaymentStatus,
    setPage,
    setLimit,
    setSearch,
    setPaymentStatusFilter,
    setStartDateFilter,
    setEndDateFilter,
  } = usePurchaseStore()
  const navigate = useNavigate()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [date, setDate] = useState(todayLocal())
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid')
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [draftProductId, setDraftProductId] = useState('')
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null)
  const [pendingSize, setPendingSize] = useState('')
  const [pendingQty, setPendingQty] = useState(1)
  const [pendingUnitPrice, setPendingUnitPrice] = useState(0)
  const [searchInput, setSearchInput] = useState(search)

  useEffect(() => {
    fetchAllProducts()
    fetchAllSuppliers()
    fetchPurchases()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) setSearch(searchInput)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const openAddModal = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    setPendingProduct(product)
    setPendingSize('')
    setPendingQty(1)
    setPendingUnitPrice(product.purchasePrice ?? 0)
  }

  const closeAddModal = () => setPendingProduct(null)

  const confirmAdd = () => {
    if (!pendingProduct) return
    const hasSizes = (pendingProduct.sizes ?? []).length > 0
    if (hasSizes && !pendingSize) return
    const quantity = Math.max(1, pendingQty)
    const unitPrice = Math.max(0, pendingUnitPrice)
    setItems([
      ...items,
      {
        productId: pendingProduct.id,
        productName: pendingProduct.name,
        size: hasSizes ? pendingSize : undefined,
        quantity,
        unitPrice,
        subtotal: quantity * unitPrice,
      },
    ])
    closeAddModal()
    setDraftProductId('')
  }

  const updateItem = (index: number, quantity: number) => {
    const updated = [...items]
    const item = { ...updated[index] }
    item.quantity = Math.max(1, quantity)
    item.subtotal = item.quantity * item.unitPrice
    updated[index] = item
    setItems(updated)
  }

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const tax = Math.round(subtotal * TAX_RATE)
  const total = subtotal + tax

  const hasSizes = (pendingProduct?.sizes?.length ?? 0) > 0
  const sizeMissing = hasSizes && !pendingSize

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0 || !supplierId) return
    try {
      await addPurchase(supplierId, date, items, paymentStatus)
      setIsModalOpen(false)
      setSupplierId('')
      setPaymentStatus('paid')
      setItems([])
      setDraftProductId('')
    } catch {
      // error se maneja en el store
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
          <p className="text-sm text-gray-500 mt-1">{meta.total} compras registradas</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium">
          <Plus className="w-4 h-4" /> Nueva Compra
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por proveedor o producto..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border-0 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm transition-all"
          />
        </div>
        <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value as '' | 'paid' | 'pending')}
          className="bg-white border-0 rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm transition-all">
          <option value="">Estado de pago</option>
          <option value="paid">Pagado</option>
          <option value="pending">Por pagar</option>
        </select>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            placeholder="Fecha inicio"
            className="bg-white border-0 rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm transition-all"
          />
          <span className="text-gray-400 text-sm">hasta</span>
          <input
            type="date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            placeholder="Fecha fin"
            className="bg-white border-0 rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm transition-all"
          />
        </div>
        {(startDateFilter || endDateFilter) && (
          <button
            onClick={() => {
              setStartDateFilter('')
              setEndDateFilter('')
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Limpiar fechas
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={purchases}
        getRowKey={(p) => p.id}
        loading={loading && purchases.length === 0}
        emptyIcon={<ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-40" />}
        emptyMessage={loading ? 'Cargando compras...' : 'No hay compras registradas'}
        pagination={{
          page,
          limit,
          total: meta.total,
          totalPages: meta.totalPages,
          onPageChange: setPage,
          onLimitChange: setLimit,
        }}
        actions={(p) => (
          <div className="flex justify-end gap-1">
            <ActionDropdown
              actions={[
                {
                  label: 'Detalles',
                  icon: <Info className="w-4 h-4" />,
                  onClick: () => navigate(`/purchases/${p.id}`),
                },
                ...(p.paymentStatus === 'pending'
                  ? [
                      {
                        label: 'Marcar como pagada',
                        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
                        onClick: () => updatePurchasePaymentStatus(p.id, 'paid'),
                      },
                    ]
                  : []),
                ...(p.paymentStatus === 'paid'
                  ? [
                      {
                        label: 'Marcar como por pagar',
                        icon: <Clock className="w-4 h-4 text-orange-500" />,
                        onClick: () => updatePurchasePaymentStatus(p.id, 'pending'),
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Compra" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Proveedor *</label>
              <SupplierSelect value={supplierId} onChange={setSupplierId} />
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

          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Productos</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <ProductSelect value={draftProductId} onChange={setDraftProductId} products={products} includeOutOfStock allowCreate />
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
            <p className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-200 rounded-xl">Agrega productos a la compra</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, i) => {
                const product = products.find((p) => p.id === item.productId)
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
                        <p className="text-xs text-gray-500">{formatCurrency(item.unitPrice)} c/u</p>
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
                          aria-label={`Aumentar cantidad de ${item.productName}`}
                          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
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
            <button type="submit" disabled={items.length === 0 || !supplierId}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50">
              Registrar Compra
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
                <p className="text-sm text-gray-500">{pendingProduct.code} · {formatCurrency(pendingProduct.purchasePrice ?? 0)} c/u</p>
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
                        className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${
                          selected
                            ? 'border-violet-500 bg-violet-50 text-violet-700'
                            : 'border-gray-200 hover:border-gray-300'
                        } cursor-pointer`}
                      >
                        {s.size}
                        <span className="ml-1.5 text-xs text-gray-400 font-normal">stock {stock}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      value={pendingQty}
                      onChange={(e) => setPendingQty(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 text-center border border-gray-200 rounded-xl px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setPendingQty(pendingQty + 1)}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Precio unit. (COP) *</label>
                <input
                  type="number"
                  min={0}
                  step="100"
                  value={pendingUnitPrice}
                  onChange={(e) => setPendingUnitPrice(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-lg font-bold text-gray-900 tabular-nums">{formatCurrency(pendingUnitPrice * pendingQty)}</span>
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
                disabled={sizeMissing || pendingQty < 1}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar a la compra
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}