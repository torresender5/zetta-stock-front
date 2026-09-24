import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Calendar, XCircle, Users } from 'lucide-react'
import { useClientStore } from '../stores/clientStore'
import Modal from '../components/Modal'
import { ClientForm } from '../components/ClientForm'
import DataTable from '../components/DataTable'
import type { Column } from '../components/DataTable/types'
import type { Client } from '../types'

const columns: Column<Client>[] = [
  { key: 'name', header: 'Nombre', cellClassName: 'font-medium text-gray-900', truncate: true },
  { key: 'document', header: 'Documento', cellClassName: 'text-gray-500 font-mono text-xs' },
  { key: 'email', header: 'Email', hideBelow: 'md', cellClassName: 'text-gray-500', truncate: true },
  { key: 'phone', header: 'Teléfono', hideBelow: 'lg', cellClassName: 'text-gray-500' },
  { key: 'address', header: 'Dirección', hideBelow: 'xl', cellClassName: 'text-gray-500', truncate: true },
]

export default function Clients() {
  const {
    clients, meta, loading, error,
    page, limit, search, startDateFilter, endDateFilter,
    fetchClientsPage, setPage, setLimit, setSearch, setStartDateFilter, setEndDateFilter,
    addClient, updateClient, deleteClient,
  } = useClientStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchInput, setSearchInput] = useState(search)

  useEffect(() => {
    fetchClientsPage()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) setSearch(searchInput)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const openCreate = () => { setEditingClient(null); setIsModalOpen(true) }

  const openEdit = (client: Client) => {
    setEditingClient(client)
    setIsModalOpen(true)
  }

  const handleSubmit = async (form: { name: string; document: string; email: string; phone: string; address: string }) => {
    try {
      if (editingClient) { await updateClient(editingClient.id, form) } else { await addClient(form) }
      setIsModalOpen(false)
    } catch {
      // error se maneja en el store
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">{meta.total} clientes registrados</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium">
          <Plus className="w-4 h-4" /> Nuevo Cliente
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
        data={clients}
        getRowKey={(c) => c.id}
        loading={loading && clients.length === 0}
        emptyIcon={<Users className="w-10 h-10 mx-auto mb-3 opacity-40" />}
        emptyMessage={loading ? 'Cargando clientes...' : 'No hay clientes'}
        pagination={{
          page,
          limit,
          total: meta.total,
          totalPages: meta.totalPages,
          onPageChange: setPage,
          onLimitChange: setLimit,
        }}
        actions={(c) => (
          <div className="flex justify-end gap-1">
            <button onClick={() => openEdit(c)} className="p-2 rounded-xl hover:bg-violet-50 text-gray-500 hover:text-violet-600 transition-colors" aria-label={`Editar ${c.name}`}>
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={() => deleteClient(c.id)} className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors" aria-label={`Eliminar ${c.name}`}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}>
        <ClientForm
          initial={editingClient ?? undefined}
          submitLabel={editingClient ? 'Actualizar' : 'Crear'}
          onCancel={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  )
}