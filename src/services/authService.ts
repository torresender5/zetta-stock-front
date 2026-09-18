import api from '../lib/api'
import type { Role } from '../lib/permissions'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
  companyId?: string | null
  companyKind?: 'PERSONA' | 'EMPRESA' | string
  companyName?: string
  companyDocument?: string | null
  companyPhoneNumber?: string | null
  companyAddress?: string | null
}

export interface CreateUserDto {
  user: string
  email: string
  password: string
  role: Role
}

export interface UpdateProfileDto {
  name?: string
  email?: string
  currentPassword: string
  newPassword?: string
}

export interface UpdateCompanyDto {
  companyName?: string
  document?: string
  phoneNumber?: string
  address?: string
}

export interface LoginResponse {
  access_token?: string
  token?: string
}

export interface RegisterDto {
  user: string
  email: string
  password: string
  accountType: 'PERSONA' | 'EMPRESA'
  companyName?: string
  document?: string
  phoneNumber?: string
  address?: string
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1]
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

function userFromToken(token: string): AuthUser | null {
  const payload = decodeJwtPayload(token)
  if (!payload) return null
  const role = ['admin', 'vendedor', 'inventario'].includes(String(payload.role))
    ? (String(payload.role) as Role)
    : 'vendedor'
  return {
    id: String(payload.sub ?? ''),
    name: String(payload.name ?? ''),
    email: String(payload.email ?? ''),
    role,
    createdAt: '',
    companyId: payload.companyId != null ? String(payload.companyId) : null,
    companyKind: payload.companyKind != null ? String(payload.companyKind) : undefined,
    companyName: payload.companyName != null ? String(payload.companyName) : undefined,
    companyDocument: payload.companyDocument != null ? String(payload.companyDocument) : null,
    companyPhoneNumber: payload.companyPhoneNumber != null ? String(payload.companyPhoneNumber) : null,
    companyAddress: payload.companyAddress != null ? String(payload.companyAddress) : null,
  }
}

function saveSession(data: LoginResponse): AuthUser {
  const token = data.access_token || data.token
  if (!token) throw new Error('No se recibió token')
  localStorage.setItem('auth-token', token)
  const user = userFromToken(token)
  if (!user) throw new Error('Token inválido')
  return user
}

export const authService = {
  login: async (email: string, password: string): Promise<{ user: AuthUser; token: string }> => {
    const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
    const user = saveSession(data)
    return { user, token: data.access_token || data.token || '' }
  },

  register: async (dto: RegisterDto): Promise<{ user: AuthUser; token: string }> => {
    await api.post('/auth/register', dto)
    const { data } = await api.post<LoginResponse>('/auth/login', {
      email: dto.email,
      password: dto.password,
    })
    const user = saveSession(data)
    return { user, token: data.access_token || data.token || '' }
  },

  logout: () => {
    localStorage.removeItem('auth-token')
  },

  getTokenFromStorage: (): AuthUser | null => {
    const token = localStorage.getItem('auth-token')
    if (!token) return null
    return userFromToken(token)
  },

  getUsers: async (): Promise<AuthUser[]> => {
    const { data } = await api.get<AuthUser[]>('/users')
    return data
  },

  createUser: async (dto: CreateUserDto): Promise<AuthUser> => {
    const { data } = await api.post<AuthUser>('/users/create', dto)
    return data
  },

  updateUser: async (id: string, updates: Partial<AuthUser & { password: string }>): Promise<AuthUser> => {
    const { data } = await api.patch<AuthUser>(`/users/${id}`, updates)
    return data
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`)
  },

  updateProfile: async (dto: UpdateProfileDto): Promise<{ user: AuthUser; token: string }> => {
    const { data } = await api.patch<LoginResponse>('/users/me', dto)
    const user = saveSession(data)
    return { user, token: data.access_token || data.token || '' }
  },

  updateCompany: async (dto: UpdateCompanyDto): Promise<{ user: AuthUser; token: string }> => {
    const { data } = await api.patch<LoginResponse>('/users/me/company', dto)
    const user = saveSession(data)
    return { user, token: data.access_token || data.token || '' }
  },
}
