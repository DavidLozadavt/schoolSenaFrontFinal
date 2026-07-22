import axios from 'axios';

export interface GetAspirantesParams {
  page?: number;
  per_page?: number;
  programa?: string;
  centro_formacion?: string;
  ficha?: string;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  nombre?: string;
  celular?: string;
}

export interface Aspirante {
  id: number;
  nombre: string;
  apellido: string;
  celular: string;
  correo: string | null;
  centro_formacion: string;
  programa: string;
  ficha: string;
  fecha_registro_excel: string | null;
  estado: string;
  respuesta: string | null;
  fechaRespuesta: string | null;
  waMessageId: string | null;
  estadoEnvio: string | null;
  errorEnvio: string | null;
  ultimo_envio: string | null;
  cantidad_envios: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: any[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface ImportResult {
  message: string;
  imported: number;
  errored: number;
  errors: {
    fila: number;
    aspirante: string;
    detalles: string[];
  }[];
}

export interface WhatsappPlantilla {
  id: number;
  nombre: string;
  mensaje: string;
  created_at?: string;
  updated_at?: string;
}

const API_PATH = 'seguimiento-aspirantes';

export const seguimientoAspirantesService = {
  /**
   * Fetch paginated list of applicants with filters.
   */
  getAspirantes: async (params: GetAspirantesParams): Promise<PaginatedResponse<Aspirante>> => {
    const response = await axios.get<PaginatedResponse<Aspirante>>(API_PATH, { params });
    return response.data;
  },

  /**
   * Import applicants from a .xlsx file.
   */
  importarAspirantes: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('archivo', file);
    const response = await axios.post<ImportResult>(`${API_PATH}/importar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get unique programs.
   */
  getProgramas: async (): Promise<string[]> => {
    const response = await axios.get<string[]>(`${API_PATH}/programas`);
    return response.data;
  },

  /**
   * Get unique centers.
   */
  getCentros: async (): Promise<string[]> => {
    const response = await axios.get<string[]>(`${API_PATH}/centros`);
    return response.data;
  },

  /**
   * Get unique fichas.
   */
  getFichas: async (): Promise<string[]> => {
    const response = await axios.get<string[]>(`${API_PATH}/fichas`);
    return response.data;
  },

  /**
   * Delete selected records.
   */
  eliminarAspirantes: async (ids: number[]): Promise<{ message: string }> => {
    const response = await axios.post<{ message: string }>(`${API_PATH}/eliminar`, { ids });
    return response.data;
  },

  /**
   * Delete all records.
   */
  eliminarTodos: async (): Promise<{ message: string }> => {
    const response = await axios.delete<{ message: string }>(`${API_PATH}/todos`);
    return response.data;
  },

  /**
   * Send WhatsApp campaign to selected applicants.
   * El backend usa SIEMPRE la plantilla oficial `seguimiento_interes_programa_sena_v2`
   * con las 4 variables (nombre, programa, ficha, centro). Solo se envían los ids.
   */
  enviarWhatsApp: async (ids: number[]): Promise<{ message: string; enviados: number; fallidos: number; errores: { id: number; error: string }[] }> => {
    const response = await axios.post(`${API_PATH}/enviar-whatsapp`, { ids });
    return response.data;
  },

  /**
   * Exporta el listado de aspirantes (PDF o Excel/CSV) según filtros.
   * Devuelve el archivo como Blob para descargar/abrir en el navegador.
   */
  exportar: async (
    params: GetAspirantesParams & { estadoDocumental?: string; formato: 'pdf' | 'excel' }
  ): Promise<Blob> => {
    const response = await axios.get(`${API_PATH}/exportar`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get all WhatsApp templates from database.
   */
  getPlantillas: async (): Promise<WhatsappPlantilla[]> => {
    const response = await axios.get<WhatsappPlantilla[]>('whatsapp-plantillas');
    return response.data;
  },

  /**
   * Add a new WhatsApp template to the database.
   */
  crearPlantilla: async (nombre: string, mensaje: string): Promise<WhatsappPlantilla> => {
    const response = await axios.post<WhatsappPlantilla>('whatsapp-plantillas', { nombre, mensaje });
    return response.data;
  },

  /**
   * Delete a WhatsApp template from the database.
   */
  eliminarPlantilla: async (id: number): Promise<{ message: string }> => {
    const response = await axios.delete<{ message: string }>(`whatsapp-plantillas/${id}`);
    return response.data;
  },
};
