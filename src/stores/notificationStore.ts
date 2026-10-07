import { create } from 'zustand'
import { notificationService, type NotificationQueryParams } from '../services/notificationService'
import type { AppNotification, PaginationMeta } from '../types'

interface NotificationStore {
  items: AppNotification[]
  meta: PaginationMeta | null
  unread: number
  loading: boolean
  error: string | null
  fetch: (params?: NotificationQueryParams) => Promise<void>
  markRead: (id: number) => Promise<void>
  markAllRead: () => Promise<void>
}

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  items: [],
  meta: null,
  unread: 0,
  loading: false,
  error: null,

  fetch: async (params = {}) => {
    if (get().loading) return
    set({ loading: true, error: null })
    try {
      const res = await notificationService.getAll({ page: 1, limit: 20, ...params })
      set({ items: res.data, meta: res.meta, unread: res.unread, loading: false })
    } catch {
      set({ error: 'Error al cargar notificaciones', loading: false })
    }
  },

  markRead: async (id) => {
    try {
      await notificationService.markRead(id)
      set((state) => ({
        items: state.items.map((n) =>
          n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n,
        ),
        unread: Math.max(0, state.unread - 1),
      }))
    } catch {
      set({ error: 'Error al marcar la notificación' })
    }
  },

  markAllRead: async () => {
    try {
      await notificationService.markAllRead()
      const now = new Date().toISOString()
      set((state) => ({
        items: state.items.map((n) => (n.readAt ? n : { ...n, readAt: now })),
        unread: 0,
      }))
    } catch {
      set({ error: 'Error al marcar las notificaciones' })
    }
  },
}))
