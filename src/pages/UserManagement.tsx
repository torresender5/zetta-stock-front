import { useState, useEffect } from 'react'
import { Search, Edit, Trash2, Shield, UserCircle, UserPlus, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import type { Role } from '../stores/authStore'
import { formatDate } from '../lib/utils'
import { ROLES } from '../lib/permissions'
import Modal from '../components/Modal'

const ROLE_OPTIONS = Object.keys(ROLES) as Role[]

const roleBadge: Record<Role, string> = {
  admin: 'bg-purple-100 text-purple-700',
  vendedor: 'bg-blue-100 text-blue-700',
  inventario: 'bg-amber-100 text-amber-700',
}

export default function UserManagement() {
  const currentUser = useAuthStore((s) => s.user)
  const users = useAuthStore((s) => s.users)
  const loading = useAuthStore((s) => s.loading)
  const fetchUsers = useAuthStore((s) => s.fetchUsers)
  const createUser = useAuthStore((s) => s.createUser)
  const updateUser = useAuthStore((s) => s.updateUser)
  const deleteUser = useAuthStore((s) => s.deleteUser)

  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'vendedor' as Role, password: '' })
  const [error, setError] = useState('')

  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    if (isAdmin) fetchUsers()
  }, [isAdmin])

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setForm({ name: '', email: '', role: 'vendedor', password: '' })
    setEditingId(null)
    setError('')
    setIsModalOpen(true)
  }

  const openEdit = (user: typeof users[0]) => {
    setForm({ name: user.name, email: user.email, role: user.role, password: '' })
    setEditingId(user.id)
    setError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password && form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    let result
    if (editingId) {
      const updates: { name?: string; email?: string; role?: Role; password?: string } = {
        name: form.name,
        email: form.email,
        role: form.role,
      }
      if (form.password) updates.password = form.password
      result = await updateUser(editingId, updates)
    } else {
      if (!form.password) {
        setError('La contraseña es obligatoria al crear un usuario')
        return
      }
      result = await createUser({
        user: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      })
    }

    if (result.ok) {
      setIsModalOpen(false)
    } else {
      setError(result.error || 'Error al guardar el usuario')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar al usuario "${name}"?`)) return
    const result = await deleteUser(id)
    if (!result.ok) {
      alert(result.error)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Shield className="w-16 h-16 mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold mb-2">Acceso restringido</h2>
        <p>Solo los administradores pueden gestionar usuarios.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-sm text-gray-500 mt-1">Crea sub-usuarios y asigna su rol para esta empresa</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{users.length} usuario{users.length !== 1 ? 's' : ''}</span>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" /> Nuevo Usuario
            </button>
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Buscar por nombre o email..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border-0 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm transition-all" />
      </div>

      {loading && users.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          <span className="ml-2 text-gray-500">Cargando usuarios...</span>
        </div>
      ) : (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="text-left px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Usuario</th>
              <th className="text-left px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Email</th>
              <th className="text-center px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Rol</th>
              <th className="text-left px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Registrado</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No se encontraron usuarios</td></tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <UserCircle className="w-8 h-8 text-gray-300 shrink-0" />
                      <div>
                        <p className="font-medium">{u.name}</p>
                        {u.id === currentUser?.id && (
                          <span className="text-xs text-blue-600">(Tú)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{u.email}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {u.role === 'admin' && <Shield className="w-3 h-3" />}
                      {ROLES[u.role]?.label ?? u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(u.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button onClick={() => handleDelete(u.id, u.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl p-3">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
              <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rol *</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all bg-white">
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{ROLES[r].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {editingId ? 'Nueva contraseña' : 'Contraseña *'}
              </label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingId ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium">
              {editingId ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}