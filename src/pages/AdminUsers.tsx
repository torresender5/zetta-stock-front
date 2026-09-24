import { useEffect, useState } from 'react'
import {
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  UserCircle,
  Users,
} from 'lucide-react'
import { adminService } from '../services/adminService'
import { formatDate } from '../lib/utils'
import type { AdminUser } from '../types'

const roleBadge: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  vendedor: 'bg-blue-100 text-blue-700',
  inventario: 'bg-amber-100 text-amber-700',
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = async (term?: string) => {
    setLoading(true)
    setError(null)
    try {
      setUsers(await adminService.getUsers(term || undefined))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      void load(search)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const toggleStatus = async (user: AdminUser) => {
    const next = !user.active
    const action = next ? 'activar' : 'desactivar'
    if (!confirm(`¿${next ? 'Activar' : 'Desactivar'} al usuario "${user.name}" (${user.email})?`)) {
      return
    }
    setError(null)
    setNotice(null)
    try {
      await adminService.setUserStatus(user.id, next)
      setNotice(`Usuario ${action}do correctamente`)
      await load(search)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar el estado')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-violet-600" /> Usuarios
        </h1>
        <p className="text-sm text-muted-foreground">
          Todos los usuarios del sistema y su estado.
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-10 text-center">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No hay usuarios</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="px-6 py-3.5 font-medium">Usuario</th>
                  <th className="px-6 py-3.5 font-medium">Email</th>
                  <th className="px-6 py-3.5 font-medium">Empresa</th>
                  <th className="px-6 py-3.5 font-medium">Rol</th>
                  <th className="px-6 py-3.5 font-medium">Registrado</th>
                  <th className="px-6 py-3.5 font-medium">Estado</th>
                  <th className="px-6 py-3.5 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border/60 last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserCircle className="w-8 h-8 text-gray-300 shrink-0" />
                        <p className="font-semibold text-foreground">{user.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-foreground">{user.companyName ?? '—'}</span>
                      {user.companyActive === false && (
                        <span className="block text-xs text-red-500 font-semibold">Empresa desactivada</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          roleBadge[user.role] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(user.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                          user.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}
                      >
                        {user.active ? <ShieldCheck className="w-3 h-3" /> : <ShieldX className="w-3 h-3" />}
                        {user.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => void toggleStatus(user)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                            user.active
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {user.active ? <ShieldX className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          {user.active ? 'Desactivar' : 'Activar'}
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
    </div>
  )
}