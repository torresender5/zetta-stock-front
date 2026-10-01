import api from '../lib/api'
import type { Category } from '../types'

export interface CreateCategoryDto {
  name: string
  code?: string
  description?: string
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const { data } = await api.get<Category[]>('/categories/all')
    return data
  },

  create: async (category: CreateCategoryDto): Promise<Category> => {
    const { data } = await api.post<Category>('/categories', category)
    return data
  },

  update: async (id: string, category: UpdateCategoryDto): Promise<Category> => {
    const { data } = await api.patch<Category>(`/categories/${id}`, category)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`)
  },
}
