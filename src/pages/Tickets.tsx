import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LifeBuoy, Plus, Search, Eye } from 'lucide-react'
import { useTicketStore } from '../stores/ticketStore'
import Modal from '../components/Modal'
import DataTable from '../components/DataTable'
import { TicketForm } from '../components/TicketForm'
import { TicketStatusBadge } from '../components/TicketStatusBadge'
import type { Column } from '../components/DataTable/types'
import type { Ticket, TicketStatus } from '../types'
import { TICKET_CATEGORY_LABELS, TICKET_STATUS_LABELS } from '../types'
import { formatDate } from '../lib/utils'

const STATUS_FILTERS: Array<TicketStatus | ''> = [
  '',
  'abierto',
  'pendiente',
  'en_proceso',
  'finalizado',
]

function hasUnreadReply(ticket: Ticket): boolean {
  if (!ticket.lastMessageAt) return false
  if (!ticket.companyReadAt) return true
  return new Date(ticket.lastMessageAt).getTime() > new Date(ticket.companyReadAt).getTime()
}

const columns: Column<Ticket>[] = [
  {
    key: 'subject',
    header: 'Asunto',
    cellClassName: 'font-medium text-gray-900',
    render: (t) => (
      <div className="min-w-0 flex items-start gap-2">
        {hasUnreadReply(t) && (
          <span
            className="mt-1.5 w-2 h-2 rounded-full bg-violet-500 shrink-0"
            aria-label="Sin leer"
          />
        )}
        <div className="min-w-0">
          <p className="truncate">{t.subject}</p>
          {t.lastMessagePreview && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {t.lastMessagePreview}
            </p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: 'category',
    header: 'Tipo',
    hideBelow: 'md',
    cellClassName: 'text-gray-500',
    render: (t) => TICKET_CATEGORY_LABELS[t.category],
  },
  {
    key: 'status',
    header: 'Estado',
    render: (t) => <TicketStatusBadge status={t.status} />,
  },
  {
    key: 'messages',
    header: 'Mensajes',
    hideBelow: 'lg',
    align: 'right',
    cellClassName: 'text-gray-500 tabular-nums',
    render: (t) => t._count?.messages ?? 0,
  },
  {
    key: 'createdAt',
    header: 'Creado',
    hideBelow: 'sm',
    cellClassName: 'text-gray-500 text-xs',
    render: (t) => formatDate(t.createdAt),
  },
]

export default function Tickets() {
  const navigate = useNavigate()
  const {
    tickets, meta, loading, error,
    page, limit, search, statusFilter,
    fetchTicketsPage, setPage, setLimit, setSearch, setStatusFilter,
    createTicket,
  } = useTicketStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(search)

  useEffect(() => {
    fetchTicketsPage()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) setSearch(searchInput)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const handleSubmit = async (form: {
    subject: string
    category: Ticket['category']
    body: string
    image: File | null
  }) => {
    const created = await createTicket(
      { subject: form.subject, category: form.category, body: form.body },
      form.image,
    )
    setIsModalOpen(false)
    navigate(`/tickets/${created.id}`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets de soporte</h1>
          <p className="text-sm text-gray-500 mt-1">
            Solicita información, reporta fallas o envía el comprobante de tu pago
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nuevo Ticket
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por asunto o contenido..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border-0 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TicketStatus | '')}
          className="bg-white border-0 rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm transition-all"
        >
          <option value="">Todos los estados</option>
          {STATUS_FILTERS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {TICKET_STATUS_LABELS[s as TicketStatus]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={tickets}
        getRowKey={(t) => String(t.id)}
        loading={loading && tickets.length === 0}
        emptyIcon={<LifeBuoy className="w-10 h-10 mx-auto mb-3 opacity-40" />}
        emptyMessage={
          loading ? 'Cargando tickets...' : 'Aún no has abierto ningún ticket'
        }
        pagination={{
          page,
          limit,
          total: meta.total,
          totalPages: meta.totalPages,
          onPageChange: setPage,
          onLimitChange: setLimit,
        }}
        actions={(t) => (
          <div className="flex justify-end gap-1">
            <button
              onClick={() => navigate(`/tickets/${t.id}`)}
              className="p-2 rounded-xl hover:bg-violet-50 text-gray-500 hover:text-violet-600 transition-colors"
              aria-label={`Ver ticket ${t.subject}`}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Ticket"
      >
        <TicketForm
          onCancel={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  )
}
