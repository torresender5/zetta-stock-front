import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import CartContent from '../components/CartContent'

export default function CartPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carrito de venta</h1>
          <p className="text-sm text-gray-500 mt-1">Revisa los productos y finaliza la venta</p>
        </div>
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Seguir comprando
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[60vh] flex flex-col">
        <CartContent variant="page" />
      </div>
    </div>
  )
}
