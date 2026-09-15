import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  ShoppingCart,
  TrendingUp,
  FileText,
  CreditCard,
  HandCoins,
  X,
  LogOut,
  UserCircle,
  Shield,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/clients', label: 'Clientes', icon: Users },
  { to: '/suppliers', label: 'Proveedores', icon: Truck },
  { to: '/purchases', label: 'Compras', icon: ShoppingCart },
  { to: '/sales', label: 'Ventas', icon: TrendingUp },
  { to: '/invoices', label: 'Facturas', icon: FileText },
  { to: '/accounts-payable', label: 'Cuentas por Pagar', icon: CreditCard },
  { to: '/accounts-receivable', label: 'Cuentas por Cobrar', icon: HandCoins },
  { to: '/users', label: 'Usuarios', icon: Shield, adminOnly: true },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity ease-out duration-200"
          onClick={onClose}
        />
      )}

      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white flex flex-col transition-transform ease-out duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 flex items-center justify-between">
          <h1 className="text-lg font-bold flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-violet-500/25">
              <Package className="w-4 h-4 text-white" />
            </div>
            GestiónPro
          </h1>
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {links
            .filter((link) => !('adminOnly' in link && link.adminOnly) || user?.role === 'admin')
            .map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px]" />
                {label}
              </NavLink>
            ))}
        </nav>

        <div className="p-3 mx-3 mb-3 rounded-2xl bg-white/5">
          <div className="flex items-center gap-2.5 text-sm mb-3">
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-1.5 rounded-lg">
              <UserCircle className="w-4 h-4 text-gray-300" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-gray-200 truncate block text-sm font-medium">{user?.name}</span>
              <span className={`text-xs ${user?.role === 'admin' ? 'text-violet-400' : 'text-gray-500'}`}>
                {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:bg-white/10 hover:text-white rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}