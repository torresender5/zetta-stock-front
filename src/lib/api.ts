import axios from 'axios'
import { useAuthStore } from '../stores/authStore'
import { resetAllSessionStores } from '../stores/resetStores'
import { clearAdminSession } from './adminAuth'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  // Sesión de superadmin (Basic Auth contra UserAdmin): solo en sessionStorage.
  const adminAuth = sessionStorage.getItem('admin-auth')
  if (adminAuth) {
    config.headers.Authorization = `Basic ${adminAuth}`
    return config
  }
  const token = localStorage.getItem('auth-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authHeader = String(error.config?.headers?.Authorization ?? '')
      if (authHeader.startsWith('Basic ')) {
        // Credenciales de superadmin inválidas o vencidas.
        clearAdminSession()
        window.location.href = '/admin/login'
        return Promise.reject(error)
      }
      // Token de usuario expirado/inválido: se limpia toda la sesión.
      localStorage.removeItem('auth-token')
      resetAllSessionStores()
      useAuthStore.setState({ user: null, users: [] })
      window.location.href = '/login'
    }
    // Plan vencido: los usuarios de empresa quedan bloqueados salvo la
    // pantalla de suscripción.
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === 'PLAN_EXPIRED'
    ) {
      if (!window.location.pathname.startsWith('/suscripcion')) {
        window.location.href = '/suscripcion'
      }
    }
    return Promise.reject(error)
  }
)

export default api