import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, ChevronDown, Plus, Loader2 } from 'lucide-react'
import { useProductStore } from '../stores/productStore'
import { productService, type CreateProductDto } from '../services/productService'
import { CATEGORIES } from '../lib/utils'
import Modal from './Modal'
import type { Product, ProductSize } from '../types'

interface ProductSelectProps {
  value: string
  onChange: (productId: string) => void
  products: Product[]
  includeOutOfStock?: boolean
  allowCreate?: boolean
}

const stockClass = (stock: number) =>
  stock === 0
    ? 'bg-red-50 text-red-600'
    : stock < 10
      ? 'bg-amber-50 text-amber-600'
      : 'bg-emerald-50 text-emerald-600'

const DROPDOWN_HEIGHT = 240
const GAP = 8

const emptyForm = {
  name: '',
  code: '',
  type: '',
  sku: '',
  category: CATEGORIES[0],
  purchasePrice: 0,
  salePrice: 0,
  sizes: [] as ProductSize[],
}

export function ProductSelect({
  value,
  onChange,
  products,
  includeOutOfStock = false,
  allowCreate = false,
}: ProductSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const anchorRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const catalog = useMemo(
    () => (includeOutOfStock ? products : products.filter((p) => p.stock > 0)),
    [products, includeOutOfStock]
  )
  const selectedProduct = useMemo(() => products.find((p) => p.id === value) ?? null, [products, value])

  const trimmed = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!trimmed) return catalog
    return catalog.filter(
      (p) =>
        p.name.toLowerCase().includes(trimmed) ||
        p.code.toLowerCase().includes(trimmed) ||
        p.sku.toLowerCase().includes(trimmed)
    )
  }, [catalog, trimmed])

  const showCreate = allowCreate && trimmed.length > 0 && filtered.length === 0
  const totalOptions = filtered.length + (showCreate ? 1 : 0)
  const inputValue = open ? query : selectedProduct?.name ?? ''

  const updatePos = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect()
    if (!rect) return
    const spaceBelow = window.innerHeight - rect.bottom - GAP
    const top =
      spaceBelow >= DROPDOWN_HEIGHT || spaceBelow >= rect.top
        ? rect.bottom + GAP
        : Math.max(GAP, rect.top - DROPDOWN_HEIGHT - GAP)
    setPos({ top, left: rect.left, width: rect.width })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePos()
    const onMove = () => updatePos()
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (anchorRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
      setActiveIndex(-1)
    }
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [open, updatePos])

  const selectProduct = (p: Product) => {
    onChange(p.id)
    setQuery(p.name)
    setActiveIndex(-1)
    setOpen(false)
  }

  const openCreate = () => {
    setForm(emptyForm)
    setCreateError(null)
    setOpen(false)
    setActiveIndex(-1)
    setIsCreateOpen(true)
  }

  const addSize = () => {
    setForm({ ...form, sizes: [...form.sizes, { size: '', stock: 0 }] })
  }

  const removeSize = (index: number) => {
    setForm({ ...form, sizes: form.sizes.filter((_, i) => i !== index) })
  }

  const updateSize = (index: number, field: keyof ProductSize, value: string | number) => {
    const newSizes = form.sizes.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    setForm({ ...form, sizes: newSizes })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.sku.trim() || !form.code.trim() || !form.type.trim()) return
    setCreating(true)
    setCreateError(null)
    const sizes = form.sizes
      .filter((s) => s.size.trim())
      .map((s) => ({ size: s.size.trim(), stock: Number(s.stock) || 0 }))
    const payload: CreateProductDto = {
      name: form.name.trim(),
      description: '',
      code: form.code.trim(),
      type: form.type.trim(),
      sku: form.sku.trim(),
      category: form.category,
      purchasePrice: Number(form.purchasePrice) || 0,
      salePrice: Number(form.salePrice) || 0,
      stock: sizes.length ? sizes.reduce((sum, s) => sum + s.stock, 0) : 0,
      image: null,
      sizes: sizes.length ? sizes : null,
    }
    try {
      const created = await useProductStore.getState().addProduct(payload)
      await useProductStore.getState().fetchAllProducts()
      onChange(created.id)
      setQuery(created.name)
      setActiveIndex(-1)
      setIsCreateOpen(false)
      setForm(emptyForm)
    } catch {
      setCreateError('Error al crear producto')
    } finally {
      setCreating(false)
    }
  }

  const moveIndex = (direction: 1 | -1) => {
    if (!open) {
      setOpen(true)
      return
    }
    setActiveIndex((prev) => {
      if (totalOptions === 0) return -1
      if (prev === -1) return direction === 1 ? 0 : totalOptions - 1
      return (prev + direction + totalOptions) % totalOptions
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        moveIndex(1)
        break
      case 'ArrowUp':
        e.preventDefault()
        moveIndex(-1)
        break
      case 'Enter':
        if (open && activeIndex >= 0) {
          e.preventDefault()
          if (activeIndex < filtered.length) {
            selectProduct(filtered[activeIndex])
          } else if (showCreate) {
            openCreate()
          }
        }
        break
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  const clearSelection = () => {
    onChange('')
    setQuery('')
    setActiveIndex(-1)
    setOpen(true)
  }

  const dropdown =
    open && pos
      ? createPortal(
          <div
            ref={panelRef}
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            className="fixed z-[70] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-modal-in"
          >
            {filtered.length === 0 && !showCreate ? (
              <p className="px-4 py-3 text-sm text-gray-500">Sin productos disponibles</p>
            ) : (
              <>
                <div className="max-h-56 overflow-y-auto">
                  {filtered.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      role="option"
                      aria-selected={activeIndex === i}
                      onClick={() => selectProduct(p)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                        activeIndex === i ? 'bg-violet-50 text-violet-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium truncate">{p.name}</span>
                        <span className="block text-xs text-gray-400 font-mono truncate">
                          {p.code}
                          {p.sku ? ` · ${p.sku}` : ''}
                        </span>
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold shrink-0 ${stockClass(p.stock)}`}>
                        Stock: {p.stock}
                      </span>
                    </button>
                  ))}
                </div>
                {showCreate && (
                  <button
                    type="button"
                    onClick={openCreate}
                    onMouseEnter={() => setActiveIndex(filtered.length)}
                    className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-medium border-t border-gray-100 transition-colors cursor-pointer ${
                      activeIndex === filtered.length
                        ? 'bg-violet-50 text-violet-700'
                        : 'text-violet-600 hover:bg-violet-50'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Crear nuevo producto "{query.trim()}"
                  </button>
                )}
              </>
            )}
          </div>,
          document.body
        )
      : null

  return (
    <div ref={anchorRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-label="Buscar producto"
          value={inputValue}
          placeholder="Buscar producto..."
          onFocus={() => {
            setOpen(true)
            setQuery(selectedProduct?.name ?? '')
          }}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
        />
        {selectedProduct && !open ? (
          <button
            type="button"
            onClick={clearSelection}
            aria-label="Quitar selección"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        )}
      </div>
      {dropdown}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nuevo Producto" size="md">
        {createError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{createError}</div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
              <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU *</label>
              <input required type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Código *</label>
              <input required type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo *</label>
              <input required type="text" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none bg-white">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Tallas</label>
              <button type="button" onClick={addSize}
                className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Agregar talla
              </button>
            </div>
            {form.sizes.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">Sin tallas. Usa stock general.</p>
            ) : (
              <div className="space-y-2">
                {form.sizes.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Talla (S, M, L, 38...)"
                      value={s.size}
                      onChange={(e) => updateSize(i, 'size', e.target.value)}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Stock"
                      value={s.stock ?? 0}
                      onChange={(e) => updateSize(i, 'stock', Number(e.target.value))}
                      className="w-24 border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
                    />
                    <button type="button" onClick={() => removeSize(i)}
                      className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio Compra</label>
              <input type="number" min={0} value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio Venta</label>
              <input type="number" min={0} value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">Cancelar</button>
            <button type="submit" disabled={creating}
              className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50">
              {creating ? <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creando...</span> : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}