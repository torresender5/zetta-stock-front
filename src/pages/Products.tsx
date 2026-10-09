import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Edit, Trash2, ShoppingCart, ShoppingBag, Package, ImageIcon, X, Ruler, Calendar, XCircle, ScanBarcode } from 'lucide-react'
import { useProductStore } from '../stores/productStore'
import { useCartStore } from '../stores/cartStore'
import { useRateStore } from '../stores/rateStore'
import { formatVes, parseMoney, generateProductCode } from '../lib/utils'
import { useCategoryStore } from '../stores/categoryStore'
import Modal from '../components/Modal'
import ActionDropdown from '../components/ActionDropdown'
import CartPanel from '../components/CartPanel'
import DataTable from '../components/DataTable'
import ProductImageInput from '../components/ProductImageInput'
import BarcodeScannerModal from '../components/BarcodeScannerModal'
import MoneyInput from '../components/MoneyInput'
import CurrencyToggle, { useDisplayCurrency } from '../components/CurrencyToggle'
import { productService } from '../services/productService'
import type { Column } from '../components/DataTable/types'
import type { Product, ProductSize } from '../types'

const emptyForm = {
  name: '',
  description: '',
  code: '',
  type: '',
  sku: '',
  barcode: '',
  category: '',
  categoryId: null as string | null,
  purchasePrice: '',
  salePrice: '',
  stock: 0,
  minStock: 0,
  image: '',
  sizes: [] as ProductSize[],
}

export default function Products() {
  const {
    products, meta, loading, error,
    page, limit, search, categoryFilter, startDateFilter, endDateFilter,
    fetchProducts, setPage, setLimit, setSearch, setCategoryFilter, setStartDateFilter, setEndDateFilter,
    addProduct, updateProduct, deleteProduct,
  } = useProductStore()
  const cartStore = useCartStore()
  const {
    categories, fetchCategories, addCategory, updateCategory, deleteCategory,
  } = useCategoryStore()
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [renameValues, setRenameValues] = useState<Record<string, string>>({})
  const { currency, setCurrency, fmt } = useDisplayCurrency()
  const rate = useRateStore((s) => s.rate)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [searchInput, setSearchInput] = useState(search)
  const [sizesModalProduct, setSizesModalProduct] = useState<Product | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [sizeSelectorProduct, setSizeSelectorProduct] = useState<Product | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [autoGenerateCode, setAutoGenerateCode] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  const vesOf = (usd: number) => (rate && rate > 0 ? formatVes(usd * rate) : null)

  const columns: Column<Product>[] = [
    {
      key: 'image',
      header: 'Imagen',
      hideBelow: 'sm',
      width: '4.5rem',
      render: (p) =>
        p.image ? (
          <img
            src={p.image}
            alt={p.name}
            className="w-10 h-10 rounded-lg object-cover border border-gray-100 cursor-pointer hover:ring-2 hover:ring-violet-400 transition-all"
            onClick={() => setSelectedImage(p.image!)}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-gray-300" />
          </div>
        ),
    },
    { key: 'name', header: 'Nombre', cellClassName: 'font-medium text-gray-900', truncate: true },
    { key: 'code', header: 'Código', hideBelow: 'lg', cellClassName: 'text-gray-500 font-mono text-xs' },
    { key: 'sku', header: 'SKU', hideBelow: 'lg', cellClassName: 'text-gray-500 font-mono text-xs' },
    {
      key: 'barcode',
      header: 'Cód. barras',
      hideBelow: 'xl',
      cellClassName: 'text-gray-500 font-mono text-xs',
      render: (p) => p.barcode || <span className="text-gray-300">—</span>,
    },
    { key: 'type', header: 'Tipo', hideBelow: 'xl', cellClassName: 'text-gray-500' },
    {
      key: 'category',
      header: 'Categoría',
      hideBelow: 'lg',
      render: (p) => (
        <span className="inline-flex px-2.5 py-1 bg-violet-50 text-violet-600 rounded-lg text-xs font-medium">
          {p.category}
        </span>
      ),
    },
    { key: 'purchasePrice', header: 'P. Compra', align: 'right', hideBelow: 'xl', render: (p) => fmt(p.purchasePrice) },
    { key: 'salePrice', header: 'P. Venta', align: 'right', hideBelow: 'sm', width: '7rem', render: (p) => fmt(p.salePrice) },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      width: '6rem',
      render: (p) => (
        <span
          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
            p.stock === 0 ? 'bg-red-50 text-red-600' : p.stock < 10 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
          }`}
        >
          {p.stock}
        </span>
      ),
    },
  ]

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (categories.length > 0 && !form.category) {
      setForm((f) => (f.category ? f : { ...f, category: categories[0].name, categoryId: categories[0].id }))
    }
  }, [categories])

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) setSearch(searchInput)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const cartItemCount = cartStore.items.reduce((sum, i) => sum + i.quantity, 0)

  const addToCart = (product: Product, size?: string) => {
    const sizeObj = size && product.sizes ? product.sizes.find((s) => s.size === size) : null
    const maxStock = sizeObj ? (sizeObj.stock ?? 0) : product.stock
    if (maxStock <= 0) return
    cartStore.addItem({
      productId: product.id,
      productName: product.name,
      size,
      unitPrice: product.salePrice,
      maxStock,
    })
  }

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setImageFile(null)
    setAutoGenerateCode(false)
    setIsModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setForm({
      name: product.name,
      description: product.description,
      code: product.code,
      type: product.type,
      sku: product.sku,
      barcode: product.barcode ?? '',
      category: product.category,
      categoryId: product.categoryId ?? null,
      purchasePrice: String(product.purchasePrice),
      salePrice: String(product.salePrice),
      stock: product.stock,
      minStock: product.minStock ?? 0,
      image: product.image ?? '',
      sizes: (product.sizes ?? []).map((s) => ({ size: s.size, stock: s.stock ?? 0 })),
    })
    setEditingId(product.id)
    setImageFile(null)
    setAutoGenerateCode(false)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    const payload = {
      ...form,
      barcode: form.barcode.trim(),
      image: form.image.trim() || null,
      purchasePrice: parseMoney(form.purchasePrice),
      salePrice: parseMoney(form.salePrice),
      sizes: form.sizes.filter((s) => s.size.trim()).length > 0
        ? form.sizes
            .filter((s) => s.size.trim())
            .map((s) => ({ size: s.size.trim(), stock: Number(s.stock) || 0 }))
        : null,
    }
    try {
      let result: Product
      if (editingId) {
        result = await updateProduct(editingId, payload)
      } else {
        result = await addProduct(payload)
      }
      if (imageFile) {
        await productService.uploadImage(result.id, imageFile)
      }
      setIsModalOpen(false)
      setImageFile(null)
      if (editingId) {
        await fetchProducts()
      } else {
        setPage(1)
      }
    } catch {
      // error se maneja en el store
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim()
    if (!name) return
    setCategoryError(null)
    const res = await addCategory(name)
    if (res.ok && res.category) {
      const created = res.category
      setForm((f) => ({ ...f, category: created.name, categoryId: created.id }))
      setShowNewCategory(false)
      setNewCategoryName('')
    } else {
      setCategoryError(res.error ?? 'Error al crear categoría')
    }
  }

  const openManageCategories = () => {
    setRenameValues(Object.fromEntries(categories.map((c) => [c.id, c.name])))
    setCategoryError(null)
    setIsManageOpen(true)
  }

  const handleRenameCategory = async (id: string) => {
    const old = categories.find((c) => c.id === id)
    const name = (renameValues[id] ?? '').trim()
    if (!old || !name || name === old.name) return
    setCategoryError(null)
    const res = await updateCategory(id, name)
    if (res.ok) {
      setForm((f) => (f.categoryId === id ? { ...f, category: name } : f))
    } else {
      setCategoryError(res.error ?? 'Error al actualizar categoría')
      setRenameValues((r) => ({ ...r, [id]: old.name }))
    }
  }

  const handleDeleteCategory = async (id: string) => {
    const cat = categories.find((c) => c.id === id)
    if (!cat) return
    if (!window.confirm(`¿Eliminar la categoría "${cat.name}"?`)) return
    setCategoryError(null)
    const res = await deleteCategory(id)
    if (res.ok) {
      setForm((f) => (f.categoryId === id ? { ...f, category: '', categoryId: null } : f))
    } else {
      setCategoryError(res.error ?? 'Error al eliminar categoría')
    }
  }

  const addSize = () => {
    const newSizes = [...form.sizes, { size: '', stock: 0 }]
    setForm({ ...form, sizes: newSizes, stock: newSizes.reduce((sum, s) => sum + (s.stock || 0), 0) })
  }

  const removeSize = (index: number) => {
    const newSizes = form.sizes.filter((_, i) => i !== index)
    setForm({ ...form, sizes: newSizes, stock: newSizes.reduce((sum, s) => sum + (s.stock || 0), 0) })
  }

  const updateSize = (index: number, field: keyof ProductSize, value: string | number) => {
    const newSizes = form.sizes.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    setForm({
      ...form,
      sizes: newSizes,
      stock: newSizes.reduce((sum, s) => sum + (s.stock || 0), 0),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500 mt-1">{meta.total} productos registrados</p>
        </div>
        <div className="flex items-center gap-3">
          <CurrencyToggle value={currency} onChange={setCurrency} />
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Carrito</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                {cartItemCount}
              </span>
            )}
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU, código o código de barras..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border-0 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm transition-all"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white border-0 rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm transition-all"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
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
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">{error}</div>
      )}

      <DataTable
        columns={columns}
        data={products}
        getRowKey={(p) => p.id}
        loading={loading}
        emptyIcon={<Package className="w-10 h-10 mx-auto mb-3 opacity-40" />}
        emptyMessage="No hay productos"
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
            {p.stock > 0 && (
              <button
                onClick={() => {
                  if (p.sizes && p.sizes.length > 0) {
                    setSizeSelectorProduct(p)
                  } else {
                    addToCart(p)
                  }
                }}
                title="Agregar al carrito"
                className="flex p-2 rounded-xl hover:bg-violet-50 text-violet-500 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
            <ActionDropdown
              actions={[
                {
                  label: 'Ver tallas',
                  icon: <Ruler className="w-4 h-4" />,
                  onClick: () => setSizesModalProduct(p),
                },
                {
                  label: 'Editar',
                  icon: <Edit className="w-4 h-4" />,
                  onClick: () => openEdit(p),
                },
                {
                  label: 'Eliminar',
                  icon: <Trash2 className="w-4 h-4" />,
                  onClick: () => deleteProduct(p.id),
                  className: 'text-red-600 hover:bg-red-50',
                },
              ]}
            />
          </div>
        )}
      />

      <Modal isOpen={isModalOpen} size='xl' onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Producto' : 'Nuevo Producto'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU *</label>
              <input
                required
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
              />
            </div>

          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Código *</label>
              <input
                required
                type="text"
                value={form.code}
                disabled={autoGenerateCode}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all ${autoGenerateCode ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoGenerateCode}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setAutoGenerateCode(checked)
                    if (checked) {
                      setForm({ ...form, code: generateProductCode() })
                    } else {
                      setForm({ ...form, code: '' })
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-gray-600">Autogenerar código</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo *</label>
              <input
                required
                type="text"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Código de barras</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="Escanear o digitar..."
                autoComplete="off"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-violet-600 border border-violet-200 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors shrink-0"
              >
                <ScanBarcode className="w-4 h-4" /> Escanear
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Imagen</label>
            <ProductImageInput
              value={editingId ? form.image : null}
              onChange={setImageFile}
              onClearImage={() => setForm({ ...form, image: '' })}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Categoría</label>
              <button
                type="button"
                onClick={openManageCategories}
                className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
              >
                Gestionar
              </button>
            </div>
            <select
              required
              value={form.category}
              onChange={(e) => {
                const name = e.target.value
                const cat = categories.find((c) => c.name === name)
                setForm({ ...form, category: name, categoryId: cat ? cat.id : null })
              }}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
            >
              {categories.length === 0 && <option value="">Cargando categorías...</option>}
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <div className="mt-2">
              {showNewCategory ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory() } }}
                    placeholder="Nombre de la nueva categoría"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim()}
                    className="px-3 py-1.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors text-xs font-medium disabled:opacity-50"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowNewCategory(false); setNewCategoryName(''); setCategoryError(null) }}
                    className="px-3 py-1.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-xs font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewCategory(true)}
                  className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Nueva categoría
                </button>
              )}
              {categoryError && !isManageOpen && (
                <p className="text-xs text-red-500 mt-1">{categoryError}</p>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Tallas</label>
              <button
                type="button"
                onClick={addSize}
                className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
              >
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
                    <button
                      type="button"
                      onClick={() => removeSize(i)}
                      className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio Compra</label>
              <MoneyInput
                value={form.purchasePrice}
                onChange={(v) => setForm({ ...form, purchasePrice: v })}
              />
              {vesOf(parseMoney(form.purchasePrice)) && (
                <p className="text-xs text-gray-400 mt-1 tabular-nums">= {vesOf(parseMoney(form.purchasePrice))}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio Venta</label>
              <MoneyInput
                value={form.salePrice}
                onChange={(v) => setForm({ ...form, salePrice: v })}
              />
              {vesOf(parseMoney(form.salePrice)) && (
                <p className="text-xs text-gray-400 mt-1 tabular-nums">= {vesOf(parseMoney(form.salePrice))}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Stock {form.sizes.length > 0 && <span className="text-xs text-gray-400 font-normal">(auto desde tallas)</span>}
              </label>
              <input
                type="number"
                min={0}
                value={form.stock}
                readOnly={form.sizes.length > 0}
                onChange={(e) => { if (form.sizes.length === 0) setForm({ ...form, stock: Number(e.target.value) }) }}
                className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all ${form.sizes.length > 0 ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Stock mínimo
              </label>
              <input
                type="number"
                min={0}
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">
                0 = sin alertas de stock bajo
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {submitting ? (editingId ? 'Guardando...' : 'Creando...') : (editingId ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isManageOpen} onClose={() => setIsManageOpen(false)} title="Gestionar categorías" size="md">
        {categoryError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{categoryError}</div>
        )}
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No hay categorías todavía.</p>
        ) : (
          <div className="space-y-2">
            {categories.map((c) => {
              const value = renameValues[c.id] ?? c.name
              const changed = value.trim() !== c.name && value.trim().length > 0
              return (
                <div key={c.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setRenameValues((r) => ({ ...r, [c.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRenameCategory(c.id) }}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
                  />
                  <span className="hidden sm:inline text-xs font-mono text-gray-400 shrink-0">{c.code}</span>
                  <button
                    type="button"
                    onClick={() => handleRenameCategory(c.id)}
                    disabled={!changed}
                    className="px-3 py-1.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    Renombrar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(c.id)}
                    className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    title="Eliminar categoría"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!sizesModalProduct}
        onClose={() => setSizesModalProduct(null)}
        title={`Tallas - ${sizesModalProduct?.name ?? ''}`}
        size="md"
      >
        {sizesModalProduct?.sizes && sizesModalProduct.sizes.length > 0 ? (
          <div className="space-y-3">
            {sizesModalProduct.sizes.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <span className="font-medium text-gray-900">{s.size}</span>
                <span
                  className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    (s.stock ?? 0) === 0
                      ? 'bg-red-50 text-red-600'
                      : (s.stock ?? 0) < 10
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  Stock: {s.stock ?? 0}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Este producto no tiene tallas configuradas.</p>
        )}
      </Modal>

      <Modal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        title="Vista previa de imagen"
        size="md"
      >
        {selectedImage ? (
          <img src={selectedImage} alt="Preview" className="w-full max-h-[70vh] object-contain rounded-xl" />
        ) : null}
      </Modal>

      <Modal
        isOpen={!!sizeSelectorProduct}
        onClose={() => setSizeSelectorProduct(null)}
        title={`Seleccionar talla - ${sizeSelectorProduct?.name ?? ''}`}
        size="md"
      >
        {sizeSelectorProduct?.sizes && sizeSelectorProduct.sizes.length > 0 ? (
          <div className="space-y-2">
            {sizeSelectorProduct.sizes.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  if (sizeSelectorProduct && s.stock && s.stock > 0) {
                    addToCart(sizeSelectorProduct, s.size)
                    setSizeSelectorProduct(null)
                  }
                }}
                disabled={!s.stock || s.stock <= 0}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  s.stock && s.stock > 0
                    ? 'border-gray-200 hover:border-violet-300 hover:bg-violet-50 cursor-pointer'
                    : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="font-medium text-gray-900">{s.size}</span>
                <span
                  className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    (s.stock ?? 0) === 0
                      ? 'bg-red-50 text-red-600'
                      : (s.stock ?? 0) < 10
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  Stock: {s.stock ?? 0}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Este producto no tiene tallas configuradas.</p>
        )}
      </Modal>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={(code) => {
          setForm((f) => ({ ...f, barcode: code }))
          setIsScannerOpen(false)
        }}
      />

      <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}
