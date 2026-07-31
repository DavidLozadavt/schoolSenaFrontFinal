import axios from 'axios';
import { PaginatedResponse } from './seguimientoAspirantesService';

export interface StatsFilterParams {
  fecha_desde?: string;
  fecha_hasta?: string;
  programa?: string;
  ficha?: string;
  centro_formacion?: string;
  estado?: string;
  plantilla?: string;
}

export interface MessageRow {
  id: number;
  nombre: string;
  apellido: string;
  celular: string;
  programa: string;
  ficha: string;
  centro_formacion: string;
  ultimaPlantilla: string | null;
  estadoEnvio: string | null;
  errorEnvio: string | null;
  waMessageId: string | null;
  ultimo_envio: string | null;
}

export interface Kpis {
  enviados: number;
  entregados: number;
  leidos: number;
  errores: number;
}

export interface DashboardData {
  kpis: Kpis;
  porDia: { fecha: string; total: number }[];
  porPrograma: { programa: string; total: number }[];
  porFicha: { ficha: string; total: number }[];
  plantillasMasUsadas: { plantilla: string; total: number }[];
  estadosDistribucion: { estado: string; total: number }[];
}

const API_PATH = 'sena/message-statistics';

export const messageStatisticsService = {
  getListado: async (params: StatsFilterParams & { page?: number; per_page?: number }): Promise<PaginatedResponse<MessageRow>> => {
    const response = await axios.get<PaginatedResponse<MessageRow>>(API_PATH, { params });
    return response.data;
  },

  getDashboard: async (params: StatsFilterParams): Promise<DashboardData> => {
    const response = await axios.get<DashboardData>(`${API_PATH}/dashboard`, { params });
    return response.data;
  },

  exportar: async (params: StatsFilterParams, formato: 'excel' | 'pdf'): Promise<Blob> => {
    const response = await axios.get(`${API_PATH}/export/${formato}`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
