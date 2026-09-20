import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  PackagePlus,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Info,
  HandCoins,
} from 'lucide-react'
import { useProductStore } from '../stores/productStore'
import { useClientStore } from '../stores/clientStore'
import { useApartadoStore } from '../stores/apartadoStore'
import {
  formatCurrency,
  formatDateOnly,
  TAX_RATE,
  todayLocal,
} from '../lib/utils'
import Modal from '../components/Modal'
import ActionDropdown from '../components/ActionDropdown'
import DataTable from '../components/DataTable'
import { ProductSelect } from '../components/ProductSelect'
import { ClientSelect } from '../components/ClientSelect'
import type { Column } from '../components/DataTable/types'
import type {
  Apartado,
  ApartadoItem,
  PaymentMethod,
  Product,
} from '../types'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
]

const statusBadge = (status: Apartado['status']) => {
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-600">
        <CheckCircle className="w-3 h-3" /> Saldado
      </span>
    )
  }
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600">
        <XCircle className="w-3 h-3" /> Cancelado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-600">
      <Clock className="w-3 h-3" /> Activo
    </span>
  )
}

const columns: Column<Apartado>[] = [
  {
    key: 'apartadoNumber',
    header: 'N° Apartado',
    width: '8rem',
    render: (a) => (
      <span className="font-mono font-medium text-violet-600">
        {a.apartadoNumber}
      </span>
    ),
  },
  {
    key: 'client',
    header: 'Cliente',
    truncate: true,
    cellClassName: 'font-medium text-gray-900',
    render: (a) => a.client?.name ?? '—',
  },
  {
    key: 'date',
    header: 'Fecha',
    hideBelow: 'sm',
    cellClassName: 'text-gray-500',
    render: (a) => formatDateOnly(a.date),
  },
  {
    key: 'dueDate',
    header: 'Vence',
    hideBelow: 'lg',
    cellClassName: 'text-gray-500',
    render: (a) => (a.dueDate ? formatDateOnly(a.dueDate) : '—'),
  },
  {
    key: 'total',
    header: 'Total',
    align: 'right',
    hideBelow: 'sm',
    render: (a) => formatCurrency(a.total),
  },
  {
    key: 'totalPaid',
    header: 'Abonado',
    align: 'right',
    hideBelow: 'md',
    cellClassName: 'text-emerald-600',
    render: (a) => formatCurrency(a.totalPaid),
  },
  {
    key: 'balance',
    header: 'Saldo',
    align: 'right',
    width: '7rem',
    cellClassName: 'font-medium',
    render: (a) => formatCurrency(Math.max(a.total - a.totalPaid, 0)),
  },
  {
    key: 'status',
    header: 'Estado',
    align: 'right',
    hideBelow: 'sm',
    width: '6.5rem',
    render: (a) => statusBadge(a.status),
  },
]

const FILTERS: { value: '' | Apartado['status']; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'paid', label: 'Saldados' },
  { value: 'cancelled', label: 'Cancelados' },
]

export default function Apartados() {
  const { products, fetchAllProducts } = useProductStore()
  const { fetchClients } = useClientStore()
  const {
    apartados,
    meta,
    page,
    limit,
    statusFilter,
    loading,
    error,
    fetchApartados,
    setPage,
    setStatusFilter,
    createApartado,
  } = useApartadoStore()
  const navigate = useNavigate()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState(todayLocal())
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [initialPayment, setInitialPayment] = useState(0)
  const [initialPaymentMethod, setInitialPaymentMethod] =
    useState<PaymentMethod>('cash')
  const [items, setItems] = useState<ApartadoItem[]>([])
  const [draftProductId, setDraftProductId] = useState('')
  const [draftSize, setDraftSize] = useState('')
  const [draftQty, setDraftQty] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllProducts()
    fetchClients()
    fetchApartados()
  }, [])

  const selectedProduct: Product | null =
    products.find((p) => p.id === draftProductId) ?? null
  const hasSizes = (selectedProduct?.sizes?.length ?? 0) > 0

  const maxStockFor = (productId: string, size?: string): number => {
    const product = products.find((p) => p.id === productId)
    if (!product) return 0
    if (size && product.sizes && product.sizes.length > 0) {
      return product.sizes.find((s) => s.size === size)?.stock ?? 0
    }
    return product.stock
  }

  const draftAvailable = selectedProduct
    ? maxStockFor(selectedProduct.id, hasSizes ? draftSize : undefined)
    : 0
  const draftQtyCap = draftAvailable > 0 ? draftAvailable : 1
  const sizeMissing = hasSizes && !draftSize

  const addDraftItem = () => {
    if (!selectedProduct || draftAvailable <= 0 || sizeMissing) return
    const qty = Math.max(1, Math.min(draftQty, draftQtyCap))
    const size = hasSizes ? draftSize : undefined
    setItems((prev) => {
      const existing = prev.findIndex(
        (i) => i.productId === selectedProduct.id && i.size === size,
      )
      if (existing >= 0) {
        const updated = [...prev]
        const current = { ...updated[existing] }
        const max = maxStockFor(selectedProduct.id, size)
        current.quantity = Math.min(current.quantity + qty, max)
        current.subtotal = current.quantity * current.unitPrice
        updated[existing] = current
        return updated
      }
      return [
        ...prev,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          size,
          quantity: qty,
          unitPrice: selectedProduct.salePrice,
          subtotal: selectedProduct.salePrice * qty,
        },
      ]
    })
    setDraftProductId('')
    setDraftSize('')
    setDraftQty(1)
  }

  const updateItemQty = (index: number, quantity: number) => {
    setItems((prev) => {
      const updated = [...prev]
      const item = { ...updated[index] }
      const max = maxStockFor(item.productId, item.size ?? undefined)
      item.quantity = Math.max(1, Math.min(quantity, max > 0 ? max : 1))
      item.subtotal = item.quantity * item.unitPrice
      updated[index] = item
      return updated
    })
  }

  const removeItem = (index: number) =>
    setItems((prev) => prev.filter((_, i) => i !== index))

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const tax = Math.round(subtotal * TAX_RATE)
  const total = subtotal + tax
  const balance = Math.max(total - (Number(initialPayment) || 0), 0)

  const resetForm = () => {
    setClientId('')
    setDate(todayLocal())
    setDueDate('')
    setNotes('')
    setInitialPayment(0)
    setInitialPaymentMethod('cash')
    setItems([])
    setDraftProductId('')
    setDraftSize('')
    setDraftQty(1)
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0 || !clientId || submitting) return
    if (Number(initialPayment) > total) {
      setFormError('El anticipo no puede superar el total')
      return
    }
    setSubmitting(true)
    setFormError(null)
    const result = await createApartado({
      clientId,
      date,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
      initialPayment: Number(initialPayment) || 0,
      initialPaymentMethod,
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        size: i.size ?? undefined,
        unitPrice: i.unitPrice,
      })),
    })
    setSubmitting(false)
    if (result.ok) {
      setIsModalOpen(false)
      resetForm()
    } else {
      setFormError(result.error ?? 'Error al crear el apartado')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apartados</h1>
          <p className="text-sm text-gray-500 mt-1">
            {meta.total} apartados registrados
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nuevo Apartado
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
                : 'bg-card border border-border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={apartados}
        getRowKey={(a) => a.id}
        loading={loading && apartados.length === 0}
        emptyIcon={<PackagePlus className="w-10 h-10 mx-auto mb-3 opacity-40" />}
        emptyMessage={
          loading ? 'Cargando apartados...' : 'No hay apartados registrados'
        }
        pagination={{
          page,
          limit,
          total: meta.total,
          totalPages: meta.totalPages,
          onPageChange: setPage,
          onLimitChange: () => {},
        }}
        actions={(a) => (
          <div className="flex justify-end gap-1">
            <ActionDropdown
              actions={[
                {
                  label: 'Ver detalle',
                  icon: <Info className="w-4 h-4" />,
                  onClick: () => navigate(`/apartados/${a.id}`),
                },
              ]}
            />
          </div>
        )}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Apartado"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Cliente *
              </label>
              <ClientSelect value={clientId} onChange={setClientId} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fecha *
                </label>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fecha límite
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Productos *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
              <ProductSelect
                value={draftProductId}
                onChange={(id) => {
                  setDraftProductId(id)
                  const p = products.find((x) => x.id === id)
                  setDraftSize(p?.sizes?.[0]?.size ?? '')
                  setDraftQty(1)
                }}
                products={products}
              />
              {hasSizes && (
                <select
                  value={draftSize}
                  onChange={(e) => {
                    setDraftSize(e.target.value)
                    setDraftQty(1)
                  }}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
                >
                  {selectedProduct?.sizes?.map((s) => (
                    <option key={s.size} value={s.size}>
                      {s.size} ({s.stock ?? 0})
                    </option>
                  ))}
                </select>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={draftQtyCap}
                  value={draftQty}
                  onChange={(e) => setDraftQty(Number(e.target.value))}
                  className="w-20 border border-gray-200 rounded-xl px-3 py-2.5 text-sm tabular-nums"
                />
                <button
                  type="button"
                  onClick={addDraftItem}
                  disabled={
                    !selectedProduct || draftAvailable <= 0 || sizeMissing
                  }
                  className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </div>
            </div>
            {selectedProduct && (
              <p className="text-xs text-gray-500 mt-1.5">
                Stock disponible: {draftAvailable}
                {availableHint(selectedProduct, hasSizes, draftSize)}
              </p>
            )}

            {items.length > 0 && (
              <div className="mt-4 divide-y divide-gray-100 border-t border-border">
                {items.map((item, index) => (
                  <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.productName}
                        {item.size ? ` · ${item.size}` : ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(item.unitPrice)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateItemQty(index, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateItemQty(index, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
                      >
                        +
                      </button>
                    </div>
                    <span className="w-24 text-right text-sm font-medium tabular-nums">
                      {formatCurrency(item.subtotal)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Quitar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Anticipo (COP)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={initialPayment}
                onChange={(e) => setInitialPayment(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm tabular-nums"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Medio del anticipo
              </label>
              <select
                value={initialPaymentMethod}
                onChange={(e) =>
                  setInitialPaymentMethod(e.target.value as PaymentMethod)
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notas
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>IVA (19%)</span>
              <span className="tabular-nums">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1.5">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between font-semibold text-violet-600">
              <span>Saldo pendiente</span>
              <span className="tabular-nums">{formatCurrency(balance)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                items.length === 0 || !clientId || submitting || balance < 0
              }
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50"
            >
              <HandCoins className="w-4 h-4" />
              {submitting ? 'Creando...' : 'Crear apartado'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function availableHint(
  product: Product,
  hasSizes: boolean,
  size: string,
): string {
  if (!hasSizes) return ''
  const match = product.sizes?.find((s) => s.size === size)
  return match ? ` (talla ${size})` : ''
}