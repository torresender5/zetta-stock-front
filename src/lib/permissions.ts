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
  | 'users'
  | 'profile'

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
  users: ['admin'],
  profile: ['admin', 'vendedor', 'inventario'],
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

export function can(role: Role | undefined, view: ViewKey): boolean {
  if (!role) return false
  return VIEW_ROLES[view].includes(role)
}

export function canReadModule(
  role: Role | undefined,
  module: ModuleKey,
): boolean {
  if (!role) return false
  return MODULE_READ_ROLES[module].includes(role)
}