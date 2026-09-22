import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const adminAuth = localStorage.getItem('admin-auth')
  if (adminAuth) {
    // Sesión de superadmin (Basic Auth contra UserAdmin)
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
      localStorage.removeItem('auth-token')
      useAuthStore.setState({ user: null })
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