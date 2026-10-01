import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, TrendingUp, Menu } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { canView } from '../lib/permissions'
import type { ViewKey } from '../lib/permissions'

const links: { to: string; label: string; icon: typeof LayoutDashboard; view: ViewKey }[] = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, view: 'dashboard' },
  { to: '/products', label: 'Productos', icon: Package, view: 'products' },
  { to: '/sales', label: 'Ventas', icon: TrendingUp, view: 'sales' },
]

interface BottomNavProps {
  onOpenMenu: () => void
}

export default function BottomNav({ onOpenMenu }: BottomNavProps) {
  const user = useAuthStore((s) => s.user)
  const plan = useSubscriptionStore((s) => s.subscription?.plan)

  return (
    <nav
      className="no-print lg:hidden fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch">
        {links
          .filter((link) => canView(user?.role, link.view, plan))
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
                  isActive ? 'text-violet-500' : 'text-gray-500 hover:text-foreground'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        <button
          onClick={onOpenMenu}
          aria-label="Abrir menú"
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium text-gray-500 hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <Menu className="w-5 h-5" />
          Menú
        </button>
      </div>
    </nav>
  )
}
