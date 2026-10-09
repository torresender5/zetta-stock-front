import api from '../lib/api'
import type {
  AdminAnnouncement,
  AdminBusinessData,
  AdminCompany,
  AdminCompanyDetail,
  AdminDashboardData,
  AdminTicket,
  AdminUser,
  AnnouncementTargets,
  CreateAnnouncementResult,
  PaginatedResponse,
  TicketQueryParams,
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

  getTickets: async (
    params: TicketQueryParams = {}
  ): Promise<PaginatedResponse<AdminTicket>> => {
    const { data } = await api.get<PaginatedResponse<AdminTicket>>(
      '/admin/tickets',
      { params }
    )
    return data
  },

  getTicketById: async (id: string): Promise<AdminTicket> => {
    const { data } = await api.get<AdminTicket>(`/admin/tickets/${id}`)
    return data
  },

  replyTicket: async (id: string, body: string): Promise<AdminTicket> => {
    const { data } = await api.post<AdminTicket>(`/admin/tickets/${id}/messages`, {
      body,
    })
    return data
  },

  updateTicketStatus: async (id: string, status: string): Promise<AdminTicket> => {
    const { data } = await api.patch<AdminTicket>(`/admin/tickets/${id}/status`, {
      status,
    })
    return data
  },

  createNotification: async (payload: {
    title: string
    body?: string
    targets: AnnouncementTargets
  }): Promise<CreateAnnouncementResult> => {
    const { data } = await api.post<CreateAnnouncementResult>(
      '/admin/notifications',
      payload
    )
    return data
  },

  getNotifications: async (params: {
    page: number
    limit: number
  }): Promise<PaginatedResponse<AdminAnnouncement>> => {
    const { data } = await api.get<PaginatedResponse<AdminAnnouncement>>(
      '/admin/notifications',
      { params }
    )
    return data
  },
}