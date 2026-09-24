import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Building2,
  CreditCard,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { clearAdminSession } from '../lib/adminAuth'

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/empresas', label: 'Empresas', icon: Building2 },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/planes', label: 'Planes', icon: CreditCard },
  { to: '/admin/ordenes', label: 'Órdenes de pago', icon: ListOrdered },
  { to: '/admin/suscripciones', label: 'Suscripciones', icon: ShieldAlert },
  { to: '/admin/negocio', label: 'Negocio', icon: BarChart3 },
]

export default function AdminLayout() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAdminSession()
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="w-60 shrink-0 bg-slate-900 text-white flex-col hidden sm:flex">
        <div className="p-5 flex items-center gap-2.5">
          <div className="rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 p-2">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">ZettaStock</p>
            <p className="text-xs text-gray-400">Admin</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:bg-white/10 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="flex-1">
        {/* Navegación móvil */}
        <nav className="sm:hidden flex items-center gap-1 bg-slate-900 px-3 py-2 overflow-x-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  isActive ? 'bg-violet-600 text-white' : 'text-gray-400'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 whitespace-nowrap cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </nav>
        <main className="p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}