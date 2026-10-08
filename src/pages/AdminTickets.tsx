import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
  Loader2,
  Search,
  Send,
} from 'lucide-react'
import { adminService } from '../services/adminService'
import Modal from '../components/Modal'
import { TicketStatusBadge } from '../components/TicketStatusBadge'
import type { AdminCompany, AdminTicket, TicketStatus } from '../types'
import {
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_LABELS,
} from '../types'
import { formatDate } from '../lib/utils'

const STATUS_FILTERS: Array<TicketStatus | ''> = [
  '',
  'abierto',
  'pendiente',
  'en_proceso',
  'finalizado',
]

const SUPPORT_STATUSES: TicketStatus[] = ['pendiente', 'en_proceso', 'finalizado']

export default function AdminTickets() {
  const [tickets, setTickets] = useState<AdminTicket[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 })
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [page, setPage] = useState(1)

  const [detail, setDetail] = useState<AdminTicket | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: { page: number; limit: number; search?: string; status?: TicketStatus; companyId?: number } = { page, limit: 10 }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      if (companyFilter) params.companyId = Number(companyFilter)
      const res = await adminService.getTickets(params)
      setTickets(res.data)
      setMeta(res.meta)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [page, statusFilter, companyFilter])

  useEffect(() => {
    adminService
      .getCompanies()
      .then(setCompanies)
      .catch(() => setCompanies([]))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      if (page !== 1) setPage(1)
      else void load()
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const openDetail = async (id: number) => {
    setDetailLoading(true)
    setDetail(null)
    setReply('')
    setError(null)
    try {
      setDetail(await adminService.getTicketById(String(id)))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el ticket')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!detail || sending || !reply.trim()) return
    setSending(true)
    setError(null)
    try {
      const updated = await adminService.replyTicket(String(detail.id), reply.trim())
      setDetail(updated)
      setReply('')
      setNotice(null)
      await load()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al responder el ticket')
    } finally {
      setSending(false)
    }
  }

  const handleStatus = async (status: TicketStatus) => {
    if (!detail || sending) return
    setSending(true)
    setError(null)
    try {
      const updated = await adminService.updateTicketStatus(String(detail.id), status)
      setDetail(updated)
      setNotice(`Ticket marcado como "${TICKET_STATUS_LABELS[status]}"`)
      await load()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar el estado')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <LifeBuoy className="w-5 h-5 text-violet-600" /> Tickets de soporte
        </h1>
        <p className="text-sm text-muted-foreground">
          Mensajes y solicitudes de cada empresa, con su traza completa hasta el cierre.
        </p>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-sm font-medium">
          {notice}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por asunto, empresa o contenido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          />
        </div>
        <select
          value={companyFilter}
          onChange={(e) => {
            setPage(1)
            setCompanyFilter(e.target.value)
          }}
          className="rounded-2xl border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
        >
          <option value="">Todas las empresas</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1)
            setStatusFilter(e.target.value as TicketStatus | '')
          }}
          className="rounded-2xl border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
        >
          <option value="">Todos los estados</option>
          {STATUS_FILTERS.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {TICKET_STATUS_LABELS[s as TicketStatus]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-10 text-center">
          <LifeBuoy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No hay tickets</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="px-6 py-3.5 font-medium">Empresa</th>
                  <th className="px-6 py-3.5 font-medium">Ticket</th>
                  <th className="px-6 py-3.5 font-medium">Tipo</th>
                  <th className="px-6 py-3.5 font-medium">Estado</th>
                  <th className="px-6 py-3.5 font-medium">Mensajes</th>
                  <th className="px-6 py-3.5 font-medium">Creado</th>
                  <th className="px-6 py-3.5 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-border/60 last:border-0">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">
                        {ticket.company?.name ?? '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-medium text-foreground truncate">{ticket.subject}</p>
                      {ticket.lastMessagePreview && (
                        <p className="text-xs text-muted-foreground truncate">
                          {ticket.lastMessagePreview}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {TICKET_CATEGORY_LABELS[ticket.category]}
                    </td>
                    <td className="px-6 py-4">
                      <TicketStatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-4 text-muted-foreground tabular-nums">
                      {ticket._count?.messages ?? 0}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => void openDetail(ticket.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                          Ver / Responder
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {meta.page} de {meta.totalPages} · {meta.total} tickets
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={detail !== null || detailLoading}
        onClose={() => setDetail(null)}
        title={detail ? detail.subject : 'Cargando…'}
        size="xl"
      >
        {detailLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : detail ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <TicketStatusBadge status={detail.status} />
              <span className="text-muted-foreground">
                {detail.company?.name} · {TICKET_CATEGORY_LABELS[detail.category]} ·{' '}
                {formatDate(detail.createdAt)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {SUPPORT_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => void handleStatus(s)}
                  disabled={sending || detail.status === s}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    detail.status === s
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {TICKET_STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {detail.image && (
              <a
                href={detail.image}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm text-violet-600 hover:text-violet-700"
              >
                Ver captura adjunta
              </a>
            )}

            <div className="space-y-3 max-h-80 overflow-y-auto p-3 bg-gray-50 rounded-2xl">
              {(detail.messages ?? []).map((m) => {
                const isSupport = m.authorKind === 'soporte'
                return (
                  <div
                    key={m.id}
                    className={`rounded-xl px-4 py-3 ${
                      isSupport
                        ? 'bg-violet-100 border border-violet-200 mr-6'
                        : 'bg-white border border-border ml-6'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground">
                        {m.authorName}
                      </span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-gray-200 text-gray-600">
                        {isSupport ? 'Soporte' : 'Empresa'}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(m.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {m.body}
                    </p>
                  </div>
                )
              })}
            </div>

            <form onSubmit={handleReply} className="space-y-3">
              <textarea
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Responder a la empresa..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Enviando...' : 'Responder'}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
