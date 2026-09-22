import { Crown, LogOut, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function ExpiredLock() {
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50 p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-xl shadow-violet-500/10 p-8 text-center animate-modal-in">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-5 shadow-lg shadow-violet-500/30">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Tu plan ha vencido
        </h1>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Para continuar facturando, gestionar tu inventario y acceder a tus
          reportes, reactiva tu suscripción eligiendo un plan. Tus datos siguen
          guardados y se restauran al instante.
        </p>
        <Link
          to="/suscripcion"
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white font-semibold py-3 rounded-2xl transition-opacity shadow-lg shadow-violet-500/25"
        >
          <Sparkles className="w-4 h-4" /> Ver planes y reactivar
        </Link>
        <button
          onClick={logout}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 text-muted-foreground font-medium py-2 rounded-2xl hover:bg-muted transition-colors text-sm cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  )
}