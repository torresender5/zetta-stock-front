import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Image as ImageIcon,
  LifeBuoy,
  Lock,
  RotateCcw,
  Send,
} from 'lucide-react'
import { ticketService } from '../services/ticketService'
import { TicketStatusBadge } from '../components/TicketStatusBadge'
import type { Ticket, TicketMessage } from '../types'
import { TICKET_CATEGORY_LABELS } from '../types'
import { formatDate } from '../lib/utils'

function MessageBubble({ message }: { message: TicketMessage }) {
  const isSupport = message.authorKind === 'soporte'
  return (
    <div className={`flex ${isSupport ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
          isSupport
            ? 'bg-violet-50 border border-violet-100'
            : 'bg-white border border-border shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-900">
            {message.authorName}
          </span>
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded-md ${
              isSupport
                ? 'bg-violet-100 text-violet-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {isSupport ? 'Soporte' : 'Tú'}
          </span>
          <span className="text-[11px] text-gray-400">
            {formatDate(message.createdAt)}
          </span>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
          {message.body}
        </p>
      </div>
    </div>
  )
}

export default function TicketDetails() {
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const fetchTicket = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await ticketService.getById(id)
      setTicket(data)
      setError(null)
    } catch {
      setError('No se pudo cargar el ticket')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchTicket()
  }, [fetchTicket])

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || sending || !reply.trim()) return
    setSending(true)
    setError(null)
    try {
      const updated = await ticketService.addMessage(id, reply.trim())
      setTicket(updated)
      setReply('')
      setNotice(null)
    } catch {
      setError('No se pudo enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  const handleStatus = async (status: 'finalizado' | 'abierto') => {
    if (!id || sending) return
    setSending(true)
    setError(null)
    try {
      const updated = await ticketService.updateStatus(id, status)
      setTicket(updated)
      setNotice(
        status === 'finalizado'
          ? 'Ticket cerrado. Puedes reabrirlo si necesitas continuar la conversación.'
          : 'Ticket reabierto.',
      )
    } catch {
      setError('No se pudo cambiar el estado del ticket')
    } finally {
      setSending(false)
    }
  }

  if (loading && !ticket) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 text-sm">
        Cargando ticket...
      </div>
    )
  }

  if (error && !ticket) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <LifeBuoy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600">{error}</p>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-violet-600 hover:text-violet-700"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a tickets
        </Link>
      </div>
    )
  }

  if (!ticket) return null

  const isClosed = ticket.status === 'finalizado'
  const messages = ticket.messages ?? []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/tickets"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a tickets
      </Link>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
              <TicketStatusBadge status={ticket.status} />
            </div>
            <p className="text-sm text-gray-500 mt-1.5">
              {TICKET_CATEGORY_LABELS[ticket.category]} · Creado el{' '}
              {formatDate(ticket.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isClosed ? (
              <button
                onClick={() => handleStatus('finalizado')}
                disabled={sending}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-border rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Lock className="w-4 h-4" /> Cerrar ticket
              </button>
            ) : (
              <button
                onClick={() => handleStatus('abierto')}
                disabled={sending}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-100 rounded-xl hover:bg-violet-100 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" /> Reabrir
              </button>
            )}
          </div>
        </div>

        {ticket.image && (
          <a
            href={ticket.image}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-sm text-violet-600 hover:text-violet-700"
          >
            <ImageIcon className="w-4 h-4" /> Ver captura adjunta
          </a>
        )}
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-sm">
          {notice}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Conversación</h2>
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">Sin mensajes todavía</p>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
        )}

        <form onSubmit={handleReply} className="pt-3 border-t border-gray-100">
          <textarea
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={
              isClosed
                ? 'Reabre el ticket para continuar la conversación'
                : 'Escribe tu respuesta...'
            }
            disabled={isClosed || sending}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none disabled:bg-gray-50 disabled:text-gray-400"
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={isClosed || sending || !reply.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Enviando...' : 'Responder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
