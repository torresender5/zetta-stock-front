export type Role = 'admin' | 'vendedor' | 'inventario'

export const ROLES: Record<Role, { label: string }> = {
  admin: { label: 'Administrador' },
  vendedor: { label: 'Vendedor' },
  inventario: { label: 'Inventario' },
}

export type ViewKey =
  | 'dashboard'
  | 'caja'
  | 'products'
  | 'clients'
  | 'suppliers'
  | 'purchases'
  | 'sales'
  | 'invoices'
  | 'apartados'
  | 'accountsPayable'
  | 'accountsReceivable'
  | 'reports'
  | 'users'
  | 'profile'
  | 'suscripcion'

export const VIEW_ROLES: Record<ViewKey, Role[]> = {
  dashboard: ['admin', 'vendedor', 'inventario'],
  caja: ['admin', 'vendedor'],
  products: ['admin', 'inventario'],
  clients: ['admin', 'vendedor'],
  suppliers: ['admin', 'inventario'],
  purchases: ['admin', 'inventario'],
  sales: ['admin', 'vendedor'],
  invoices: ['admin', 'vendedor'],
  apartados: ['admin', 'vendedor'],
  accountsPayable: ['admin', 'inventario'],
  accountsReceivable: ['admin', 'vendedor'],
  reports: ['admin', 'vendedor', 'inventario'],
  users: ['admin'],
  profile: ['admin', 'vendedor', 'inventario'],
  suscripcion: ['admin', 'vendedor', 'inventario'],
}

export function can(role: Role | undefined, view: ViewKey): boolean {
  if (!role) return false
  return VIEW_ROLES[view].includes(role)
}

export type ModuleKey =
  | 'products'
  | 'clients'
  | 'suppliers'
  | 'purchases'
  | 'sales'
  | 'invoices'

export const MODULE_READ_ROLES: Record<ModuleKey, Role[]> = {
  // El catálogo de productos es visible también para vendedores (necesario
  // para registrar ventas) aunque la gestión del módulo sea de inventario.
  products: ['admin', 'inventario', 'vendedor'],
  clients: ['admin', 'vendedor'],
  suppliers: ['admin', 'inventario'],
  purchases: ['admin', 'inventario'],
  sales: ['admin', 'vendedor'],
  invoices: ['admin', 'vendedor'],
}

export function canReadModule(
  role: Role | undefined,
  module: ModuleKey,
): boolean {
  if (!role) return false
  return MODULE_READ_ROLES[module].includes(role)
}

// ---------------- Restricción de vistas por plan ----------------

export const DEFAULT_PLAN_VIEWS: Record<string, ViewKey[]> = {
  free: [
    'dashboard',
    'products',
    'clients',
    'suppliers',
    'purchases',
    'sales',
    'invoices',
    'accountsPayable',
    'accountsReceivable',
    'profile',
    'suscripcion',
  ],
  basico: [
    'dashboard',
    'caja',
    'products',
    'clients',
    'suppliers',
    'purchases',
    'sales',
    'invoices',
    'accountsPayable',
    'accountsReceivable',
    'reports',
    'users',
    'profile',
    'suscripcion',
  ],
  pro: [
    'dashboard',
    'caja',
    'products',
    'clients',
    'suppliers',
    'purchases',
    'sales',
    'invoices',
    'apartados',
    'accountsPayable',
    'accountsReceivable',
    'reports',
    'users',
    'profile',
    'suscripcion',
  ],
}

export interface PlanAccessInfo {
  key?: string | null
  allowedViews?: string[] | null
}

export function planAllows(
  plan: PlanAccessInfo | null | undefined,
  view: ViewKey,
): boolean {
  if (plan?.allowedViews && plan.allowedViews.length > 0) {
    return plan.allowedViews.includes(view)
  }
  return DEFAULT_PLAN_VIEWS[plan?.key ?? 'free']?.includes(view) ?? true
}

export function canView(
  role: Role | undefined,
  view: ViewKey,
  plan?: PlanAccessInfo | null,
): boolean {
  if (!can(role, view)) return false
  return planAllows(plan, view)
}

export const VIEW_LABELS: Record<ViewKey, string> = {
  dashboard: 'Dashboard',
  caja: 'Caja',
  products: 'Productos',
  clients: 'Clientes',
  suppliers: 'Proveedores',
  purchases: 'Compras',
  sales: 'Ventas',
  invoices: 'Facturas',
  apartados: 'Apartados',
  accountsPayable: 'Cuentas por pagar',
  accountsReceivable: 'Cuentas por cobrar',
  reports: 'Reportes',
  users: 'Usuarios',
  profile: 'Mi perfil',
  suscripcion: 'Suscripción',
}