import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Inbox,
  MailOpen,
} from 'lucide-react'
import { useNotificationStore } from '../stores/notificationStore'
import {
  TYPE_ICONS,
  TYPE_LABELS,
  notificationRoute,
  type NotificationScope,
} from '../lib/notifications'
import { timeAgo } from '../lib/utils'
import type { AppNotification } from '../types'

const TABS: Array<{ id: NotificationScope; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'general', label: 'Generales' },
]

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function scopeBadge(notification: AppNotification): { label: string; className: string } {
  if (notification.type === 'ticket_reply') {
    return { label: 'Ticket', className: 'bg-violet-100 text-violet-700' }
  }
  if (notification.type === 'announcement') {
    return { label: 'Anuncio', className: 'bg-amber-100 text-amber-700' }
  }
  return { label: 'General', className: 'bg-gray-100 text-gray-600' }
}

export default function Notifications() {
  const [searchParams] = useSearchParams()
  const {
    list,
    listMeta,
    listUnread,
    listLoading,
    error,
    filters,
    page,
    selected,
    fetchList,
    setScope,
    setUnreadOnly,
    setPage,
    select,
    markRead,
    markAllRead,
  } = useNotificationStore()
  const initialized = useRef(false)

  useEffect(() => {
    const tab = searchParams.get('tab')
    const scope = tab === 'tickets' || tab === 'general' ? tab : null
    if (!initialized.current) {
      initialized.current = true
      if (scope) {
        useNotificationStore.setState((state) => ({
          filters: { ...state.filters, scope },
          page: 1,
        }))
      }
      void fetchList()
      return
    }
    if (scope && useNotificationStore.getState().filters.scope !== scope) {
      useNotificationStore.setState((state) => ({
        filters: { ...state.filters, scope },
        page: 1,
      }))
      void fetchList()
    }
  }, [searchParams, fetchList])

  useEffect(() => {
    if (!selected && list.length > 0) select(list[0])
  }, [selected, list, select])

  const selectedRoute = selected ? notificationRoute(selected) : null
  const SelectedIcon = selected ? (TYPE_ICONS[selected.type] ?? Bell) : Bell

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Todo lo que ha pasado en tu empresa: tickets, avisos y novedades
          </p>
        </div>
        {listUnread > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" /> Marcar todas
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Alcance de notificaciones">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filters.scope === id}
              onClick={() => setScope(id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                filters.scope === id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-pressed={filters.unreadOnly}
          onClick={() => setUnreadOnly(!filters.unreadOnly)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors cursor-pointer ${
            filters.unreadOnly
              ? 'bg-violet-600 border-violet-600 text-white'
              : 'bg-card border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <MailOpen className="w-4 h-4" /> Solo no leídas
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,26rem)_1fr] gap-5 items-start">
        {/* Lista */}
        <aside className="no-print lg:sticky lg:top-0 lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto pr-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs font-medium text-gray-500 tabular-nums">
                {listMeta.total} en total
                {listUnread > 0 && (
                  <span className="ml-2 text-violet-600">{listUnread} sin leer</span>
                )}
              </span>
              {listLoading && <span className="text-xs text-gray-400">Cargando…</span>}
            </div>

            {list.length === 0 && !listLoading ? (
              <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
                <Inbox className="w-9 h-9" aria-hidden="true" />
                <p className="text-sm px-4 text-center">
                  {error ?? 'No hay notificaciones con los filtros aplicados.'}
                </p>
              </div>
            ) : (
              list.map((notification) => {
                const Icon = TYPE_ICONS[notification.type] ?? Bell
                const isUnread = !notification.readAt
                const isSelected = selected?.id === notification.id
                const badge = scopeBadge(notification)
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => select(notification)}
                    className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-violet-50/70 ring-2 ring-inset ring-violet-500/20'
                        : isUnread
                          ? 'bg-violet-50/40 hover:bg-violet-50/70'
                          : 'bg-white hover:bg-gray-50/70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                          isUnread ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span
                            className={`text-sm truncate ${
                              isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                            }`}
                          >
                            {notification.title}
                          </span>
                          {isUnread && (
                            <span
                              className="shrink-0 w-2 h-2 rounded-full bg-violet-600"
                              aria-label="Sin leer"
                            />
                          )}
                        </span>
                        {notification.body && (
                          <span className="block text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {notification.body}
                          </span>
                        )}
                        <span className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-gray-400">
                            {timeAgo(notification.createdAt)}
                          </span>
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </span>
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {listMeta.totalPages > 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-2 text-sm rounded-xl border border-gray-100 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <span className="text-xs text-gray-500 tabular-nums">
                Página {page} de {listMeta.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                disabled={page >= listMeta.totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm rounded-xl border border-gray-100 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </aside>

        {/* Preview */}
        <section>
          {selected ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-start gap-3">
                <span className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <SelectedIcon className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-gray-900">{selected.title}</h2>
                    {!selected.readAt && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                        No leída
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
                    <span
                      className={`font-medium px-1.5 py-0.5 rounded-full ${scopeBadge(selected).className}`}
                    >
                      {TYPE_LABELS[selected.type]}
                    </span>
                    <span>{formatDateTime(selected.createdAt)}</span>
                    {selected.targetLabel && <span>· Para: {selected.targetLabel}</span>}
                  </div>
                </div>
              </div>

              <div className="p-5">
                {selected.body ? (
                  <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                    {selected.body}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">Sin contenido adicional.</p>
                )}
              </div>

              <div className="px-5 py-4 bg-gray-50/70 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                {!selected.readAt ? (
                  <button
                    type="button"
                    onClick={() => void markRead(selected.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" /> Marcar leída
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                    <MailOpen className="w-4 h-4" /> Leída
                  </span>
                )}

                {selectedRoute && (
                  <Link
                    to={selectedRoute}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Ir a… <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 flex flex-col items-center justify-center py-24 text-center">
              <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-violet-500/20 mb-4">
                <Bell className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                Selecciona una notificación
              </p>
              <p className="text-xs text-gray-400 mt-1 px-6">
                Elige un elemento de la lista para ver su contenido completo
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
