import axios from 'axios';

/**
 * Compra de planes de mensajes mediante la pasarela oficial de Wompi.
 *
 * Módulo aditivo: `planesMensajesService` (planes, saldo, solicitudes manuales)
 * se conserva sin cambios.
 */

export type EstadoWompi = 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';

export interface WompiTransaccion {
  id: number;
  reference: string;
  userId: number;
  companyId: number | null;
  planId: number;
  solicitudId: number | null;
  transactionId: string | null;
  paymentMethod: string | null;
  paymentMethodType: string | null;
  amountInCents: number;
  amount: string | number;
  currency: string;
  status: EstadoWompi;
  statusMessage: string | null;
  customerEmail: string | null;
  fechaPago: string | null;
  respuestaWompi: unknown;
  origenActualizacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResumenCompra {
  plan: {
    id: number;
    nombre: string;
    cantidadMensajes: number;
    precio: string | number;
    descripcion: string | null;
  };
  usuario: { id: number; nombre: string; email: string };
  empresa: { id: number | null; nombre: string | null };
  /** Desglose calculado en el backend a partir del precio del plan. */
  importes: { subtotal: number; ivaPorcentaje: number; iva: number; total: number };
  moneda: string;
  wompiConfigurado: boolean;
  /** Métodos habilitados en el comercio: CARD, PSE, NEQUI, BANCOLOMBIA_TRANSFER... */
  metodosPago: string[];
}

export interface DatosCheckout {
  checkoutUrl: string;
  publicKey: string;
  reference: string;
  amountInCents: number;
  currency: string;
  signature: string;
  redirectUrl: string | null;
  customerEmail: string | null;
}

/** Badge por estado real de Wompi (un color por estado). */
export const BADGE_ESTADO_WOMPI: Record<EstadoWompi, string> = {
  APPROVED: 'badge-success',
  PENDING: 'badge-warning',
  DECLINED: 'badge-danger',
  VOIDED: 'badge-dark',
  ERROR: 'badge-danger'
};

export const ETIQUETA_ESTADO_WOMPI: Record<EstadoWompi, string> = {
  APPROVED: 'Aprobado',
  PENDING: 'Pendiente',
  DECLINED: 'Rechazado',
  VOIDED: 'Anulado',
  ERROR: 'Error'
};

/** Etiquetas legibles de los métodos que devuelve Wompi. */
export const ETIQUETA_METODO_WOMPI: Record<string, string> = {
  CARD: 'Tarjeta débito o crédito',
  PSE: 'PSE',
  NEQUI: 'Nequi',
  BANCOLOMBIA_TRANSFER: 'Bancolombia',
  BANCOLOMBIA_COLLECT: 'Corresponsal Bancolombia',
  BANCOLOMBIA_QR: 'Bancolombia QR',
  DAVIPLATA: 'Daviplata',
  BJ: 'Botón Bancolombia'
};

/**
 * Construye la URL del Checkout Web oficial de Wompi con los datos firmados
 * por el backend. No se implementa ninguna pasarela propia.
 */
export const construirUrlCheckout = (checkout: DatosCheckout): string => {
  const params = new URLSearchParams({
    'public-key': checkout.publicKey,
    currency: checkout.currency,
    'amount-in-cents': String(checkout.amountInCents),
    reference: checkout.reference,
    'signature:integrity': checkout.signature
  });

  if (checkout.redirectUrl) {
    params.append('redirect-url', checkout.redirectUrl);
  }
  if (checkout.customerEmail) {
    params.append('customer-data:email', checkout.customerEmail);
  }

  return `${checkout.checkoutUrl}?${params.toString()}`;
};

export const wompiPagosService = {
  /** Resumen mostrado antes de enviar al checkout. */
  getResumen: async (planId: number): Promise<ResumenCompra> => {
    const response = await axios.get<ResumenCompra>(`mensajes/wompi/resumen/${planId}`);
    return response.data;
  },

  /** Crea la transacción en el sistema y devuelve los datos firmados de Wompi. */
  crearCheckout: async (
    planId: number
  ): Promise<{ message: string; transaccion: WompiTransaccion; checkout: DatosCheckout }> => {
    const response = await axios.post('mensajes/wompi/checkout', { planId });
    return response.data;
  },

  /** Consulta el estado real en Wompi al volver del checkout. */
  confirmar: async (params: {
    id?: string;
    reference?: string;
  }): Promise<{ message: string; transaccion: WompiTransaccion; solicitud: unknown }> => {
    const response = await axios.post('mensajes/wompi/confirmar', params);
    return response.data;
  },

  getMisTransacciones: async (): Promise<WompiTransaccion[]> => {
    const response = await axios.get<WompiTransaccion[]>('mensajes/wompi/mis-transacciones');
    return response.data;
  },

  /** Detalle completo de una transacción (Administrador VT). */
  getDetalle: async (id: number): Promise<WompiTransaccion> => {
    const response = await axios.get<WompiTransaccion>(`mensajes/wompi/transacciones/${id}`);
    return response.data;
  }
};
