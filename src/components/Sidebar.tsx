import { NavLink, useNavigate, Link } from 'react-router-dom'
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
  PackagePlus,
  Wallet,
  X,
  LogOut,
  UserCircle,
  Shield,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { can, ROLES } from '../lib/permissions'
import type { ViewKey } from '../lib/permissions'

const links: { to: string; label: string; icon: typeof LayoutDashboard; view: ViewKey }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
  { to: '/caja', label: 'Caja', icon: Wallet, view: 'caja' },
  { to: '/products', label: 'Productos', icon: Package, view: 'products' },
  { to: '/clients', label: 'Clientes', icon: Users, view: 'clients' },
  { to: '/suppliers', label: 'Proveedores', icon: Truck, view: 'suppliers' },
  { to: '/purchases', label: 'Compras', icon: ShoppingCart, view: 'purchases' },
  { to: '/sales', label: 'Ventas', icon: TrendingUp, view: 'sales' },
  { to: '/apartados', label: 'Apartados', icon: PackagePlus, view: 'apartados' },
  { to: '/invoices', label: 'Facturas', icon: FileText, view: 'invoices' },
  { to: '/accounts-payable', label: 'Cuentas por Pagar', icon: CreditCard, view: 'accountsPayable' },
  { to: '/accounts-receivable', label: 'Cuentas por Cobrar', icon: HandCoins, view: 'accountsReceivable' },
  { to: '/perfil', label: 'Mi Perfil', icon: UserCircle, view: 'profile' },
  { to: '/users', label: 'Usuarios', icon: Shield, view: 'users' },
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
        <div className="relative p-5 flex items-center justify-center">
          <img
            src="/logo-sidebar.png?v=2"
            alt="zettastock"
            className="w-full max-w-[200px] h-auto object-contain"
          />
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="lg:hidden absolute right-6 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {links
            .filter((link) => can(user?.role, link.view))
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
          <Link to="/perfil" onClick={onClose} className="flex items-center gap-2.5 text-sm mb-3 hover:opacity-90 transition-opacity">
            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-1.5 rounded-lg">
              <UserCircle className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-gray-200 truncate block text-sm font-medium">{user?.name}</span>
              <span className={`text-xs ${user?.role === 'admin' ? 'text-violet-400' : 'text-gray-500'}`}>
                {ROLES[user?.role ?? 'vendedor'].label}
              </span>
              {user?.companyName && (
                <span className="text-gray-500 truncate block text-xs mt-0.5">
                  {user.companyName} · {user.companyKind === 'EMPRESA' ? 'Empresa' : 'Persona'}
                </span>
              )}
            </div>
          </Link>
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