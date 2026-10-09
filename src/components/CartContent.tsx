import { useState, useEffect, useRef } from 'react'
import { Trash2, Minus, Plus, ShoppingBag, X, ScanBarcode } from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { useClientStore } from '../stores/clientStore'
import { useSaleStore } from '../stores/saleStore'
import { formatVes, getTaxRate, todayLocal } from '../lib/utils'
import CurrencyToggle, { useDisplayCurrency } from './CurrencyToggle'
import FullScreenLoader from './FullScreenLoader'
import { ClientSelect } from './ClientSelect'
import Modal from './Modal'
import BarcodeScannerModal from './BarcodeScannerModal'
import { productService } from '../services/productService'
import { useBarcodeWedge } from '../hooks/useBarcodeWedge'
import { useNavigate } from 'react-router-dom'
import type { PaymentMethod, Product } from '../types'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'credit', label: 'Crédito' },
]

interface CartContentProps {
  /** 'drawer' para el panel lateral, 'page' para la vista /cart */
  variant?: 'drawer' | 'page'
  /** En el drawer solo carga clientes cuando está abierto */
  active?: boolean
  onClose?: () => void
}

export default function CartContent({ variant = 'drawer', active = true, onClose }: CartContentProps) {
  const { items, addItem, removeItem, updateQuantity, clear } = useCartStore()
  const { allClients, fetchClients } = useClientStore()
  const { addSale } = useSaleStore()
  const navigate = useNavigate()
  const { currency, setCurrency, fmt, rate } = useDisplayCurrency()

  const [clientId, setClientId] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [sizeProduct, setSizeProduct] = useState<Product | null>(null)

  const vesOf = (usd: number) => (rate && rate > 0 ? formatVes(usd * rate) : null)

  useEffect(() => {
    if (active && allClients.length === 0) {
      fetchClients()
    }
  }, [active])

  const addProductToCart = (product: Product, size?: string) => {
    const sizeObj = size && product.sizes ? product.sizes.find((s) => s.size === size) : null
    const maxStock = sizeObj ? (sizeObj.stock ?? 0) : product.stock
    if (maxStock <= 0) {
      setScanError(`Sin stock disponible: ${product.name}`)
      return
    }
    setScanError(null)
    addItem({
      productId: product.id,
      productName: product.name,
      size,
      unitPrice: product.salePrice,
      maxStock,
    })
  }

  const handleScan = async (code: string) => {
    setScanError(null)
    setIsScannerOpen(false)
    try {
      const product = await productService.findByBarcode(code)
      if ((product.sizes ?? []).length > 0) {
        setSizeProduct(product)
        return
      }
      addProductToCart(product)
    } catch {
      setScanError(`No se encontró un producto con el código "${code}"`)
    }
  }

  useBarcodeWedge(handleScan, active && !isScannerOpen && !sizeProduct)

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const tax = Math.round(subtotal * getTaxRate())
  const total = subtotal + tax
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  const handleFinalize = async () => {
    if (items.length === 0) return
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)

    const saleItems = items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      size: i.size,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.unitPrice * i.quantity,
    }))

    try {
      const invoice = await addSale(
        clientId,
        todayLocal(),
        saleItems,
        paymentStatus,
        paymentStatus === 'paid' ? paymentMethod : 'credit',
        undefined,
        rate && rate > 0 ? rate : undefined,
      )
      clear()
      setClientId('')
      setPaymentStatus('paid')
      setPaymentMethod('cash')
      onClose?.()
      navigate(`/sales/${invoice.saleId}`)
    } catch {
      // error se maneja en el store
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          {variant === 'drawer' ? (
            <>
              <ShoppingBag className="w-5 h-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">Carrito de Venta</h2>
              {itemCount > 0 && (
                <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{itemCount}</span>
              )}
            </>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {itemCount > 0
                ? `${itemCount} producto${itemCount === 1 ? '' : 's'} en el carrito`
                : 'El carrito está vacío'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CurrencyToggle value={currency} onChange={setCurrency} />
          {variant === 'drawer' && onClose && (
            <button
              onClick={onClose}
              aria-label="Cerrar carrito"
              disabled={submitting}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
          <ShoppingBag className="w-12 h-12 mb-3 opacity-40" aria-hidden="true" />
          <p className="text-sm">El carrito está vacío</p>
          <p className="text-xs mt-1">Agrega productos desde el catálogo o escanea un código</p>
          <button
            type="button"
            onClick={() => {
              setScanError(null)
              setIsScannerOpen(true)
            }}
            className="mt-4 flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 cursor-pointer"
          >
            <ScanBarcode className="w-4 h-4" /> Escanear
          </button>
          {scanError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm text-left">
              {scanError}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Cart items */}
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => {
                setScanError(null)
                setIsScannerOpen(true)
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-violet-600 border border-violet-200 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors cursor-pointer"
            >
              <ScanBarcode className="w-4 h-4" /> Escanear código de barras
            </button>
            {scanError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{scanError}</div>
            )}
            {items.map((item) => (
              <div key={`${item.productId}_${item.size || ''}`} className="flex gap-3 items-start bg-background rounded-xl p-3 border border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground truncate">{item.productName}</p>
                    {item.size && (
                      <span className="inline-flex px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs font-medium shrink-0">
                        {item.size}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{fmt(item.unitPrice)} c/u</p>
                  <p className="text-sm font-semibold text-primary mt-1 tabular-nums">
                    {fmt(item.unitPrice * item.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1, item.size)}
                    disabled={item.quantity <= 1}
                    aria-label={`Disminuir cantidad de ${item.productName}`}
                    className="p-1 rounded-lg bg-card border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1, item.size)}
                    disabled={item.quantity >= item.maxStock}
                    aria-label={`Aumentar cantidad de ${item.productName}`}
                    className="p-1 rounded-lg bg-card border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.productId, item.size)}
                  aria-label={`Eliminar ${item.productName}`}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Client & payment selection */}
          <div className="p-4 border-t border-border space-y-3">
            <div>
              <label htmlFor="cart-client" className="block text-sm font-medium text-foreground mb-1.5">
                Cliente (opcional)
              </label>
              <ClientSelect
                value={clientId}
                onChange={setClientId}
              />
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-foreground mb-1.5">Estado de Pago</legend>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('paid')}
                  aria-pressed={paymentStatus === 'paid'}
                  className={`flex-1 py-2 text-sm font-medium rounded-xl border-2 transition-colors cursor-pointer ${
                    paymentStatus === 'paid'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-muted-foreground hover:border-gray-300'
                  }`}
                >
                  Pagado
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('pending')}
                  aria-pressed={paymentStatus === 'pending'}
                  className={`flex-1 py-2 text-sm font-medium rounded-xl border-2 transition-colors cursor-pointer ${
                    paymentStatus === 'pending'
                      ? 'border-accent bg-accent/10 text-accent-hover'
                      : 'border-gray-200 text-muted-foreground hover:border-gray-300'
                  }`}
                >
                  Por Cobrar
                </button>
              </div>
            </fieldset>

            {paymentStatus === 'paid' && (
              <fieldset>
                <legend className="block text-sm font-medium text-foreground mb-1.5">
                  Método de pago
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      aria-pressed={paymentMethod === m.value}
                      className={`py-2 text-sm font-medium rounded-xl border-2 transition-colors cursor-pointer ${
                        paymentMethod === m.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 text-muted-foreground hover:border-gray-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          </div>
        </div>
      )}

      {/* Footer totals & finalize */}
      {items.length > 0 && (
        <div className="border-t border-border p-4 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>IVA (19%)</span>
              <span className="tabular-nums">{fmt(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-foreground border-t border-border pt-2">
              <span>Total</span>
              <span className="tabular-nums">{fmt(total)}</span>
            </div>
            {rate && rate > 0 && currency === 'VES' && (
              <p className="text-xs text-muted-foreground text-right tabular-nums">Tasa: 1 US$ = {formatVes(rate)}</p>
            )}
          </div>

          {vesOf(total) && currency === 'USD' && (
            <p className="text-xs text-muted-foreground text-right tabular-nums">
              Total en Bs: {vesOf(total)}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={clear}
              disabled={submitting}
              className="px-4 py-2.5 text-sm bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Vaciar
            </button>
            <button
              onClick={handleFinalize}
              disabled={submitting}
              className="flex-1 py-2.5 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-primary/20 cursor-pointer"
            >
              {submitting ? 'Registrando...' : 'Finalizar Venta'}
            </button>
          </div>
        </div>
      )}

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleScan}
      />

      <Modal
        isOpen={!!sizeProduct}
        onClose={() => setSizeProduct(null)}
        title={`Seleccionar talla - ${sizeProduct?.name ?? ''}`}
        size="md"
      >
        {sizeProduct && (
          <div className="space-y-2">
            {(sizeProduct.sizes ?? []).map((s) => {
              const stock = s.stock ?? 0
              const hasStock = stock > 0
              return (
                <button
                  key={s.size}
                  type="button"
                  onClick={() => {
                    addProductToCart(sizeProduct, s.size)
                    setSizeProduct(null)
                  }}
                  disabled={!hasStock}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    hasStock
                      ? 'border-gray-200 hover:border-violet-300 hover:bg-violet-50 cursor-pointer'
                      : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span className="font-medium text-gray-900">{s.size}</span>
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      stock === 0
                        ? 'bg-red-50 text-red-600'
                        : stock < 10
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    Stock: {stock}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </Modal>

      <FullScreenLoader loading={submitting} text="Registrando venta..." />
    </div>
  )
}
