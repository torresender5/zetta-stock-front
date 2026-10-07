import api from '../lib/api'
import type { DashboardSummaryReport } from '../types'

export interface DashboardSummaryParams {
  startDate?: string
  endDate?: string
  excludeCancelled?: boolean
}

/**
 * Resumen agregado del dashboard (ventas, top productos y top clientes).
 * Consumido por Dashboard.tsx en reemplazo de descargar todas las ventas.
 */
export const dashboardService = {
  getSummary: async (params: DashboardSummaryParams = {}): Promise<DashboardSummaryReport> => {
    const { data } = await api.get<DashboardSummaryReport>('/dashboard/summary', {
      params: {
        ...(params.startDate ? { startDate: params.startDate } : {}),
        ...(params.endDate ? { endDate: params.endDate } : {}),
        ...(params.excludeCancelled ? { excludeCancelled: 'true' } : {}),
      },
    })
    return data
  },
}
