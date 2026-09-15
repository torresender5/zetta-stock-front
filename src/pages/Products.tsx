import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, ShoppingCart, ShoppingBag, Package, ImageIcon, X, Ruler, Calendar, XCircle, Upload } from 'lucide-react'
import { useProductStore } from '../stores/productStore'
import { useCartStore } from '../stores/cartStore'
import { formatCurrency, CATEGORIES } from '../lib/utils'
import Modal from '../components/Modal'
import ActionDropdown from '../components/ActionDropdown'
import CartPanel from '../components/CartPanel'
import DataTable from '../components/DataTable'
import { productService } from '../services/productService'
import type { Column } from '../components/DataTable/types'
import type { Product, ProductSize } from '../types'

const emptyForm = {
  name: '',
  description: '',
  code: '',
  type: '',
  sku: '',
  category: CATEGORIES[0],
  purchasePrice: 0,
  salePrice: 0,
  stock: 0,
  image: '',
  sizes: [] as ProductSize[],
}

const columns: Column<Product>[] = [
  {
    key: 'image',
    header: 'Imagen',
    render: (p) =>
      p.image ? (
        <img
          src={p.image}
          alt={p.name}
          className="w-10 h-10 rounded-lg object-cover border border-gray-100"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
          <ImageIcon className="w-4 h-4 text-gray-300" />
        </div>
      ),
  },
  { key: 'name', header: 'Nombre', cellClassName: 'font-medium text-gray-900' },
  { key: 'code', header: 'Código', hideBelow: 'lg', cellClassName: 'text-gray-500 font-mono text-xs' },
  { key: 'sku', header: 'SKU', hideBelow: 'lg', cellClassName: 'text-gray-500 font-mono text-xs' },
  { key: 'type', header: 'Tipo', hideBelow: 'xl', cellClassName: 'text-gray-500' },
  {
    key: 'category',
    header: 'Categoría',
    hideBelow: 'md',
    render: (p) => (
      <span className="inline-flex px-2.5 py-1 bg-violet-50 text-violet-600 rounded-lg text-xs font-medium">
        {p.category}
      </span>
    ),
  },
  { key: 'purchasePrice', header: 'P. Compra', align: 'right', hideBelow: 'xl', render: (p) => formatCurrency(p.purchasePrice) },
  { key: 'salePrice', header: 'P. Venta', align: 'right', render: (p) => formatCurrency(p.salePrice) },
  {
    key: 'stock',
    header: 'Stock',
    align: 'right',
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

export default function Products() {
  const {
    products, meta, loading, error,
    page, limit, search, categoryFilter, startDateFilter, endDateFilter,
    fetchProducts, setPage, setLimit, setSearch, setCategoryFilter, setStartDateFilter, setEndDateFilter,
    addProduct, updateProduct, deleteProduct,
  } = useProductStore()
  const cartStore = useCartStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [searchInput, setSearchInput] = useState(search)
  const [sizesModalProduct, setSizesModalProduct] = useState<Product | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [sizeSelectorProduct, setSizeSelectorProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

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
    setImagePreview(null)
    setIsModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setForm({
      name: product.name,
      description: product.description,
      code: product.code,
      type: product.type,
      sku: product.sku,
      category: product.category,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      stock: product.stock,
      image: product.image ?? '',
      sizes: (product.sizes ?? []).map((s) => ({ size: s.size, stock: s.stock ?? 0 })),
    })
    setEditingId(product.id)
    setImageFile(null)
    setImagePreview(product.image ?? null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      image: form.image.trim() || null,
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
      setImagePreview(null)
    } catch {
      // error se maneja en el store
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
            placeholder="Buscar por nombre, SKU o código..."
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
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
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
                className="p-2 rounded-xl hover:bg-violet-50 text-violet-500 transition-colors"
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
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
              />
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
            <div
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation() }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const file = e.dataTransfer.files?.[0]
                if (file && file.type.startsWith('image/')) {
                  setImageFile(file)
                  setImagePreview(URL.createObjectURL(file))
                }
              }}
              className={`relative flex flex-col items-center justify-center w-full min-h-[180px] rounded-2xl border-2 border-dashed transition-all cursor-pointer
                ${imagePreview
                  ? 'border-violet-300 bg-violet-50/30'
                  : 'border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50/30'
                }`}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-40 rounded-xl object-contain"
                  />
                  <div className="flex items-center gap-3 mt-3">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-100 rounded-lg hover:bg-violet-200 transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      Cambiar
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setImageFile(file)
                            setImagePreview(URL.createObjectURL(file))
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(editingId ? form.image : null)
                        setForm({ ...form, image: '' })
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center gap-2 w-full h-full p-6 cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-violet-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">Arrastra una imagen aquí</p>
                    <p className="text-xs text-gray-400 mt-0.5">o haz clic para seleccionar</p>
                  </div>
                  <p className="text-xs text-gray-400">JPG, PNG, WebP o GIF. Max 5MB.</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setImageFile(file)
                        setImagePreview(URL.createObjectURL(file))
                      }
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoría</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
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
              <input
                type="number"
                min={0}
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio Venta</label>
              <input
                type="number"
                min={0}
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all"
              />
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
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25"
            >
              {editingId ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
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

      <CartPanel isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}
