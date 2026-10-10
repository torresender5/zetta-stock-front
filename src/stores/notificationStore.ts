import { create } from 'zustand'
import { notificationService } from '../services/notificationService'
import type { AppNotification, PaginationMeta } from '../types'
import type { BellScope, NotificationScope } from '../lib/notifications'

const LIST_LIMIT = 10
const BELL_LIMIT = 5

const emptyMeta: PaginationMeta = { total: 0, page: 1, limit: LIST_LIMIT, totalPages: 1 }

interface NotificationFilters {
  scope: NotificationScope
  unreadOnly: boolean
}

export interface NotificationBellState {
  items: AppNotification[]
  unread: number
  loading: boolean
}

const emptyBell = (): NotificationBellState => ({ items: [], unread: 0, loading: false })

interface NotificationStore {
  bells: Record<BellScope, NotificationBellState>
  fetchBell: (scope: BellScope) => Promise<void>
  fetchBells: () => Promise<void>
  error: string | null

  list: AppNotification[]
  listMeta: PaginationMeta
  listUnread: number
  listLoading: boolean
  filters: NotificationFilters
  page: number
  selected: AppNotification | null
  fetchList: () => Promise<void>
  setScope: (scope: NotificationScope) => void
  setUnreadOnly: (unreadOnly: boolean) => void
  setPage: (page: number) => void
  select: (notification: AppNotification | null) => void

  markRead: (id: number) => Promise<void>
  markAllRead: () => Promise<void>
  resetSession: () => void
}

const markItemsRead = (items: AppNotification[], id: number): AppNotification[] =>
  items.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n))

let listRequestId = 0

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  bells: { general: emptyBell(), tickets: emptyBell() },
  error: null,

  fetchBell: async (scope) => {
    if (get().bells[scope].loading) return
    set((state) => ({
      bells: { ...state.bells, [scope]: { ...state.bells[scope], loading: true } },
    }))
    try {
      const res = await notificationService.getAll({ page: 1, limit: BELL_LIMIT, scope })
      set((state) => ({
        bells: {
          ...state.bells,
          [scope]: { items: res.data, unread: res.unread, loading: false },
        },
      }))
    } catch {
      set((state) => ({
        bells: { ...state.bells, [scope]: { ...state.bells[scope], loading: false } },
      }))
    }
  },

  fetchBells: async () => {
    await Promise.all([get().fetchBell('general'), get().fetchBell('tickets')])
  },

  list: [],
  listMeta: emptyMeta,
  listUnread: 0,
  listLoading: false,
  filters: { scope: 'all', unreadOnly: false },
  page: 1,
  selected: null,

  fetchList: async () => {
    const requestId = ++listRequestId
    const { filters, page } = get()
    set({ listLoading: true, error: null })
    try {
      const res = await notificationService.getAll({
        page,
        limit: LIST_LIMIT,
        scope: filters.scope,
        unread: filters.unreadOnly,
      })
      if (requestId !== listRequestId) return
      const selected = get().selected
      const fresh = selected ? (res.data.find((n) => n.id === selected.id) ?? selected) : null
      set({
        list: res.data,
        listMeta: res.meta,
        listUnread: res.unread,
        listLoading: false,
        selected: fresh,
      })
    } catch {
      if (requestId !== listRequestId) return
      set({ error: 'Error al cargar notificaciones', listLoading: false })
    }
  },

  setScope: (scope) => {
    set({ filters: { ...get().filters, scope }, page: 1 })
    void get().fetchList()
  },

  setUnreadOnly: (unreadOnly) => {
    set({ filters: { ...get().filters, unreadOnly }, page: 1 })
    void get().fetchList()
  },

  setPage: (page) => {
    set({ page })
    void get().fetchList()
  },

  select: (notification) => set({ selected: notification }),

  markRead: async (id) => {
    try {
      await notificationService.markRead(id)
      set((state) => {
        const unreadInList = state.list.some((n) => n.id === id && !n.readAt)
        const bells = { ...state.bells }
        for (const scope of Object.keys(bells) as BellScope[]) {
          const bell = bells[scope]
          const unreadInBell = bell.items.some((n) => n.id === id && !n.readAt)
          bells[scope] = {
            items: markItemsRead(bell.items, id),
            unread: unreadInBell ? Math.max(0, bell.unread - 1) : bell.unread,
            loading: bell.loading,
          }
        }
        return {
          bells,
          list: markItemsRead(state.list, id),
          selected:
            state.selected && state.selected.id === id && !state.selected.readAt
              ? { ...state.selected, readAt: new Date().toISOString() }
              : state.selected,
          listUnread: unreadInList ? Math.max(0, state.listUnread - 1) : state.listUnread,
        }
      })
    } catch {
      set({ error: 'Error al marcar la notificación' })
    }
  },

  markAllRead: async () => {
    try {
      await notificationService.markAllRead()
      const now = new Date().toISOString()
      set((state) => {
        const bells = { ...state.bells }
        for (const scope of Object.keys(bells) as BellScope[]) {
          const bell = bells[scope]
          bells[scope] = {
            items: bell.items.map((n) => (n.readAt ? n : { ...n, readAt: now })),
            unread: 0,
            loading: bell.loading,
          }
        }
        return {
          bells,
          list: state.list.map((n) => (n.readAt ? n : { ...n, readAt: now })),
          selected:
            state.selected && !state.selected.readAt ? { ...state.selected, readAt: now } : state.selected,
          listUnread: 0,
        }
      })
    } catch {
      set({ error: 'Error al marcar las notificaciones' })
    }
  },

  resetSession: () => {
    // Invalida cualquier fetchList en vuelo de la sesión anterior.
    listRequestId++
    set({
      bells: { general: emptyBell(), tickets: emptyBell() },
      error: null,
      list: [],
      listMeta: emptyMeta,
      listUnread: 0,
      listLoading: false,
      filters: { scope: 'all', unreadOnly: false },
      page: 1,
      selected: null,
    })
  },
}))
