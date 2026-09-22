import axios from 'axios'
import { API_BASE_URL } from '../lib/api'
import { saveAdminSession, encodeBasic } from '../lib/adminAuth'

export async function verifyAdmin(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const encoded = encodeBasic(email, password)
  try {
    await axios.get(`${API_BASE_URL}admin/plans`, {
      headers: { Authorization: `Basic ${encoded}` },
    })
    saveAdminSession(email, password)
    return { ok: true }
  } catch (err: any) {
    const message =
      err.response?.status === 401
        ? 'Credenciales inválidas'
        : 'No se pudo verificar el acceso'
    return { ok: false, error: message }
  }
}