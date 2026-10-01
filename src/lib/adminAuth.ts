const ADMIN_AUTH_KEY = 'admin-auth'

export interface AdminSession {
  email: string
}

export function encodeBasic(email: string, password: string): string {
  return btoa(`${email}:${password}`)
}

export function getAdminSession(): AdminSession | null {
  const raw = sessionStorage.getItem(ADMIN_AUTH_KEY)
  if (!raw) return null
  try {
    const decoded = atob(raw)
    const sep = decoded.indexOf(':')
    if (sep === -1) return null
    return { email: decoded.slice(0, sep) }
  } catch {
    return null
  }
}

export function isAdminAuthenticated(): boolean {
  return !!sessionStorage.getItem(ADMIN_AUTH_KEY)
}

export function saveAdminSession(email: string, password: string): void {
  // sessionStorage: las credenciales Basic no persisten tras cerrar la pestaña.
  sessionStorage.setItem(ADMIN_AUTH_KEY, encodeBasic(email, password))
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_AUTH_KEY)
  // Limpieza de claves antiguas que se guardaban en localStorage.
  localStorage.removeItem(ADMIN_AUTH_KEY)
}
