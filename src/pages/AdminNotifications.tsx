import { useEffect, useMemo, useState } from 'react'
import {
  BellRing,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Send,
  Users,
  X,
} from 'lucide-react'
import { adminService } from '../services/adminService'
import { ROLES } from '../lib/permissions'
import type {
  AdminAnnouncement,
  AdminCompany,
  AdminUser,
  AnnouncementRole,
  AnnouncementTargetKind,
  AnnouncementTargets,
} from '../types'
import { formatDate } from '../lib/utils'

const TARGET_OPTIONS: Array<{
  kind: AnnouncementTargetKind
  label: string
  hint: string
  icon: typeof Users
}> = [
  {
    kind: 'all_users',
    label: 'Todos los usuarios',
    hint: 'Todos los usuarios activos de todas las empresas',
    icon: Users,
  },
  {
    kind: 'role',
    label: 'Por rol',
    hint: 'Usuarios activos con un rol específico',
    icon: Users,
  },
  {
    kind: 'all_companies',
    label: 'Todas las empresas',
    hint: 'Una copia por cada empresa activa',
    icon: Building2,
  },
  {
    kind: 'company',
    label: 'Empresas',
    hint: 'Seleccionar empresas concretas',
    icon: Building2,
  },
  {
    kind: 'user',
    label: 'Usuarios',
    hint: 'Seleccionar usuarios concretos',
    icon: Users,
  },
]

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  vendedor: 'bg-blue-100 text-blue-700',
  inventario: 'bg-amber-100 text-amber-700',
}

interface IdPickerProps {
  items: Array<{ id: number; label: string; sublabel?: string; badge?: string }>
  selectedIds: number[]
  onToggle: (id: number) => void
  onClear: () => void
  placeholder: string
}

function IdPicker({ items, selectedIds, onToggle, onClear, placeholder }: IdPickerProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.sublabel ?? '').toLowerCase().includes(q)
    )
  }, [items, query])

  const selected = useMemo(() => {
    const map = new Map(items.map((i) => [i.id, i]))
    return selectedIds.map((id) => map.get(id)).filter(Boolean) as typeof items
  }, [items, selectedIds])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white hover:border-violet-300 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2 text-muted-foreground truncate">
          <Search className="w-4 h-4 shrink-0" />
          {selectedIds.length > 0
            ? `${selectedIds.length} seleccionado${selectedIds.length === 1 ? '' : 's'}`
            : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-muted-foreground">Sin resultados</p>
            ) : (
              filtered.map((item) => {
                const checked = selectedIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggle(item.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-violet-50 transition-colors cursor-pointer"
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        checked
                          ? 'bg-violet-600 border-violet-600'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium text-foreground truncate">
                        {item.label}
                      </span>
                      {item.sublabel && (
                        <span className="block text-xs text-muted-foreground truncate">
                          {item.sublabel}
                        </span>
                      )}
                    </span>
                    {item.badge && (
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ${
                          ROLE_BADGE[item.badge] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {ROLES[item.badge as AnnouncementRole]?.label ?? item.badge}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200 rounded-lg pl-2.5 pr-1 py-1"
            >
              {item.label}
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className="p-0.5 rounded hover:bg-violet-200 transition-colors cursor-pointer"
                aria-label={`Quitar ${item.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-muted-foreground hover:text-foreground underline px-1 cursor-pointer"
          >
            Limpiar
          </button>
        </div>
      )}
    </div>
  )
}

export default function AdminNotifications() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetKind, setTargetKind] = useState<AnnouncementTargetKind>('all_users')
  const [role, setRole] = useState<AnnouncementRole>('admin')
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [sending, setSending] = useState(false)

  const [sent, setSent] = useState<AdminAnnouncement[]>([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 })
  const [page, setPage] = useState(1)
  const [listLoading, setListLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const activeCompanies = useMemo(() => companies.filter((c) => c.active), [companies])
  const activeUsers = useMemo(() => users.filter((u) => u.active), [users])

  useEffect(() => {
    adminService
      .getCompanies()
      .then(setCompanies)
      .catch(() => setCompanies([]))
    adminService
      .getUsers()
      .then(setUsers)
      .catch(() => setUsers([]))
  }, [])

  const loadSent = async () => {
    setListLoading(true)
    setError(null)
    try {
      const res = await adminService.getNotifications({ page, limit: 10 })
      setSent(res.data)
      setMeta(res.meta)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar las notificaciones enviadas')
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    void loadSent()
  }, [page])

  const recipientCount = useMemo(() => {
    switch (targetKind) {
      case 'all_users':
        return activeUsers.length
      case 'all_companies':
        return activeCompanies.length
      case 'role':
        return activeUsers.filter((u) => u.role === role).length
      case 'company':
        return selectedCompanyIds.length
      case 'user':
        return selectedUserIds.length
    }
  }, [targetKind, activeUsers, activeCompanies, role, selectedCompanyIds, selectedUserIds])

  const canSubmit =
    title.trim().length > 0 &&
    recipientCount > 0 &&
    (targetKind !== 'company' || selectedCompanyIds.length > 0) &&
    (targetKind !== 'user' || selectedUserIds.length > 0) &&
    (targetKind !== 'role' || !!role)

  const toggleId = (setter: React.Dispatch<React.SetStateAction<number[]>>) => (id: number) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || sending) return
    setSending(true)
    setError(null)
    setNotice(null)
    try {
      const targets: AnnouncementTargets =
        targetKind === 'user'
          ? { kind: 'user', userIds: selectedUserIds }
          : targetKind === 'company'
            ? { kind: 'company', companyIds: selectedCompanyIds }
            : targetKind === 'role'
              ? { kind: 'role', role }
              : { kind: targetKind }
      const result = await adminService.createNotification({
        title: title.trim(),
        body: body.trim() ? body.trim() : undefined,
        targets,
      })
      setNotice(`Notificación enviada a ${result.count} destinatario${result.count === 1 ? '' : 's'} (${result.targetLabel})`)
      setTitle('')
      setBody('')
      setSelectedCompanyIds([])
      setSelectedUserIds([])
      setPage(1)
      await loadSent()
    } catch (err: any) {
      const msg = err.response?.data?.message
      setError(typeof msg === 'string' ? msg : 'Error al enviar la notificación')
    } finally {
      setSending(false)
    }
  }

  const companyPickerItems = useMemo(
    () =>
      activeCompanies.map((c) => ({
        id: c.id,
        label: c.name,
        sublabel: c.document ?? undefined,
      })),
    [activeCompanies]
  )

  const userPickerItems = useMemo(
    () =>
      activeUsers.map((u) => ({
        id: u.id,
        label: u.name,
        sublabel: u.companyName
          ? `${u.email} · ${u.companyName}`
          : u.email,
        badge: u.role,
      })),
    [activeUsers]
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BellRing className="w-5 h-5 text-violet-600" /> Notificaciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Crea anuncios para usuarios y empresas, y consulta el historial de envíos.
        </p>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-sm font-medium flex items-center gap-2">
          <Check className="w-4 h-4" /> {notice}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5"
      >
        <h2 className="text-base font-bold text-foreground">Nueva notificación</h2>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="Ej: Mantenimiento programado este sábado"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Cuerpo</label>
          <textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            placeholder="Mensaje de la notificación (opcional)..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Alcance</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {TARGET_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const active = targetKind === opt.kind
              return (
                <button
                  key={opt.kind}
                  type="button"
                  onClick={() => setTargetKind(opt.kind)}
                  className={`flex items-start gap-2.5 rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                    active
                      ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-500/20'
                      : 'border-gray-200 bg-white hover:border-violet-300'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-violet-600' : 'text-gray-400'}`}
                  />
                  <span>
                    <span className={`block text-sm font-semibold ${active ? 'text-violet-700' : 'text-foreground'}`}>
                      {opt.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {targetKind === 'role' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AnnouncementRole)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {(Object.keys(ROLES) as AnnouncementRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLES[r].label}
                </option>
              ))}
            </select>
          </div>
        )}

        {targetKind === 'company' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Empresas</label>
            <IdPicker
              items={companyPickerItems}
              selectedIds={selectedCompanyIds}
              onToggle={toggleId(setSelectedCompanyIds)}
              onClear={() => setSelectedCompanyIds([])}
              placeholder="Buscar y seleccionar empresas..."
            />
          </div>
        )}

        {targetKind === 'user' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Usuarios</label>
            <IdPicker
              items={userPickerItems}
              selectedIds={selectedUserIds}
              onToggle={toggleId(setSelectedUserIds)}
              onClear={() => setSelectedUserIds([])}
              placeholder="Buscar y seleccionar usuarios..."
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-sm text-muted-foreground">
            Destinatarios estimados:{' '}
            <span className="font-semibold text-foreground tabular-nums">
              {recipientCount}
            </span>
          </p>
          <button
            type="submit"
            disabled={!canSubmit || sending}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {sending ? 'Enviando...' : 'Enviar notificación'}
          </button>
        </div>
      </form>

      <div>
        <h2 className="text-base font-bold text-foreground mb-3">Enviadas</h2>
        {listLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : sent.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-10 text-center">
            <BellRing className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              Aún no has enviado notificaciones
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="px-6 py-3.5 font-medium">Fecha</th>
                    <th className="px-6 py-3.5 font-medium">Título</th>
                    <th className="px-6 py-3.5 font-medium">Alcance</th>
                    <th className="px-6 py-3.5 font-medium text-right">Destinatarios</th>
                    <th className="px-6 py-3.5 font-medium text-right">Leídas</th>
                  </tr>
                </thead>
                <tbody>
                  {sent.map((item, i) => (
                    <tr
                      key={item.dedupeKey ?? `${item.createdAt}-${i}`}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="font-medium text-foreground truncate" title={item.title}>
                          {item.title}
                        </p>
                        {item.body && (
                          <p className="text-xs text-muted-foreground truncate" title={item.body}>
                            {item.body}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] px-2 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 font-semibold whitespace-nowrap">
                          {item.targetLabel ?? 'Anuncio'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-right tabular-nums">
                        {item.recipients}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums">
                        <span className={item.readCount > 0 ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}>
                          {item.readCount}
                        </span>
                        <span className="text-muted-foreground"> / {item.recipients}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
            <span>
              Página {meta.page} de {meta.totalPages} · {meta.total} envíos
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
      </div>
    </div>
  )
}
