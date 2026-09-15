import api from '../lib/api'
import type { Product, PaginatedResponse, ProductQueryParams } from '../types'

export type CreateProductDto = Omit<Product, 'id' | 'createdAt'>

export const productService = {
  getAll: async (params: ProductQueryParams = {}): Promise<PaginatedResponse<Product>> => {
    const { data } = await api.get<PaginatedResponse<Product>>('/products', { params })
    return data
  },

  getById: async (id: string): Promise<Product> => {
    const { data } = await api.get<Product>(`/products/${id}`)
    return data
  },

  create: async (product: CreateProductDto): Promise<Product> => {
    const { data } = await api.post<Product>('/products', product)
    return data
  },

  update: async (id: string, product: Partial<Product>): Promise<Product> => {
    const { data } = await api.patch<Product>(`/products/${id}`, product)
    return data
  },

  uploadImage: async (id: string, file: File): Promise<Product> => {
    const formData = new FormData()
    formData.append('image', file)
    const { data } = await api.patch<Product>(`/products/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`)
  },
}
