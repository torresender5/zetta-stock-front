import { useLocation, useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { canView } from '../lib/permissions'

export default function CartFab() {
  const items = useCartStore((s) => s.items)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)
  const plan = useSubscriptionStore((s) => s.subscription?.plan)

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const isProducts = pathname === '/products'
  const isCart = pathname === '/cart'

  // Visible siempre en Productos; en el resto de vistas solo con ítems.
  // Oculto en /cart (redundante) y si el rol no puede crear ventas.
  const visible =
    canView(user?.role, 'sales', plan) && !isCart && (isProducts || itemCount > 0)

  if (!visible) return null

  return (
    <button
      onClick={() => navigate('/cart')}
      aria-label="Abrir carrito de venta"
      className="no-print fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/40 hover:from-violet-700 hover:to-indigo-700 hover:shadow-violet-500/60 transition-all active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
    >
      <ShoppingBag className="w-6 h-6" aria-hidden="true" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center shadow-lg">
          {itemCount}
        </span>
      )}
    </button>
  )
}
