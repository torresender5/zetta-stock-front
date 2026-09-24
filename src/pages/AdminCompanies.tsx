import { useEffect, useState } from 'react'
import {
  Building2,
  Eye,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Users,
} from 'lucide-react'
import { adminService } from '../services/adminService'
import { formatCurrency } from '../lib/utils'
import Modal from '../components/Modal'
import type { AdminCompany, AdminCompanyDetail } from '../types'

const kindLabel = (kind: string) => (kind === 'EMPRESA' ? 'Empresa' : 'Persona')

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<AdminCompanyDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = async (term?: string) => {
    setLoading(true)
    setError(null)
    try {
      setCompanies(await adminService.getCompanies(term || undefined))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar las empresas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      void load(search)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  const toggleStatus = async (company: AdminCompany) => {
    const next = !company.active
    const action = next ? 'activar' : 'desactivar'
    if (!confirm(`¿${action === 'activar' ? 'Activar' : 'Desactivar'} la empresa "${company.name}"?`)) {
      return
    }
    setError(null)
    setNotice(null)
    try {
      await adminService.setCompanyStatus(company.id, next)
      setNotice(`Empresa ${action}da correctamente`)
      await load(search)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar el estado')
    }
  }

  const openDetail = async (id: number) => {
    setDetailLoading(true)
    setDetail(null)
    setError(null)
    try {
      setDetail(await adminService.getCompanyDetail(id))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el detalle')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-violet-600" /> Empresas
        </h1>
        <p className="text-sm text-muted-foreground">
          Todas las empresas registradas y su estado.
        </p>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-sm font-medium">
          {notice}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre de empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-10 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No hay empresas</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="px-6 py-3.5 font-medium">Empresa</th>
                  <th className="px-6 py-3.5 font-medium">Plan</th>
                  <th className="px-6 py-3.5 font-medium">Usuarios</th>
                  <th className="px-6 py-3.5 font-medium">Ventas</th>
                  <th className="px-6 py-3.5 font-medium">Última venta</th>
                  <th className="px-6 py-3.5 font-medium">Estado</th>
                  <th className="px-6 py-3.5 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-b border-border/60 last:border-0">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">{company.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {kindLabel(company.kind)} · Registrada{' '}
                        {new Date(company.createdAt).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {company.plan ? (
                        <span className="font-medium text-foreground">{company.plan.name}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground tabular-nums">
                      {company.usersCount}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground tabular-nums">
                      {company.salesCount}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {company.lastSaleAt ? (
                        <>
                          {formatCurrency(company.lastSaleTotal ?? 0)}
                          <span className="block text-xs text-muted-foreground/70">
                            {new Date(company.lastSaleAt).toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </>
                      ) : (
                        'Sin ventas'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                          company.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}
                      >
                        {company.active ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : (
                          <ShieldX className="w-3 h-3" />
                        )}
                        {company.active ? 'Activa' : 'Desactivada'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => void openDetail(company.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver
                        </button>
                        <button
                          onClick={() => void toggleStatus(company)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                            company.active
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {company.active ? <ShieldX className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          {company.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={detail !== null || detailLoading}
        onClose={() => setDetail(null)}
        title={detail ? detail.name : 'Cargando…'}
        size="xl"
      >
        {detailLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : detail ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { label: 'Productos', value: detail._count.products },
                { label: 'Clientes', value: detail._count.clients },
                { label: 'Ventas', value: detail._count.sales },
                { label: 'Compras', value: detail._count.purchases },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-2xl py-4">
                  <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-500" /> Usuarios ({detail.users.length})
              </h3>
              {detail.users.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin usuarios</p>
              ) : (
                <div className="space-y-1">
                  {detail.users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase">
                        {user.role} {user.active ? '' : '· inactivo'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Últimas ventas</h3>
              {detail.lastSales.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin ventas registradas</p>
              ) : (
                <div className="space-y-1">
                  {detail.lastSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50">
                      <p className="text-sm text-foreground">{sale.clientName}</p>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground tabular-nums">
                          {formatCurrency(sale.total)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sale.date).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}