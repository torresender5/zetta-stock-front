import { create } from 'zustand'
import {
  authService,
  type AuthUser,
  type RegisterDto,
  type CreateUserDto,
  type UpdateProfileDto,
  type UpdateCompanyDto,
} from '../services/authService'
import type { Role } from '../lib/permissions'

export type { Role }
export type { CreateUserDto }

export type User = AuthUser

interface AuthStore {
  user: User | null
  users: User[]
  loading: boolean
  error: string | null
  hydrated: boolean
  hydrate: () => Promise<void>
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  register: (dto: RegisterDto) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  fetchUsers: () => Promise<void>
  createUser: (dto: CreateUserDto) => Promise<{ ok: boolean; error?: string }>
  updateUser: (id: string, updates: { name?: string; email?: string; role?: Role; password?: string }) => Promise<{ ok: boolean; error?: string }>
  deleteUser: (id: string) => Promise<{ ok: boolean; error?: string }>
  updateProfile: (dto: UpdateProfileDto) => Promise<{ ok: boolean; error?: string }>
  updateCompany: (dto: UpdateCompanyDto) => Promise<{ ok: boolean; error?: string }>
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  users: [],
  loading: false,
  error: null,
  hydrated: false,

  hydrate: async () => {
    const user = authService.getTokenFromStorage()
    if (user) {
      set({ user, hydrated: true })
    } else {
      set({ hydrated: true })
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { user } = await authService.login(email, password)
      set({ user, loading: false })
      return { ok: true }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Email o contraseña incorrectos'
      set({ error: message, loading: false })
      return { ok: false, error: message }
    }
  },

  register: async (dto: RegisterDto) => {
    set({ loading: true, error: null })
    try {
      const { user } = await authService.register(dto)
      set({ user, loading: false })
      return { ok: true }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al registrar usuario'
      set({ error: message, loading: false })
      return { ok: false, error: message }
    }
  },

  logout: () => {
    authService.logout()
    set({ user: null, users: [] })
  },

  fetchUsers: async () => {
    set({ loading: true, error: null })
    try {
      const users = await authService.getUsers()
      set({ users, loading: false })
    } catch {
      set({ error: 'Error al cargar usuarios', loading: false })
    }
  },

  createUser: async (dto: CreateUserDto) => {
    set({ loading: true, error: null })
    try {
      const created = await authService.createUser(dto)
      set((state) => ({
        users: [...state.users, created],
        loading: false,
      }))
      return { ok: true }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al crear usuario'
      set({ error: message, loading: false })
      return { ok: false, error: message }
    }
  },

  updateUser: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const updated = await authService.updateUser(id, updates)
      const currentUser = get().user
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updated : u)),
        user: currentUser?.id === id ? updated : currentUser,
        loading: false,
      }))
      return { ok: true }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al actualizar usuario'
      set({ error: message, loading: false })
      return { ok: false, error: message }
    }
  },

  deleteUser: async (id) => {
    const state = get()
    if (state.user?.id === id) return { ok: false, error: 'No puedes eliminar tu propia cuenta' }
    set({ loading: true, error: null })
    try {
      await authService.deleteUser(id)
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        loading: false,
      }))
      return { ok: true }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al eliminar usuario'
      set({ error: message, loading: false })
      return { ok: false, error: message }
    }
  },

  updateProfile: async (dto) => {
    set({ loading: true, error: null })
    try {
      const { user } = await authService.updateProfile(dto)
      set({ user, loading: false })
      return { ok: true }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al actualizar el perfil'
      set({ error: message, loading: false })
      return { ok: false, error: message }
    }
  },

  updateCompany: async (dto) => {
    set({ loading: true, error: null })
    try {
      const { user } = await authService.updateCompany(dto)
      set({ user, loading: false })
      return { ok: true }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al actualizar los datos de la empresa'
      set({ error: message, loading: false })
      return { ok: false, error: message }
    }
  },
}))
