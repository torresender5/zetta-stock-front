import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Hash,
  ImageIcon,
  Loader2,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Save,
  StickyNote,
  Trash2,
  User,
  XCircle,
} from 'lucide-react'
import { useSaleStore } from '../stores/saleStore'
import { useProductStore } from '../stores/productStore'
import { formatDate, formatDateOnly } from '../lib/utils'
import CurrencyToggle, { useDisplayCurrency } from '../components/CurrencyToggle'
import { ClientSelect } from '../components/ClientSelect'
import { ProductSelect } from '../components/ProductSelect'
import Modal from '../components/Modal'
import type { Sale, SaleItem, Product, PaymentMethod } from '../types'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'credit', label: 'Crédito' },
]

const statusConfig = {
  paid: {
    label: 'Pagada',
    className: 'bg-green-100 text-green-700',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  pending: {
    label: 'Por cobrar',
    className: 'bg-amber-100 text-amber-700',
    icon: <Clock className="w-3 h-3" />,
  },
  cancelled: {
    label: 'Cancelada',
    className: 'bg-red-100 text-red-700',
    icon: <XCircle className="w-3 h-3" />,
  },
} as const

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 px-6 pt-5 pb-4 border-b border-gray-100">
      <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-violet-50 text-violet-600">
        {icon}
      </span>
      <h2 className="font-semibold text-sm text-gray-900 uppercase tracking-wider">{title}</h2>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-800 break-words">{value || '—'}</p>
      </div>
    </div>
  )
}

function DetailRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-gray-900 text-base' : 'font-semibold text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}

export default function SaleDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { sale, loading, error, fetchSaleById, updateSale } = useSaleStore()
  const { products, fetchAllProducts } = useProductStore()
  const { currency, setCurrency, fmt } = useDisplayCurrency()
  const [notFound, setNotFound] = useState(false)
  const [previewProductId, setPreviewProductId] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editClientId, setEditClientId] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editMethod, setEditMethod] = useState<PaymentMethod>('cash')
  const [editItems, setEditItems] = useState<SaleItem[]>([])
  const [editError, setEditError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [addProductId, setAddProductId] = useState('')
  const [notes, setNotes] = useState('')
  const [notesError, setNotesError] = useState<string | null>(null)
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    if (sale) setNotes(sale.notes ?? '')
  }, [sale?.id])

  useEffect(() => {
    if (!id) return
    fetchSaleById(id).catch(() => setNotFound(true))
    fetchAllProducts()
  }, [id, fetchSaleById, fetchAllProducts])

  const previewProduct: Product | null = previewProductId
    ? products.find((p) => p.id === previewProductId) ?? null
    : null

  if (loading && !sale) {
    return (
      <div className="max-w-6xl mx-auto animate-pulse">
        <div className="h-6 w-40 bg-gray-100 rounded-lg mb-6" />
        <div className="h-40 bg-gradient-to-r from-violet-200 to-indigo-200 rounded-3xl mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-gray-100 rounded-2xl" />
          <div className="h-72 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error && !sale) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-red-600 font-medium">Error al cargar la venta.</p>
        <button
          onClick={() => navigate('/sales')}
          className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Ventas
        </button>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-gray-600">{notFound ? 'La venta no existe o no tienes acceso a ella.' : 'Venta no encontrada.'}</p>
        <button
          onClick={() => navigate('/sales')}
          className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Ventas
        </button>
      </div>
    )
  }

  const status = statusConfig[sale.paymentStatus] ?? statusConfig.pending
  const clientName = sale.client?.name ?? sale.clientName ?? '—'

  const saleDate = new Date(sale.date)
  const safeDate = isNaN(saleDate.getTime()) ? new Date(sale.createdAt) : saleDate

  const stockOf = (productId: string, size?: string): number => {
    const p = products.find((x) => x.id === productId)
    if (!p) return Number.MAX_SAFE_INTEGER
    if (size && p.sizes && p.sizes.length > 0) {
      const s = p.sizes.find((x) => x.size === size)
      return s?.stock ?? 0
    }
    return p.stock
  }

  const openEdit = () => {
    setEditClientId(sale.clientId ? String(sale.clientId) : '')
    setEditDate(sale.date ? sale.date.slice(0, 10) : '')
    setEditMethod(sale.paymentMethod ?? 'cash')
    setEditItems(sale.items.map((i) => ({ ...i })))
    setEditError(null)
    setAddProductId('')
    setIsEditOpen(true)
  }

  const updateEditItem = (index: number, field: 'quantity' | 'unitPrice', raw: number) => {
    setEditItems((items) =>
      items.map((it, i) => {
        if (i !== index) return it
        const max = stockOf(it.productId, it.size)
        let value = raw
        if (field === 'quantity') value = Math.max(1, Math.min(raw, max))
        else value = Math.max(0, raw)
        const next = { ...it, [field]: value } as SaleItem
        next.subtotal = Math.round(next.quantity * next.unitPrice * 100) / 100
        return next
      })
    )
  }

  const removeEditItem = (index: number) => {
    setEditItems((items) => items.filter((_, i) => i !== index))
  }

  const addEditRow = (productId: string) => {
    setAddProductId('')
    if (!productId) return
    const p = products.find((x) => x.id === productId)
    if (!p) return
    const size =
      p.sizes && p.sizes.length > 0
        ? (p.sizes.find((s) => (s.stock ?? 0) > 0)?.size ?? p.sizes[0].size)
        : undefined
    setEditItems((items) => {
      const idx = items.findIndex((it) => it.productId === productId && it.size === size)
      if (idx >= 0) {
        return items.map((it, i) => {
          if (i !== idx) return it
          const quantity = Math.min(it.quantity + 1, stockOf(productId, size))
          return { ...it, quantity, subtotal: Math.round(quantity * it.unitPrice * 100) / 100 }
        })
      }
      return [
        ...items,
        {
          productId,
          productName: p.name,
          size,
          quantity: 1,
          unitPrice: p.salePrice,
          subtotal: Math.round(p.salePrice * 100) / 100,
        },
      ]
    })
  }

  const editSubtotal = editItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0)
  const editTax = editSubtotal * 0.19

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editItems.length === 0) {
      setEditError('Debe haber al menos un producto en la venta.')
      return
    }
    if (editItems.some((it) => it.quantity < 1)) {
      setEditError('Revisa las cantidades de cada producto.')
      return
    }
    setSaving(true)
    setEditError(null)
    const res = await updateSale(sale.id, {
      clientId: editClientId || undefined,
      date: editDate,
      paymentMethod: editMethod,
      items: editItems.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        ...(it.size ? { size: it.size } : {}),
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: Math.round(it.quantity * it.unitPrice * 100) / 100,
      })),
    })
    setSaving(false)
    if (res.ok) setIsEditOpen(false)
    else setEditError(res.error ?? 'Error al actualizar la venta')
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    setNotesError(null)
    const res = await updateSale(sale.id, { notes })
    setSavingNotes(false)
    if (!res.ok) setNotesError(res.error ?? 'Error al guardar las notas')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        to="/sales"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a Ventas
      </Link>

      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-violet-500/20 mb-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-indigo-300/20 rounded-full blur-2xl" />

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 relative">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-200 mb-2">
              Venta
            </p>
            <h1 className="font-mono text-2xl sm:text-3xl font-bold tracking-tight">
              {sale.saleNumber ?? `#${sale.id}`}
            </h1>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-violet-100">
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-4 h-4" /> {clientName}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" /> {formatDateOnly(safeDate)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {sale.paymentStatus === 'pending' && (
                  <button
                    onClick={openEdit}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-medium transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> Editar
                  </button>
                )}
                <CurrencyToggle value={currency} onChange={setCurrency} />
              </div>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold self-start sm:self-auto bg-white text-gray-900 shadow-lg`}>
            {status.icon} {status.label}
          </span>
        </div>
      </div>

      {sale.paymentStatus === 'cancelled' && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            <p className="font-semibold">Venta cancelada</p>
            <p className="mt-0.5">
              {sale.cancelledReason
                ? `Motivo: ${sale.cancelledReason}`
                : 'Esta venta fue cancelada.'}
            </p>
            {sale.refundAmount != null && (
              <p className="mt-0.5 text-red-600">
                Reembolso: {fmt(sale.refundAmount, sale.refundAmountVes)}
                {sale.refundMethod ? ` · ${sale.refundMethod}` : ''}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader icon={<Package className="w-4 h-4" />} title="Productos de la venta" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Producto</th>
                    <th className="text-right px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Cantidad</th>
                    <th className="text-right px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Precio Unit.</th>
                    <th className="text-right px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sale.items.map((item, i) => {
                    const product = products.find((p) => p.id === item.productId)
                    return (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product?.image ? (
                              <img
                                src={product.image}
                                alt={item.productName}
                                className="w-11 h-11 rounded-xl object-cover border border-gray-100 shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                                <ImageIcon className="w-5 h-5 text-gray-300" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                              {item.size && <p className="text-xs text-gray-400 mt-0.5">Talla: {item.size}</p>}
                            </div>
                            <button
                              onClick={() => setPreviewProductId(item.productId)}
                              title="Ver producto"
                              className="p-2 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">{item.quantity}</td>
                        <td className="px-6 py-4 text-right text-gray-600">{fmt(item.unitPrice, item.unitPriceVes)}</td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">{fmt(item.subtotal, item.subtotalVes)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader icon={<User className="w-4 h-4" />} title="Datos del cliente" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 px-6 py-4">
              <InfoRow icon={<User className="w-4 h-4" />} label="Cliente" value={clientName} />
              <InfoRow icon={<Hash className="w-4 h-4" />} label="Documento" value={sale.client?.document ?? ''} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Dirección" value={sale.client?.address ?? ''} />
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Teléfono" value={sale.client?.phone ?? ''} />
              <InfoRow icon={<Mail className="w-4 h-4" />} label="Correo" value={sale.client?.email ?? ''} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader icon={<Receipt className="w-4 h-4" />} title="Facturación" />
            <div className="px-6 py-5 space-y-3">
              <DetailRow label="Subtotal" value={fmt(sale.subtotal, sale.subtotalVes)} />
              <DetailRow label="IVA (19%)" value={fmt(sale.tax, sale.taxVes)} />
              <div className="border-t border-dashed border-gray-200 pt-3">
                <DetailRow label="Total" value={fmt(sale.total, sale.totalVes)} bold />
              </div>
              <div className="mt-1 flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">Estado de pago</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${status.className}`}>
                  {status.icon} {status.label}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader icon={<StickyNote className="w-4 h-4" />} title="Notas" />
            <div className="px-6 py-4 space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Observaciones de la venta (editable en cualquier estado)..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all resize-y"
              />
              {notesError && <p className="text-xs text-red-500">{notesError}</p>}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes || notes === (sale.notes ?? '')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader icon={<FileText className="w-4 h-4" />} title="Factura asociada" />
            <div className="px-6 py-5">
              {sale.invoice ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Número de factura</p>
                    <p className="font-mono text-lg font-bold text-blue-600">{sale.invoice.invoiceNumber}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Estado</p>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${status.className}`}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                    <Link
                      to={`/invoices?saleId=${sale.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
                    >
                      Ver factura <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No hay factura asociada a esta venta.</p>
              )}
            </div>
          </Card>

          <div className="bg-gray-50 rounded-2xl px-6 py-4 text-xs text-gray-500 border border-gray-100">
            Venta creada el {formatDate(sale.createdAt)}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Editar venta ${sale.saleNumber ?? ''}`}
        size="xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-2.5 text-sm text-amber-700">
            Solo se permite editar ventas <span className="font-semibold">pendientes por cobrar</span>. Al guardar,
            el stock y la factura se recalculan automáticamente.
          </div>

          {editError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{editError}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cliente</label>
              <ClientSelect value={editClientId} onChange={setEditClientId} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha *</label>
              <input
                required
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Método de pago *</label>
              <select
                value={editMethod}
                onChange={(e) => setEditMethod(e.target.value as PaymentMethod)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all bg-white"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Productos de la venta</label>
            <div className="mb-2">
              <ProductSelect
                value={addProductId}
                onChange={addEditRow}
                products={products}
              />
            </div>
            {editItems.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center bg-gray-50 rounded-xl">
                Sin productos. Agrega al menos uno con el buscador de arriba.
              </p>
            ) : (
              <div className="space-y-2">
                {editItems.map((it, i) => {
                  const max = stockOf(it.productId, it.size)
                  const unlimited = max === Number.MAX_SAFE_INTEGER
                  return (
                    <div key={`${it.productId}-${it.size ?? ''}-${i}`} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{it.productName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {it.size ? `Talla: ${it.size}` : 'Sin talla'}
                          {!unlimited && ` · Disponible: ${max}`}
                        </p>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 uppercase mb-0.5">Cant.</label>
                        <input
                          type="number"
                          min={1}
                          max={unlimited ? undefined : max}
                          value={it.quantity}
                          onChange={(e) => updateEditItem(i, 'quantity', Number(e.target.value))}
                          className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 uppercase mb-0.5">P. Unit.</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={it.unitPrice}
                          onChange={(e) => updateEditItem(i, 'unitPrice', Number(e.target.value))}
                          className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                        />
                      </div>
                      <span className="w-24 text-right text-sm font-semibold text-gray-900 shrink-0">
                        {fmt(Math.round(it.quantity * it.unitPrice * 100) / 100)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEditItem(i)}
                        title="Quitar producto"
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-gray-100 text-sm">
            <span className="text-gray-500">
              Subtotal {fmt(editSubtotal)} · IVA (19%) {fmt(editTax)}
            </span>
            <span className="font-bold text-gray-900 text-base">Total {fmt(editSubtotal + editTax)}</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || editItems.length === 0}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!previewProduct}
        onClose={() => setPreviewProductId(null)}
        title="Vista previa del producto"
        size="sm"
      >
        {previewProduct && (
          <div className="space-y-5">
            {previewProduct.image ? (
              <div className="rounded-2xl overflow-hidden bg-gray-50">
                <img
                  src={previewProduct.image}
                  alt={previewProduct.name}
                  className="w-full max-h-64 object-cover"
                />
              </div>
            ) : (
              <div className="h-40 rounded-2xl bg-gray-50 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-gray-300" />
              </div>
            )}

            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{previewProduct.name}</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  {previewProduct.code}
                  {previewProduct.sku ? ` · ${previewProduct.sku}` : ''}
                </p>
              </div>
              <span className="inline-flex px-2.5 py-1 bg-violet-50 text-violet-600 rounded-lg text-xs font-medium shrink-0">
                {previewProduct.category}
              </span>
            </div>

            {previewProduct.description && (
              <p className="text-sm text-gray-600">{previewProduct.description}</p>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">P. Venta</p>
                <p className="font-bold text-gray-900">{fmt(previewProduct.salePrice)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">P. Compra</p>
                <p className="font-semibold text-gray-700">{fmt(previewProduct.purchasePrice)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Stock</p>
                <p className={`font-bold ${previewProduct.stock === 0 ? 'text-red-600' : previewProduct.stock < 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {previewProduct.stock}
                </p>
              </div>
            </div>

            {previewProduct.sizes && previewProduct.sizes.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Tallas disponibles</p>
                <div className="flex flex-wrap gap-2">
                  {previewProduct.sizes.map((s) => (
                    <span
                      key={s.size}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700"
                    >
                      {s.size}
                      {s.stock != null && <span className="text-gray-400">({s.stock})</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}