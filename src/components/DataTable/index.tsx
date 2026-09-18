import { Fragment, useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { DataTableProps, Column } from './types'
import { useBreakpoints } from './useBreakpoints'
import Pagination from './Pagination'

function cellValue<T>(row: T, col: Column<T>) {
  if (col.render) return col.render(row)
  const value = (row as Record<string, unknown>)[col.key]
  return value === undefined || value === null || value === '' ? <span className="text-gray-300">—</span> : String(value)
}

const alignClass = (align?: 'left' | 'center' | 'right') => (align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left')

export default function DataTable<T>({
  columns,
  data,
  getRowKey,
  loading,
  error,
  emptyIcon,
  emptyMessage = 'No hay registros',
  actions,
  pagination,
}: DataTableProps<T>) {
  const breakpoints = useBreakpoints()
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  useEffect(() => {
    setExpandedKey(null)
  }, [pagination?.page])

  const isVisible = (col: Column<T>) => {
    switch (col.hideBelow) {
      case 'sm':
        return breakpoints.sm
      case 'md':
        return breakpoints.md
      case 'lg':
        return breakpoints.lg
      case 'xl':
        return breakpoints.xl
      default:
        return true
    }
  }

  const visibleColumns = columns.filter(isVisible)
  const hiddenColumns = columns.filter((c) => !isVisible(c))
  const expandable = hiddenColumns.length > 0
  const colCount = visibleColumns.length + (expandable ? 1 : 0) + (actions ? 1 : 0)
  const skeletonRows = pagination?.limit ?? 5

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <table className="w-full text-sm table-fixed">
        <thead className="bg-gray-50/80">
          <tr>
            {expandable && <th className="w-10 px-2 py-4" aria-label="Expandir" />}
            {visibleColumns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className={`${alignClass(col.align)} px-3 sm:px-4 lg:px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider ${col.headerClassName ?? ''}`}
              >
                {col.truncate ? <span className="block truncate">{col.header}</span> : col.header}
              </th>
            ))}
            {actions && (
              <th className="text-right px-2 sm:px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Acciones</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            Array.from({ length: skeletonRows }, (_, i) => (
              <tr key={`skeleton-${i}`}>
                {expandable && (
                  <td className="px-2 py-4">
                    <div className="w-5 h-5 rounded-lg bg-gray-100 animate-pulse" />
                  </td>
                )}
                {visibleColumns.map((col) => (
                  <td key={col.key} className="px-3 sm:px-4 lg:px-6 py-4">
                    <div className="h-4 rounded-full bg-gray-100 animate-pulse" style={{ width: `${55 + ((i * 13 + col.key.length * 7) % 35)}%` }} />
                  </td>
                ))}
                {actions && (
                  <td className="px-2 sm:px-6 py-4">
                    <div className="h-4 w-16 ml-auto rounded-full bg-gray-100 animate-pulse" />
                  </td>
                )}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={colCount} className="px-6 py-12 text-center">
                <p className="text-sm font-medium text-red-600">{error}</p>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-6 py-16 text-center text-gray-400">
                {emptyIcon}
                <p className="text-sm">{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const key = getRowKey(row)
              const isExpanded = expandedKey === key
              return (
                <Fragment key={key}>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    {expandable && (
                      <td className="px-2 py-4">
                        <button
                          onClick={() => setExpandedKey(isExpanded ? null : key)}
                          className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors"
                          aria-label={isExpanded ? 'Contraer fila' : 'Expandir fila'}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        style={col.width ? { width: col.width } : undefined}
                        className={`${alignClass(col.align)} px-3 sm:px-4 lg:px-6 py-4 overflow-hidden ${col.cellClassName ?? ''}`}
                      >
                        {col.truncate ? <div className="min-w-0 truncate">{cellValue(row, col)}</div> : cellValue(row, col)}
                      </td>
                    ))}
                    {actions && <td className="px-2 sm:px-6 py-4 text-right">{actions(row)}</td>}
                  </tr>
                  {isExpanded && (
                    <tr className="bg-violet-50/40">
                      <td colSpan={colCount} className="px-6 py-4">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                          {hiddenColumns.map((col) => (
                            <div key={col.key} className="flex items-baseline justify-between gap-4 border-b border-violet-100/70 pb-2">
                              <dt className="text-xs uppercase tracking-wide text-gray-400 font-medium shrink-0">{col.header}</dt>
                              <dd className="text-sm text-gray-700 text-right">{cellValue(row, col)}</dd>
                            </div>
                          ))}
                        </dl>
                      </td>
                    </tr>
                   )}
                 </Fragment>
               )
             })
           )}
        </tbody>
      </table>
      {pagination && !loading && !error && data.length > 0 && <Pagination {...pagination} />}
    </div>
  )
}
