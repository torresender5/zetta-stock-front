import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  Eye,
  Loader2,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react'
import Modal from '../components/Modal'
import { subscriptionService } from '../services/subscriptionService'
import { VIEW_LABELS } from '../lib/permissions'
import { formatCurrency } from '../lib/utils'
import type { Plan } from '../types'

type ViewKey = keyof typeof VIEW_LABELS

interface PlanForm {
  name: string
  key: string
  description: string
  priceMonthly: string
  priceYearly: string
  maxUsers: string
  trialDays: string
  sortOrder: string
  active: boolean
  features: string
  allowedViews: ViewKey[]
}

const emptyForm: PlanForm = {
  name: '',
  key: '',
  description: '',
  priceMonthly: '0',
  priceYearly: '0',
  maxUsers: '1',
  trialDays: '',
  sortOrder: '0',
  active: true,
  features: '',
  allowedViews: [],
}

function toForm(plan: Plan): PlanForm {
  return {
    name: plan.name,
    key: plan.key,
    description: plan.description ?? '',
    priceMonthly: String(plan.priceMonthly),
    priceYearly: String(plan.priceYearly),
    maxUsers: String(plan.maxUsers),
    trialDays: plan.trialDays != null ? String(plan.trialDays) : '',
    sortOrder: String(plan.sortOrder),
    active: plan.active,
    features: (plan.features ?? []).join('\n'),
    allowedViews: ((plan.allowedViews ?? []) as ViewKey[]).filter(
      (v) => v in VIEW_LABELS,
    ),
  }
}

export default function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<PlanForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setPlans(await subscriptionService.getAllPlans())
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los planes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (plan: Plan) => {
    setEditingId(plan.id)
    setForm(toForm(plan))
    setModalOpen(true)
  }

  const setField = (field: keyof PlanForm, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const toggleView = (view: ViewKey) => {
    setForm((f) => ({
      ...f,
      allowedViews: f.allowedViews.includes(view)
        ? f.allowedViews.filter((v) => v !== view)
        : [...f.allowedViews, view],
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        priceMonthly: Number(form.priceMonthly) || 0,
        priceYearly: Number(form.priceYearly) || 0,
        maxUsers: Number(form.maxUsers) || 1,
        trialDays: form.trialDays === '' ? null : Number(form.trialDays),
        sortOrder: Number(form.sortOrder) || 0,
        active: form.active,
        features: form.features
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        allowedViews: form.allowedViews,
      }
      if (editingId != null) {
        await subscriptionService.updatePlan(editingId, payload)
      } else {
        await subscriptionService.createPlan({ key: form.key, ...payload })
      }
      setModalOpen(false)
      setNotice(
        editingId != null
          ? 'Plan actualizado correctamente'
          : 'Plan creado correctamente',
      )
      await load()
    } catch (err: any) {
      const msg =
        typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : 'Error al guardar el plan'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (plan: Plan) => {
    if (!window.confirm(`¿Eliminar el plan "${plan.name}"?`)) return
    try {
      await subscriptionService.deletePlan(plan.id)
      setNotice('Plan eliminado')
      await load()
    } catch (err: any) {
      const msg =
        typeof err.response?.data?.message === 'string'
          ? err.response.data.message
          : 'Error al eliminar el plan'
      setError(msg)
    }
  }

  const viewCount = useMemo(() => Object.keys(VIEW_LABELS).length, [])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-violet-600" /> Gestión de planes
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra los planes del catálogo y su disponibilidad.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2.5 rounded-2xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nuevo plan
        </button>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-sm font-medium flex items-center gap-2">
          <Check className="w-4 h-4" /> {notice}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-card border rounded-3xl p-6 shadow-sm ${
                plan.active ? 'border-border' : 'border-dashed border-gray-300 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-foreground">{plan.name}</h3>
                  <p className="text-xs font-mono text-muted-foreground">{plan.key}</p>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    plan.active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}
                >
                  {plan.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {plan.description}
              </p>
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide">Mensual</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatCurrency(plan.priceMonthly)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide">Anual</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatCurrency(plan.priceYearly)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide">Usuarios</span>
                  <span className="font-medium">{plan.maxUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Vistas
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Eye className="w-3.5 h-3.5 text-violet-500" />
                    {(plan.allowedViews ?? []).length}/{viewCount}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => openEdit(plan)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => void handleDelete(plan)}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                  aria-label={`Eliminar ${plan.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId != null ? 'Editar plan' : 'Nuevo plan'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Nombre
              </label>
              <input
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Clave (única)
              </label>
              <input
                value={form.key}
                disabled={editingId != null}
                onChange={(e) => setField('key', e.target.value)}
                placeholder="free, basico, pro"
                className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Mensual (COP)
              </label>
              <input
                type="number"
                value={form.priceMonthly}
                onChange={(e) => setField('priceMonthly', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Anual (COP)
              </label>
              <input
                type="number"
                value={form.priceYearly}
                onChange={(e) => setField('priceYearly', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                máx. usuarios
              </label>
              <input
                type="number"
                value={form.maxUsers}
                onChange={(e) => setField('maxUsers', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Días prueba
              </label>
              <input
                type="number"
                value={form.trialDays}
                onChange={(e) => setField('trialDays', e.target.value)}
                placeholder="—"
                className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Beneficios (uno por línea)
            </label>
            <textarea
              value={form.features}
              onChange={(e) => setField('features', e.target.value)}
              rows={4}
              className="w-full px-3.5 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">
              Vistas permitidas por el plan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(VIEW_LABELS) as ViewKey[]).map((view) => {
                const active = form.allowedViews.includes(view)
                return (
                  <button
                    key={view}
                    type="button"
                    onClick={() => toggleView(view)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-sm transition-colors cursor-pointer ${
                      active
                        ? 'border-violet-300 bg-violet-50 text-violet-700'
                        : 'border-border text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        active ? 'bg-violet-600 border-violet-600' : 'border-gray-300'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 text-white" />}
                    </span>
                    {VIEW_LABELS[view]}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setField('active', e.target.checked)}
                className="w-4 h-4 accent-violet-600"
              />
              Plan activo en el catálogo
            </label>
            <div className="flex items-center gap-2 w-28">
              <label className="text-xs font-semibold text-muted-foreground">
                Orden
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setField('sortOrder', e.target.value)}
                className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          {error && (
            <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 py-3 rounded-2xl bg-muted text-foreground font-semibold text-sm hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              disabled={saving || !form.name || (!editingId && !form.key)}
              onClick={() => void handleSave()}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId != null ? 'Guardar cambios' : 'Crear plan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}