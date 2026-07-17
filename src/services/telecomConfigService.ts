import axios from 'axios';

export interface TelecomConfig {
  id?: number;
  provider?: string;
  whatsappEnabled?: boolean;
  nombre?: string | null;
  accessToken?: string;
  phoneNumberId?: string;
  businessAccountId?: string | null;
  appId?: string | null;
  verifyToken?: string;
  appSecret?: string | null;
  webhookUrl?: string | null;
  graphVersion?: string;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

const API_PATH = 'telecom-config';

export const telecomConfigService = {
  /** Listar todas las configuraciones. */
  list: async (): Promise<TelecomConfig[]> => {
    const { data } = await axios.get<TelecomConfig[]>(API_PATH);
    return data;
  },

  /** Obtener la configuración activa vigente. */
  activa: async (): Promise<TelecomConfig | null> => {
    try {
      const { data } = await axios.get<TelecomConfig>(`${API_PATH}/activa`);
      return data;
    } catch {
      return null;
    }
  },

  /** Crear una nueva configuración. */
  create: async (payload: TelecomConfig): Promise<{ message: string; config: TelecomConfig }> => {
    const { data } = await axios.post(API_PATH, payload);
    return data;
  },

  /** Actualizar una configuración existente. */
  update: async (id: number, payload: TelecomConfig): Promise<{ message: string; config: TelecomConfig }> => {
    const { data } = await axios.put(`${API_PATH}/${id}`, payload);
    return data;
  },

  /** Eliminar una configuración. */
  remove: async (id: number): Promise<{ message: string }> => {
    const { data } = await axios.delete(`${API_PATH}/${id}`);
    return data;
  },

  /** Probar el envío de un mensaje con la configuración activa. */
  probar: async (numero: string, mensaje?: string): Promise<{ ok: boolean; id?: string; error?: string }> => {
    const { data } = await axios.post(`${API_PATH}/probar`, { numero, mensaje });
    return data;
  },
};
