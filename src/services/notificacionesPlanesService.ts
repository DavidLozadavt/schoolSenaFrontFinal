import axios from 'axios';

/**
 * Notificaciones in-app del módulo de Planes de Mensajes.
 * Módulo aditivo: no interviene en ningún flujo existente.
 */

export type TipoNotificacionPlan =
  | 'PAGO_APROBADO'
  | 'SOLICITUD_ENVIADA'
  | 'SOLICITUD_APROBADA'
  | 'SOLICITUD_RECHAZADA'
  | 'PLAN_ACTIVADO'
  | 'MENSAJES_ACREDITADOS'
  | 'SALDO_INSUFICIENTE';

export type NivelNotificacion = 'success' | 'info' | 'warning' | 'danger';

export interface NotificacionPlan {
  id: number;
  userId: number;
  tipo: TipoNotificacionPlan;
  titulo: string;
  mensaje: string;
  nivel: NivelNotificacion;
  solicitudId: number | null;
  transaccionId: number | null;
  datos: unknown;
  leidaEn: string | null;
  created_at: string;
  updated_at: string;
}

export const ICONO_NOTIFICACION: Record<TipoNotificacionPlan, string> = {
  PAGO_APROBADO: 'credit-cart',
  SOLICITUD_ENVIADA: 'send',
  SOLICITUD_APROBADA: 'check-circle',
  SOLICITUD_RECHAZADA: 'cross-circle',
  PLAN_ACTIVADO: 'rocket',
  MENSAJES_ACREDITADOS: 'sms',
  SALDO_INSUFICIENTE: 'information-2'
};

export const COLOR_NOTIFICACION: Record<NivelNotificacion, string> = {
  success: 'text-success',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger'
};

export const notificacionesPlanesService = {
  listar: async (
    soloNoLeidas = false,
    limite = 30
  ): Promise<{ notificaciones: NotificacionPlan[]; noLeidas: number }> => {
    const response = await axios.get('mensajes/notificaciones', {
      params: { soloNoLeidas: soloNoLeidas ? 1 : undefined, limite }
    });
    return response.data;
  },

  contarNoLeidas: async (): Promise<number> => {
    const response = await axios.get<{ noLeidas: number }>('mensajes/notificaciones/no-leidas');
    return response.data.noLeidas;
  },

  marcarLeida: async (id: number): Promise<void> => {
    await axios.post(`mensajes/notificaciones/${id}/leer`);
  },

  marcarTodasLeidas: async (): Promise<void> => {
    await axios.post('mensajes/notificaciones/leer-todas');
  }
};
