import api from '../lib/api'
import type { NotificationListResponse, AppNotification } from '../types'

export interface NotificationQueryParams {
  page?: number
  limit?: number
  unread?: boolean
}

export const notificationService = {
  getAll: async (params: NotificationQueryParams = {}): Promise<NotificationListResponse> => {
    const { data } = await api.get<NotificationListResponse>('/notifications', { params })
    return data
  },

  markRead: async (id: number): Promise<AppNotification> => {
    const { data } = await api.patch<AppNotification>(`/notifications/${id}/read`)
    return data
  },

  markAllRead: async (): Promise<{ count: number }> => {
    const { data } = await api.patch<{ count: number }>('/notifications/read-all')
    return data
  },
}
