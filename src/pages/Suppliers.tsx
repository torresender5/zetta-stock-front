import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Calendar, XCircle, Truck } from 'lucide-react'
import { useSupplierStore } from '../stores/supplierStore'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'
import type { Column } from '../components/DataTable/types'
import type { Supplier } from '../types'

const emptyForm = { name: '', document: '', email: '', phone: '', address: '' }

const columns: Column<Supplier>[] = [
  { key: 'name', header: 'Nombre', cellClassName: 'font-medium text-gray-900', truncate: true },
  { key: 'document', header: 'Documento', cellClassName: 'text-gray-500 font-mono text-xs' },
  { key: 'email', header: 'Email', hideBelow: 'md', cellClassName: 'text-gray-500', truncate: true },
  { key: 'phone', header: 'Teléfono', hideBelow: 'lg', cellClassName: 'text-gray-500' },
  { key: 'address', header: 'Dirección', hideBelow: 'xl', cellClassName: 'text-gray-500', truncate: true },
]

export default function Suppliers() {
  const {
    suppliers, meta, loading, error,
    page, limit, search, startDateFilter, endDateFilter,
    fetchSuppliers, setPage, setLimit, setSearch, setStartDateFilter, setEndDateFilter,
    addSupplier, updateSupplier, deleteSupplier,
  } = useSupplierStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [searchInput, setSearchInput] = useState(search)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) setSearch(searchInput)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setIsModalOpen(true) }

  const openEdit = (supplier: Supplier) => {
    setForm({ name: supplier.name, document: supplier.document, email: supplier.email, phone: supplier.phone, address: supplier.address })
    setEditingId(supplier.id)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) { await updateSupplier(editingId, form) } else { await addSupplier(form) }
      setIsModalOpen(false)
    } catch {
      // error se maneja en el store
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-sm text-gray-500 mt-1">{meta.total} proveedores registrados</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium">
          <Plus className="w-4 h-4" /> Nuevo Proveedor
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, documento, email o teléfono..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border-0 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm transition-all"
          />
        </div>
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
        data={suppliers}
        getRowKey={(s) => s.id}
        loading={loading && suppliers.length === 0}
        emptyIcon={<Truck className="w-10 h-10 mx-auto mb-3 opacity-40" />}
        emptyMessage={loading ? 'Cargando proveedores...' : 'No hay proveedores registrados'}
        pagination={{
          page,
          limit,
          total: meta.total,
          totalPages: meta.totalPages,
          onPageChange: setPage,
          onLimitChange: setLimit,
        }}
        actions={(s) => (
          <div className="flex justify-end gap-1">
            <button onClick={() => openEdit(s)} className="p-2 rounded-xl hover:bg-violet-50 text-gray-500 hover:text-violet-600 transition-colors" aria-label={`Editar ${s.name}`}>
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={() => deleteSupplier(s.id)} className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors" aria-label={`Eliminar ${s.name}`}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
              <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">NIT / Cédula *</label>
              <input required type="text" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">Cancelar</button>
            <button type="submit" className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium">{editingId ? 'Actualizar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}