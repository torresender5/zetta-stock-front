import { create } from 'zustand'
import type { Category } from '../types'
import { categoryService } from '../services/categoryService'

function errMsg(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string | string[] } } }
  const m = e?.response?.data?.message
  if (Array.isArray(m)) return m.join(', ')
  if (typeof m === 'string' && m) return m
  return fallback
}

interface CategoryStore {
  categories: Category[]
  loading: boolean
  error: string | null
  fetchCategories: () => Promise<void>
  addCategory: (name: string) => Promise<{ ok: boolean; category?: Category; error?: string }>
  updateCategory: (id: string, name: string) => Promise<{ ok: boolean; category?: Category; error?: string }>
  deleteCategory: (id: string) => Promise<{ ok: boolean; error?: string }>
}

export const useCategoryStore = create<CategoryStore>()((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    if (get().loading) return
    set({ loading: true, error: null })
    try {
      const categories = await categoryService.getAll()
      set({ categories, loading: false })
    } catch {
      set({ error: 'Error al cargar categorías', loading: false })
    }
  },

  addCategory: async (name) => {
    set({ error: null })
    try {
      const category = await categoryService.create({ name })
      set({ categories: [...get().categories, category] })
      return { ok: true, category }
    } catch (err) {
      const error = errMsg(err, 'Error al crear categoría')
      set({ error })
      return { ok: false, error }
    }
  },

  updateCategory: async (id, name) => {
    set({ error: null })
    try {
      const category = await categoryService.update(id, { name })
      set({ categories: get().categories.map((c) => (c.id === id ? category : c)) })
      return { ok: true, category }
    } catch (err) {
      const error = errMsg(err, 'Error al actualizar categoría')
      set({ error })
      return { ok: false, error }
    }
  },

  deleteCategory: async (id) => {
    set({ error: null })
    try {
      await categoryService.delete(id)
      set({ categories: get().categories.filter((c) => c.id !== id) })
      return { ok: true }
    } catch (err) {
      const error = errMsg(err, 'Error al eliminar categoría')
      set({ error })
      return { ok: false, error }
    }
  },
}))
