import { useState } from 'react'
import {
  Mail,
  Shield,
  Building2,
  PenLine,
  Loader2,
  Phone,
  MapPin,
  IdCard,
  KeyRound,
  BadgeCheck,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { ROLES } from '../lib/permissions'
import Modal from '../components/Modal'

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function Field({ label, value, icon }: { label: string; value: string | undefined | null; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      {icon && <span className="mt-0.5 text-violet-500">{icon}</span>}
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value || '—'}</p>
      </div>
    </div>
  )
}

const inputClass =
  'w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all focus:outline-none'

export default function Profile() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const updateCompany = useAuthStore((s) => s.updateCompany)
  const loading = useAuthStore((s) => s.loading)

  const [profileOpen, setProfileOpen] = useState(false)
  const [companyOpen, setCompanyOpen] = useState(false)
  const [formError, setFormError] = useState('')

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    document: '',
    phoneNumber: '',
    address: '',
  })

  const openProfileModal = () => {
    setFormError('')
    setProfileForm({
      name: user?.name ?? '',
      email: user?.email ?? '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setProfileOpen(true)
  }

  const openCompanyModal = () => {
    setFormError('')
    setCompanyForm({
      companyName: user?.companyName ?? '',
      document: user?.companyDocument ?? '',
      phoneNumber: user?.companyPhoneNumber ?? '',
      address: user?.companyAddress ?? '',
    })
    setCompanyOpen(true)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!isAdmin && !profileForm.newPassword) {
      setFormError('Debes ingresar una nueva contraseña')
      return
    }
    if (profileForm.newPassword && profileForm.newPassword.length < 6) {
      setFormError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      setFormError('Las contraseñas no coinciden')
      return
    }
    const result = await updateProfile({
      currentPassword: profileForm.currentPassword,
      newPassword: profileForm.newPassword || undefined,
      ...(isAdmin ? { name: profileForm.name, email: profileForm.email } : {}),
    })
    if (result.ok) {
      setProfileOpen(false)
    } else {
      setFormError(result.error || 'Error al actualizar el perfil')
    }
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const result = await updateCompany({
      companyName: companyForm.companyName,
      document: companyForm.document,
      phoneNumber: companyForm.phoneNumber,
      address: companyForm.address,
    })
    if (result.ok) {
      setCompanyOpen(false)
    } else {
      setFormError(result.error || 'Error al actualizar los datos de la empresa')
    }
  }

  const isCompany = user?.companyKind === 'EMPRESA'
  const companyTitle = isCompany ? 'Mi empresa' : 'Mis datos'
  const nameLabel = isCompany ? 'Razón social' : 'Nombre'
  const isAdmin = user?.role === 'admin'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="animate-fade-up">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 p-6 sm:p-8 text-white shadow-xl shadow-violet-500/20">
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-20 -left-10 w-56 h-56 bg-indigo-400/20 rounded-full blur-2xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="shrink-0 flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/15 backdrop-blur border border-white/20 shadow-inner">
              <span className="text-3xl sm:text-4xl font-bold">{user ? initialsOf(user.name) : '—'}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold truncate">{user?.name}</h1>
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/15 border border-white/20 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" />
{ROLES[user?.role ?? 'vendedor'].label}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-violet-100/90 text-sm sm:text-base">
                <Mail className="w-4 h-4" />
                {user?.email}
              </p>
              {user?.companyName && (
                <p className="mt-0.5 flex items-center gap-1.5 text-violet-100/80 text-sm">
                  <BadgeCheck className="w-4 h-4" />
                  {user.companyName}
                  <span className="text-xs text-violet-200/80">· {isCompany ? 'Empresa' : 'Persona'}</span>
                </p>
              )}
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={openProfileModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-violet-700 text-sm font-semibold hover:bg-violet-50 transition-all active:scale-[0.97] shadow-lg cursor-pointer"
              >
                <PenLine className="w-4 h-4" />
                {isAdmin ? 'Editar perfil' : 'Cambiar contraseña'}
              </button>
              {isAdmin && (
                <button
                  onClick={openCompanyModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 border border-white/25 text-white text-sm font-semibold hover:bg-white/25 transition-all active:scale-[0.97] cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  Editar empresa
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="animate-fade-up lg:col-span-2" style={{ animationDelay: '60ms' }}>
          <div className="bg-card border border-border rounded-3xl shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-foreground">Información personal</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Datos de acceso a tu cuenta.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 divide-y divide-gray-100">
              <Field label="Nombre completo" value={user?.name} />
              <Field label="Email" value={user?.email} icon={<Mail className="w-4 h-4" />} />
              <Field label="Rol" value={ROLES[user?.role ?? 'vendedor'].label} />
              <Field label="ID de usuario" value={user?.id ? `#${user.id}` : '—'} />
            </div>
            <div className="mt-6 pt-5 border-t border-border">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-violet-500">
                  <KeyRound className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Contraseña</p>
                  <p className="text-sm text-gray-600">
                    ••••••••{' '}
                    <button
                      type="button"
                      onClick={openProfileModal}
                      className="ml-1 text-violet-600 hover:text-violet-700 font-medium transition-colors"
                    >
                      Cambiar contraseña
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-fade-up lg:col-span-1" style={{ animationDelay: '120ms' }}>
          <div className="bg-card border border-border rounded-3xl shadow-sm p-6 sm:p-8 h-full">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-violet-500" />
              <h2 className="text-lg font-bold text-foreground">{companyTitle}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {isCompany ? 'Datos fiscales y de contacto de tu negocio.' : 'Tus datos de contacto.'}
            </p>
            <div className="divide-y divide-gray-100">
              <Field label={nameLabel} value={user?.companyName} />
              <Field label={isCompany ? 'NIT' : 'Documento'} value={user?.companyDocument} icon={<IdCard className="w-4 h-4" />} />
              <Field label="Teléfono" value={user?.companyPhoneNumber} icon={<Phone className="w-4 h-4" />} />
              <Field label="Dirección" value={user?.companyAddress} icon={<MapPin className="w-4 h-4" />} />
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={profileOpen} onClose={() => setProfileOpen(false)} title={isAdmin ? 'Editar perfil' : 'Cambiar contraseña'} size="md">
        {formError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">{formError}</div>
        )}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          {isAdmin ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
                <input
                  required
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  required
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className={inputClass}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600 -mb-2">
              Solo puedes actualizar tu contraseña. Para cambiar tu nombre o email, contacta al administrador.
            </p>
          )}
          <div className="pt-3 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña actual *</label>
            <input
              required
              type="password"
              value={profileForm.currentPassword}
              onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
              placeholder="Necesaria para guardar cambios"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nueva contraseña</label>
              <input
                type="password"
                value={profileForm.newPassword}
                onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar contraseña</label>
              <input
                type="password"
                value={profileForm.confirmPassword}
                onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                placeholder="Repite la contraseña"
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setProfileOpen(false)}
              className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar cambios
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={companyOpen} onClose={() => setCompanyOpen(false)} title={`Editar ${companyTitle.toLowerCase()}`} size="md">
        {formError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">{formError}</div>
        )}
        <form onSubmit={handleCompanySubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{nameLabel}</label>
            <input
              required
              type="text"
              value={companyForm.companyName}
              onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{isCompany ? 'NIT' : 'Documento'}</label>
              <input
                type="text"
                value={companyForm.document}
                onChange={(e) => setCompanyForm({ ...companyForm, document: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
              <input
                type="text"
                value={companyForm.phoneNumber}
                onChange={(e) => setCompanyForm({ ...companyForm, phoneNumber: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección</label>
            <input
              type="text"
              value={companyForm.address}
              onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setCompanyOpen(false)}
              className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/25 text-sm font-medium disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar cambios
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}