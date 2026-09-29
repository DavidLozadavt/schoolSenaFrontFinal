import axios from 'axios';

/**
 * Plantillas de WhatsApp sincronizadas con la API oficial de Meta.
 *
 * Módulo aditivo: `seguimientoAspirantesService.getPlantillas()` (tabla local
 * `whatsappPlantillas`) sigue existiendo y sirviendo al flujo actual de envío.
 */

export type EstadoMeta =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED'
  | 'PAUSED'
  | 'DISABLED'
  | 'IN_REVIEW';

export type CategoriaMeta = 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';

export type TipoBoton = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';

export interface BotonPlantilla {
  tipo: TipoBoton;
  texto: string;
  valor?: string | null;
}

export interface PlantillaMeta {
  id: number;
  metaTemplateId: string | null;
  nombre: string;
  categoria: CategoriaMeta;
  idioma: string;
  estadoMeta: EstadoMeta;
  contenido: string | null;
  encabezado: string | null;
  pie: string | null;
  variablesEjemplo: string[] | null;
  botones: BotonPlantilla[] | null;
  respuestaMeta: unknown;
  motivoRechazo: string | null;
  creadoPorUserId: number | null;
  creadoPorNombre: string | null;
  fechaAprobacion: string | null;
  ultimaSincronizacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrearPlantillaMetaPayload {
  nombre: string;
  categoria: CategoriaMeta;
  idioma: string;
  contenido: string;
  encabezado?: string | null;
  pie?: string | null;
  variablesEjemplo?: string[];
  botones?: BotonPlantilla[];
}

export interface FiltrosPlantillasMeta {
  buscar?: string;
  categoria?: string;
  estado?: string;
  idioma?: string;
  soloAprobadas?: boolean;
}

/** Clases de badge por estado real de Meta (un color por estado). */
export const BADGE_ESTADO_META: Record<EstadoMeta, string> = {
  APPROVED: 'badge-success',
  PENDING: 'badge-warning',
  IN_REVIEW: 'badge-info',
  REJECTED: 'badge-danger',
  PAUSED: 'badge-dark',
  DISABLED: 'badge-secondary'
};

export const ETIQUETA_ESTADO_META: Record<EstadoMeta, string> = {
  APPROVED: 'Aprobada',
  PENDING: 'Pendiente',
  IN_REVIEW: 'En revisión',
  REJECTED: 'Rechazada',
  PAUSED: 'Pausada',
  DISABLED: 'Deshabilitada'
};

const API_PATH = 'whatsapp-plantillas-meta';

export const plantillasMetaService = {
  listar: async (filtros: FiltrosPlantillasMeta = {}): Promise<PlantillaMeta[]> => {
    const response = await axios.get<PlantillaMeta[]>(API_PATH, {
      params: {
        ...filtros,
        soloAprobadas: filtros.soloAprobadas ? 1 : undefined
      }
    });
    return response.data;
  },

  detalle: async (id: number): Promise<PlantillaMeta> => {
    const response = await axios.get<PlantillaMeta>(`${API_PATH}/${id}`);
    return response.data;
  },

  /** Crea la plantilla directamente en Meta usando las credenciales configuradas. */
  crear: async (
    payload: CrearPlantillaMetaPayload
  ): Promise<{ message: string; plantilla: PlantillaMeta }> => {
    const response = await axios.post(API_PATH, payload);
    return response.data;
  },

  /** Sincroniza todo el catálogo con Meta (actualiza e importa). */
  sincronizar: async (): Promise<{
    message: string;
    actualizadas: number;
    importadas: number;
    plantillas: PlantillaMeta[];
  }> => {
    const response = await axios.post(`${API_PATH}/sincronizar`);
    return response.data;
  },

  sincronizarUna: async (id: number): Promise<{ message: string; plantilla: PlantillaMeta }> => {
    const response = await axios.post(`${API_PATH}/${id}/sincronizar`);
    return response.data;
  },

  /** Elimina la plantilla SOLO localmente (sigue existiendo en Meta). */
  eliminarLocal: async (id: number): Promise<{ message: string }> => {
    const response = await axios.delete(`${API_PATH}/${id}`);
    return response.data;
  }
};
