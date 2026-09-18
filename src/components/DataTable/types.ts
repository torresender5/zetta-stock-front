import type { ReactNode } from 'react'

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  align?: 'left' | 'right'
  /** Breakpoint desde el cual la columna es visible. Si se omite, siempre es visible. */
  hideBelow?: Breakpoint
  /** Ancho fijo de la columna (CSS). Requiere table-fixed. */
  width?: string
  /** Aplicar ellipsis/truncado al contenido de la celda. */
  truncate?: boolean
  headerClassName?: string
  cellClassName?: string
}

export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  getRowKey: (row: T) => string
  loading?: boolean
  error?: string | null
  emptyIcon?: ReactNode
  emptyMessage?: string
  actions?: (row: T) => ReactNode
  pagination?: PaginationState
}
