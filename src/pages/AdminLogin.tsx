import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Loader2, LogIn, ShieldAlert } from 'lucide-react'
import { isAdminAuthenticated } from '../lib/adminAuth'
import { verifyAdmin } from '../services/adminAuthService'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  if (isAdminAuthenticated()) {
    return <Navigate to="/admin/planes" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await verifyAdmin(email, password)
    setLoading(false)
    if (result.ok) {
      navigate('/admin/planes', { replace: true })
    } else {
      setError(result.error ?? 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Panel de administración</h1>
          <p className="text-sm text-gray-400 mt-1">
            Acceso exclusivo para administradores de ZettaStock
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 backdrop-blur"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="admin@zettastock.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm font-medium text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verificando…
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Ingresar
              </>
            )}
          </button>
        </form>
        <p className="text-center mt-4">
          <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  )
}