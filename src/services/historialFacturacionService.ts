import axios from 'axios';

/**
 * Historial de Facturación (Administrador VT). Solo lectura.
 * Módulo aditivo: no interviene en el flujo de compra ni en Wompi.
 */

export interface RegistroFacturacion {
  id: number;
  fechaSolicitud: string;
  fechaPago: string;
  userId: number;
  usuarioEmail: string | null;
  usuarioNombre: string | null;
  companyId: number | null;
  empresaNombre: string | null;
  planId: number;
  planNombre: string;
  planActual: string | null;
  cantidadMensajes: number;
  valor: string | number;
  metodoPago: string | null;
  pagoMetodo: string | null;
  referenciaWompi: string | null;
  transactionId: string | null;
  estadoPago: string;
  moneda: string | null;
  estadoSolicitud: string;
  revisadoPor: number | null;
  aprobadoPorEmail: string | null;
  aprobadoPorNombre: string | null;
  fechaAprobacion: string | null;
  motivoRechazo: string | null;
}

export interface KpisFacturacion {
  totalVentas: number;
  totalRecaudado: number;
  pagosAprobados: number;
  pagosPendientes: number;
  pagosRechazados: number;
  mensajesVendidos: number;
  promedioCompra: number;
}

export interface FiltrosHistorial {
  desde?: string;
  hasta?: string;
  usuario?: string;
  empresaId?: number | string;
  planId?: number | string;
  estadoPago?: string;
  estadoSolicitud?: string;
  metodoPago?: string;
  buscar?: string;
  orden?: string;
  sentido?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface OpcionesFiltros {
  planes: { id: number; nombre: string }[];
  empresas: { id: number; nombre: string }[];
  metodosPago: string[];
  estadosPago: string[];
  estadosSolicitud: string[];
}

export interface RespuestaHistorial {
  kpis: KpisFacturacion;
  registros: {
    current_page: number;
    data: RegistroFacturacion[];
    last_page: number;
    per_page: number;
    total: number;
  };
  filtros: { campo: string; valor: string }[];
}

/** Badge por estado de pago (un color por estado). */
export const BADGE_ESTADO_PAGO: Record<string, string> = {
  APPROVED: 'badge-success',
  PENDING: 'badge-warning',
  MANUAL: 'badge-light',
  DECLINED: 'badge-danger',
  VOIDED: 'badge-dark',
  ERROR: 'badge-danger'
};

/** Badge por estado de solicitud. */
export const BADGE_ESTADO_SOLICITUD: Record<string, string> = {
  PENDIENTE: 'badge-warning',
  PAGO_REALIZADO: 'badge-info',
  APROBADA: 'badge-success',
  RECHAZADA: 'badge-danger'
};

export const ETIQUETA_ESTADO_SOLICITUD: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  PAGO_REALIZADO: 'Pago realizado',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada'
};

const API_PATH = 'facturacion/historial';

export const historialFacturacionService = {
  listar: async (filtros: FiltrosHistorial = {}): Promise<RespuestaHistorial> => {
    const response = await axios.get<RespuestaHistorial>(API_PATH, { params: filtros });
    return response.data;
  },

  opciones: async (): Promise<OpcionesFiltros> => {
    const response = await axios.get<OpcionesFiltros>(`${API_PATH}/opciones`);
    return response.data;
  },

  /** Devuelve el archivo como Blob para descargarlo desde el navegador. */
  exportar: async (formato: 'excel' | 'pdf', filtros: FiltrosHistorial = {}): Promise<Blob> => {
    const response = await axios.get(`${API_PATH}/export/${formato}`, {
      params: filtros,
      responseType: 'blob'
    });
    return response.data;
  }
};
