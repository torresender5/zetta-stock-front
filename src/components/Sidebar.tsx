import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
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
  BarChart3,
  X,
  LogOut,
  UserCircle,
  Shield,
  Crown,
  Settings,
  LifeBuoy,
  Store,
  ShoppingBasket,
  Settings2,
  ChevronDown,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { canView, ROLES } from '../lib/permissions'
import type { ViewKey } from '../lib/permissions'

interface MenuItem {
  to: string
  label: string
  icon: LucideIcon
  view: ViewKey
}

interface MenuGroup {
  id: string
  label: string
  icon: LucideIcon
  children: MenuItem[]
}

type MenuEntry = MenuItem | MenuGroup

const isGroup = (entry: MenuEntry): entry is MenuGroup => 'children' in entry

const menu: MenuEntry[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
  { to: '/caja', label: 'Caja', icon: Wallet, view: 'caja' },
  {
    id: 'ventas',
    label: 'Ventas',
    icon: Store,
    children: [
      { to: '/clients', label: 'Clientes', icon: Users, view: 'clients' },
      { to: '/sales', label: 'Ventas', icon: TrendingUp, view: 'sales' },
      { to: '/apartados', label: 'Apartados', icon: PackagePlus, view: 'apartados' },
      { to: '/invoices', label: 'Facturas', icon: FileText, view: 'invoices' },
      { to: '/accounts-receivable', label: 'Cuentas por Cobrar', icon: HandCoins, view: 'accountsReceivable' },
    ],
  },
  {
    id: 'compras',
    label: 'Compras',
    icon: ShoppingBasket,
    children: [
      { to: '/suppliers', label: 'Proveedores', icon: Truck, view: 'suppliers' },
      { to: '/purchases', label: 'Compras', icon: ShoppingCart, view: 'purchases' },
      { to: '/accounts-payable', label: 'Cuentas por Pagar', icon: CreditCard, view: 'accountsPayable' },
    ],
  },
  { to: '/products', label: 'Productos', icon: Package, view: 'products' },
  { to: '/reports', label: 'Reportes', icon: BarChart3, view: 'reports' },
  {
    id: 'sistema',
    label: 'Sistema',
    icon: Settings2,
    children: [
      { to: '/users', label: 'Usuarios', icon: Shield, view: 'users' },
      { to: '/suscripcion', label: 'Suscripción', icon: Crown, view: 'suscripcion' },
      { to: '/tickets', label: 'Tickets', icon: LifeBuoy, view: 'tickets' },
      { to: '/configuracion', label: 'Configuración', icon: Settings, view: 'settings' },
    ],
  },
]

const OPEN_GROUPS_KEY = 'sidebar-open-groups'

const loadOpenGroups = (): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(OPEN_GROUPS_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, boolean>)
      : {}
  } catch {
    return {}
  }
}

const groupMatchesPath = (children: MenuItem[], pathname: string) =>
  children.some((child) =>
    child.to === '/' ? pathname === '/' : pathname === child.to || pathname.startsWith(`${child.to}/`),
  )

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const plan = useSubscriptionStore((s) => s.subscription?.plan)
  const navigate = useNavigate()
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(loadOpenGroups)

  useEffect(() => {
    setOpenGroups((prev) => {
      let changed = false
      const next = { ...prev }
      for (const entry of menu) {
        if (isGroup(entry) && next[entry.id] === false && groupMatchesPath(entry.children, location.pathname)) {
          delete next[entry.id]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [location.pathname])

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(openGroups))
    } catch {
      // sin storage disponible: el estado solo vive en memoria
    }
  }, [openGroups])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isGroupOpen = (group: MenuGroup) =>
    openGroups[group.id] ?? groupMatchesPath(group.children, location.pathname)

  const toggleGroup = (group: MenuGroup) => {
    setOpenGroups((prev) => ({ ...prev, [group.id]: !isGroupOpen(group) }))
  }

  const visibleEntries = menu
    .map((entry) => {
      if (!isGroup(entry)) {
        return canView(user?.role, entry.view, plan) ? entry : null
      }
      const children = entry.children.filter((child) => canView(user?.role, child.view, plan))
      if (children.length === 0) return null
      if (children.length === 1) return children[0]
      return { ...entry, children }
    })
    .filter((entry): entry is MenuEntry => entry !== null)

  const leafClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
      isActive
        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25'
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`

  const renderLeaf = (item: MenuItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      onClick={onClose}
      className={({ isActive }) => leafClass(isActive)}
    >
      <item.icon className="w-[18px] h-[18px]" />
      {item.label}
    </NavLink>
  )

  const renderGroup = (group: MenuGroup) => {
    const open = isGroupOpen(group)
    const active = groupMatchesPath(group.children, location.pathname)
    return (
      <div key={group.id}>
        <button
          type="button"
          onClick={() => toggleGroup(group)}
          aria-expanded={open}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
            active ? 'bg-white/5 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <group.icon className={`w-[18px] h-[18px] ${active ? 'text-violet-400' : ''}`} />
          <span className="flex-1 text-left">{group.label}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {open && (
          <div className="ml-3 pl-3 border-l border-white/10 space-y-0.5 py-0.5">
            {group.children.map(renderLeaf)}
          </div>
        )}
      </div>
    )
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
          {visibleEntries.map((entry) => (isGroup(entry) ? renderGroup(entry) : renderLeaf(entry)))}
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
