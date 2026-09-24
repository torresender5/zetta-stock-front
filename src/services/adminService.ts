import api from '../lib/api'
import type {
  AdminBusinessData,
  AdminCompany,
  AdminCompanyDetail,
  AdminDashboardData,
  AdminUser,
} from '../types'

export interface AdminBusinessQuery {
  startDate?: string
  endDate?: string
}

export const adminService = {
  getDashboard: async (): Promise<AdminDashboardData> => {
    const { data } = await api.get<AdminDashboardData>('/admin/dashboard')
    return data
  },

  getCompanies: async (search?: string): Promise<AdminCompany[]> => {
    const { data } = await api.get<AdminCompany[]>('/admin/companies', {
      params: search ? { search } : undefined,
    })
    return data
  },

  getCompanyDetail: async (id: number): Promise<AdminCompanyDetail> => {
    const { data } = await api.get<AdminCompanyDetail>(`/admin/companies/${id}`)
    return data
  },

  setCompanyStatus: async (
    id: number,
    active: boolean,
  ): Promise<{ ok: boolean; active: boolean }> => {
    const { data } = await api.patch(`/admin/companies/${id}/status`, { active })
    return data
  },

  getUsers: async (search?: string): Promise<AdminUser[]> => {
    const { data } = await api.get<AdminUser[]>('/admin/users', {
      params: search ? { search } : undefined,
    })
    return data
  },

  setUserStatus: async (
    id: number,
    active: boolean,
  ): Promise<{ ok: boolean; active: boolean }> => {
    const { data } = await api.patch(`/admin/users/${id}/status`, { active })
    return data
  },

  getBusiness: async (query?: AdminBusinessQuery): Promise<AdminBusinessData> => {
    const { data } = await api.get<AdminBusinessData>('/admin/business', {
      params: query,
    })
    return data
  },
}