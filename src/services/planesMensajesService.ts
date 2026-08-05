import axios from 'axios';

/**
 * Planes de mensajes de WhatsApp por USUARIO.
 *
 * Módulo aditivo: no reemplaza ni modifica `seguimientoAspirantesService`.
 */

export interface MensajesPlan {
  id: number;
  nombre: string;
  cantidadMensajes: number;
  precio: string | number;
  descripcion: string | null;
  activo: boolean;
  /** Presentación del catálogo (Mejora 4). */
  orden?: number;
  recomendado?: boolean;
  color?: string | null;
  etiqueta?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PlanActivoResumen {
  id: number;
  nombre: string;
  cantidadMensajes: number;
}

export interface SaldoMensajes {
  mensajesGratuitos: number;
  mensajesDisponibles: number;
  mensajesConsumidos: number;
  planActivo: PlanActivoResumen | null;
  fechaActivacionPlan: string | null;
  tieneSolicitudPendiente: boolean;
}

export type EstadoSolicitudPlan = 'PENDIENTE' | 'PAGO_REALIZADO' | 'APROBADA' | 'RECHAZADA';

export interface SolicitudPlan {
  id: number;
  userId: number;
  companyId: number | null;
  planId: number;
  planNombre: string;
  cantidadMensajes: number;
  valor: string | number;
  metodoPago: string;
  comprobanteRuta: string | null;
  comprobanteNombre: string | null;
  estado: EstadoSolicitudPlan;
  motivoRechazo: string | null;
  revisadoPor: number | null;
  fechaRevision: string | null;
  created_at: string;
  updated_at: string;
  /** Pago por Wompi (NULL en las solicitudes con comprobante manual). */
  wompiTransaccionId?: number | null;
  estadoPago?: string | null;
  referenciaPago?: string | null;

  /** Solo en el listado del Administrador VT. */
  usuarioEmail?: string;
  usuarioNombre?: string;
  empresaNombre?: string;
  pagoTransactionId?: string | null;
  pagoReferencia?: string | null;
  pagoMetodo?: string | null;
  pagoEstado?: string | null;
  pagoValor?: string | number | null;
  pagoMoneda?: string | null;
  pagoFecha?: string | null;
}

export interface PaginacionSolicitudes {
  current_page: number;
  data: SolicitudPlan[];
  last_page: number;
  per_page: number;
  total: number;
}

export const planesMensajesService = {
  /** Saldo del usuario autenticado (indicadores de la interfaz). */
  getMiSaldo: async (): Promise<SaldoMensajes> => {
    const response = await axios.get<SaldoMensajes>('mensajes/mi-saldo');
    return response.data;
  },

  /** Catálogo de planes. `todos` incluye los inactivos (administración). */
  getPlanes: async (todos = false): Promise<MensajesPlan[]> => {
    const response = await axios.get<MensajesPlan[]>('mensajes/planes', {
      params: todos ? { todos: 1 } : undefined
    });
    return response.data;
  },

  /** Crea la solicitud de compra con el comprobante de pago adjunto. */
  crearSolicitud: async (
    planId: number,
    metodoPago: string,
    comprobante: File
  ): Promise<{ message: string; solicitud: SolicitudPlan }> => {
    const formData = new FormData();
    formData.append('planId', String(planId));
    formData.append('metodoPago', metodoPago);
    formData.append('comprobante', comprobante);

    const response = await axios.post('mensajes/solicitudes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  /** Solicitudes del usuario autenticado. */
  getMisSolicitudes: async (): Promise<SolicitudPlan[]> => {
    const response = await axios.get<SolicitudPlan[]>('mensajes/mis-solicitudes');
    return response.data;
  },

  /** Solicitudes ya revisadas (notificación de aprobación/rechazo). */
  getMisNotificaciones: async (): Promise<SolicitudPlan[]> => {
    const response = await axios.get<SolicitudPlan[]>('mensajes/mis-notificaciones');
    return response.data;
  },

  // -------------------------------------------------------------------------
  // Administrador VT
  // -------------------------------------------------------------------------

  getSolicitudes: async (params: {
    estado?: string;
    buscar?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginacionSolicitudes> => {
    const response = await axios.get<PaginacionSolicitudes>('mensajes/solicitudes', { params });
    return response.data;
  },

  /** Descarga el comprobante como Blob para abrirlo en una pestaña nueva. */
  getComprobante: async (id: number): Promise<Blob> => {
    const response = await axios.get(`mensajes/solicitudes/${id}/comprobante`, {
      responseType: 'blob'
    });
    return response.data;
  },

  aprobarSolicitud: async (id: number): Promise<{ message: string }> => {
    const response = await axios.post(`mensajes/solicitudes/${id}/aprobar`);
    return response.data;
  },

  rechazarSolicitud: async (id: number, motivoRechazo: string): Promise<{ message: string }> => {
    const response = await axios.post(`mensajes/solicitudes/${id}/rechazar`, { motivoRechazo });
    return response.data;
  },

  crearPlan: async (plan: Partial<MensajesPlan>): Promise<MensajesPlan> => {
    const response = await axios.post<MensajesPlan>('mensajes/planes', plan);
    return response.data;
  },

  actualizarPlan: async (id: number, plan: Partial<MensajesPlan>): Promise<MensajesPlan> => {
    const response = await axios.put<MensajesPlan>(`mensajes/planes/${id}`, plan);
    return response.data;
  },

  desactivarPlan: async (id: number): Promise<{ message: string }> => {
    const response = await axios.delete(`mensajes/planes/${id}`);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Módulo "Planes de Mensajes" (permiso GESTION_PLANES_MENSAJES).
  // Rutas propias; las de arriba se conservan para GESTION_SOLICITUDES_PLANES.
  // ---------------------------------------------------------------------------

  adminListarPlanes: async (): Promise<MensajesPlan[]> => {
    const response = await axios.get<MensajesPlan[]>('mensajes/planes-admin', {
      params: { todos: 1 }
    });
    return response.data;
  },

  adminCrearPlan: async (plan: Partial<MensajesPlan>): Promise<MensajesPlan> => {
    const response = await axios.post<MensajesPlan>('mensajes/planes-admin', plan);
    return response.data;
  },

  adminActualizarPlan: async (id: number, plan: Partial<MensajesPlan>): Promise<MensajesPlan> => {
    const response = await axios.put<MensajesPlan>(`mensajes/planes-admin/${id}`, plan);
    return response.data;
  },

  /**
   * Elimina el plan. Si tiene compras asociadas el backend NO lo elimina:
   * lo desactiva y responde `tieneCompras: true`.
   */
  adminEliminarPlan: async (
    id: number
  ): Promise<{ message: string; tieneCompras: boolean }> => {
    const response = await axios.delete(`mensajes/planes-admin/${id}`);
    return response.data;
  }
};
