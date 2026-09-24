import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Calendar, XCircle, Eye, CheckCircle, HandCoins } from 'lucide-react'
import { usePurchaseStore } from '../stores/purchaseStore'
import { purchaseService } from '../services/purchaseService'
import { formatCurrency, formatDateOnly } from '../lib/utils'
import DataTable from '../components/DataTable'
import ActionDropdown from '../components/ActionDropdown'
import type { Column } from '../components/DataTable/types'
import type { Purchase, PaginationMeta } from '../types'

const columns: Column<Purchase>[] = [
  {
    key: 'purchaseNumber',
    header: 'N° Compra',
    width: '8rem',
    render: (p) =>
      p.purchaseNumber ? (
        <span className="font-mono font-medium text-blue-600">{p.purchaseNumber}</span>
      ) : (
        <span className="text-gray-300">—</span>
      ),
  },
  {
    key: 'supplier',
    header: 'Proveedor',
    cellClassName: 'font-medium text-gray-900',
    truncate: true,
    render: (p) => p.supplier?.name ?? 'Sin proveedor',
  },
  {
    key: 'date',
    header: 'Fecha',
    hideBelow: 'sm',
    cellClassName: 'text-gray-500',
    render: (p) => formatDateOnly(p.date),
  },
  {
    key: 'items',
    header: 'Productos',
    align: 'right',
    hideBelow: 'md',
    render: (p) => p.items.length,
  },
  {
    key: 'subtotal',
    header: 'Subtotal',
    align: 'right',
    hideBelow: 'lg',
    render: (p) => formatCurrency(p.subtotal),
  },
  {
    key: 'total',
    header: 'Total',
    align: 'right',
    width: '6.5rem',
    cellClassName: 'font-medium',
    render: (p) => formatCurrency(p.total),
  },
]

export default function AccountsPayable() {
  const updatePurchasePaymentStatus = usePurchaseStore(
    (s) => s.updatePurchasePaymentStatus,
  )
  const navigate = useNavigate()

  const [rows, setRows] = useState<Purchase[]>([])
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pendingTotal, setPendingTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTable()
  }, [page, limit, search, startDate, endDate])

  useEffect(() => {
    loadTotal()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== search) {
        setSearch(searchInput)
        setPage(1)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const loadTable = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, meta: resultMeta } = await purchaseService.getAll({
        page,
        limit,
        search: search || undefined,
        paymentStatus: 'pending',
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      setRows(data)
      setMeta(resultMeta)
    } catch {
      setError('Error al cargar cuentas por pagar')
    } finally {
      setLoading(false)
    }
  }

  const loadTotal = async () => {
    let total = 0
    let currentPage = 1
    let totalPages = 1
    do {
      try {
        const { data, meta: resultMeta } = await purchaseService.getAll({
          page: currentPage,
          limit: 100,
          paymentStatus: 'pending',
        })
        total += data.reduce((sum, p) => sum + p.total, 0)
        totalPages = resultMeta.totalPages
        currentPage += 1
      } catch {
        return
      }
    } while (currentPage <= totalPages)
    setPendingTotal(total)
  }

  const markAsPaid = async (id: string) => {
    try {
      await updatePurchasePaymentStatus(id, 'paid')
      await loadTable()
      await loadTotal()
    } catch {
      // El error ya se registra en el store
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuentas por Pagar</h1>
          <p className="text-sm text-gray-500 mt-1">{meta.total} compra(s) pendiente(s)</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total adeudado</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(pendingTotal)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por proveedor o producto..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border-0 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setPage(1)
            }}
            placeholder="Fecha inicio"
            className="bg-white border-0 rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm transition-all"
          />
          <span className="text-gray-400 text-sm">hasta</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setPage(1)
            }}
            placeholder="Fecha fin"
            className="bg-white border-0 rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm transition-all"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate('')
              setEndDate('')
              setPage(1)
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Limpiar fechas
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(p) => p.id}
        loading={loading && rows.length === 0}
        emptyIcon={<HandCoins className="w-10 h-10 mx-auto mb-3 opacity-40" />}
        emptyMessage="No hay cuentas por pagar pendientes"
        pagination={{
          page,
          limit,
          total: meta.total,
          totalPages: meta.totalPages,
          onPageChange: setPage,
          onLimitChange: (l) => {
            setLimit(l)
            setPage(1)
          },
        }}
        actions={(p) => (
          <div className="flex justify-end gap-1">
            <ActionDropdown
              actions={[
                {
                  label: 'Ver detalle',
                  icon: <Eye className="w-4 h-4" />,
                  onClick: () => navigate(`/purchases/${p.id}`),
                },
                {
                  label: 'Marcar pagado',
                  icon: <CheckCircle className="w-4 h-4" />,
                  className: 'text-green-600',
                  onClick: () => markAsPaid(p.id),
                },
              ]}
            />
          </div>
        )}
      />
    </div>
  )
}