import { useEffect, useState } from 'react'
import {
  Building2,
  Loader2,
  Upload,
  Trash2,
  Percent,
  Coins,
  Hash,
  FileText,
  ReceiptText,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { authService, type CompanySettings } from '../services/authService'

const inputClass =
  'w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none'

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-card border border-border rounded-3xl shadow-sm p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-violet-500">{icon}</span>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      <p className="text-sm text-gray-500 mb-5">{description}</p>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}
    </label>
  )
}

export default function Settings() {
  const updateCompany = useAuthStore((s) => s.updateCompany)
  const loading = useAuthStore((s) => s.loading)

  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [form, setForm] = useState({
    companyName: '',
    document: '',
    phoneNumber: '',
    address: '',
    currency: 'USD',
    taxRate: '19',
    invoicePrefix: 'FAC',
    salePrefix: 'VEN',
  })

  useEffect(() => {
    let active = true
    authService
      .getCompany()
      .then((company) => {
        if (!active) return
        setSettings(company)
        setForm({
          companyName: company.name ?? '',
          document: company.document ?? '',
          phoneNumber: company.phoneNumber ?? '',
          address: company.address ?? '',
          currency: company.currency || 'USD',
          taxRate: String(company.taxRate ?? 19),
          invoicePrefix: company.invoicePrefix || 'FAC',
          salePrefix: company.salePrefix || 'VEN',
        })
      })
      .catch(() => {
        if (active) setError('No se pudo cargar la configuración')
      })
      .finally(() => {
        if (active) setFetching(false)
      })
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    const taxRate = Number(form.taxRate)
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
      setError('El % de IVA debe estar entre 0 y 100')
      return
    }
    setSaving(true)
    const result = await updateCompany({
      companyName: form.companyName,
      document: form.document,
      phoneNumber: form.phoneNumber,
      address: form.address,
      currency: form.currency as 'USD' | 'VES',
      taxRate,
      invoicePrefix: form.invoicePrefix,
      salePrefix: form.salePrefix,
    })
    setSaving(false)
    if (result.ok) {
      setNotice('Configuración guardada')
      setTimeout(() => setNotice(''), 3000)
    } else {
      setError(result.error || 'Error al guardar la configuración')
    }
  }

  const handleLogoChange = async (file: File | undefined) => {
    if (!file) return
    setError('')
    setNotice('')
    setUploading(true)
    try {
      const { logoUrl } = await authService.uploadCompanyLogo(file)
      setSettings((prev) => (prev ? { ...prev, logoUrl } : prev))
      setNotice('Logo actualizado')
      setTimeout(() => setNotice(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al subir el logo')
    } finally {
      setUploading(false)
    }
  }

  const handleLogoRemove = async () => {
    setError('')
    setNotice('')
    setUploading(true)
    try {
      await authService.removeCompanyLogo()
      setSettings((prev) => (prev ? { ...prev, logoUrl: null } : prev))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el logo')
    } finally {
      setUploading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  const isCompany = settings?.kind === 'EMPRESA'
  const nameLabel = isCompany ? 'Razón social' : 'Nombre'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">
          Datos fiscales, moneda, impuestos y numeración de tu negocio.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">
          {error}
        </div>
      )}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl p-3">
          {notice}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section
          title="Datos fiscales"
          description="Aparecen en tus facturas y documentos."
          icon={<Building2 className="w-5 h-5" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{nameLabel}</Label>
              <input
                required
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <Label>{isCompany ? 'NIT' : 'Documento'}</Label>
              <input
                type="text"
                value={form.document}
                onChange={(e) => setForm({ ...form, document: e.target.value })}
                placeholder="000000000-0"
                className={inputClass}
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <input
                type="text"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <Label>Dirección</Label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-border">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-24 h-24 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                {settings?.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt="Logo de la empresa"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium cursor-pointer w-fit">
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {settings?.logoUrl ? 'Cambiar logo' : 'Subir logo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => handleLogoChange(e.target.files?.[0])}
                  />
                </label>
                {settings?.logoUrl && (
                  <button
                    type="button"
                    onClick={handleLogoRemove}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-xl transition-colors w-fit cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Quitar logo
                  </button>
                )}
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Facturación"
          description="Moneda base, impuestos y numeración de los documentos."
          icon={<ReceiptText className="w-5 h-5" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Moneda base</Label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className={`${inputClass} pl-9 cursor-pointer`}
                >
                  <option value="USD">USD — Dólar</option>
                  <option value="VES">VES — Bolívar</option>
                </select>
              </div>
            </div>
            <div>
              <Label>% IVA</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={form.taxRate}
                  onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                  className={`${inputClass} pl-9`}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Se aplica en ventas, compras y apartados.
              </p>
            </div>
            <div>
              <Label>Prefijo de facturas</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  maxLength={10}
                  value={form.invoicePrefix}
                  onChange={(e) =>
                    setForm({ ...form, invoicePrefix: e.target.value.toUpperCase() })
                  }
                  className={`${inputClass} pl-9`}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Ej. <span className="font-mono">FAC-2026-0001</span>
              </p>
            </div>
            <div>
              <Label>Prefijo de ventas</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  maxLength={10}
                  value={form.salePrefix}
                  onChange={(e) =>
                    setForm({ ...form, salePrefix: e.target.value.toUpperCase() })
                  }
                  className={`${inputClass} pl-9`}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Ej. <span className="font-mono">VEN-2026-0001</span>
              </p>
            </div>
          </div>
        </Section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50 cursor-pointer"
          >
            {saving || loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Guardar configuración
          </button>
        </div>
      </form>
    </div>
  )
}
