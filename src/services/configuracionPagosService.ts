import axios from 'axios';

/**
 * Configuración General de Pagos (Administrador VT).
 *
 * Las llaves sensibles NUNCA llegan al frontend: el backend solo informa si
 * están presentes. Al guardar, un campo vacío conserva la llave ya almacenada.
 */

export type ModoPagos = 'SANDBOX' | 'PRODUCCION';

export interface ConfiguracionPagos {
  id: number;
  modo: ModoPagos;
  proveedor: string;
  moneda: string;
  ivaPorcentaje: string | number;
  mensajesGratuitos: number;
  activo: boolean;
  horasMaxAprobacion: number;
  urlRetorno: string | null;
  urlWebhook: string | null;
  usarLlavesPropias: boolean;
  actualizadoPor: number | null;
  created_at: string;
  updated_at: string;
}

export interface DiagnosticoPagos {
  modo: ModoPagos;
  proveedor: string;
  moneda: string;
  ivaPorcentaje: number;
  mensajesGratuitos: number;
  sistemaActivo: boolean;
  horasMaxAprobacion: number;
  urlRetorno: string | null;
  urlWebhook: string | null;
  origenLlaves: 'ARCHIVO_ENV' | 'BASE_DE_DATOS';
  /** Solo presencia: nunca el valor. */
  variables: {
    publicKey: boolean;
    privateKey: boolean;
    integritySecret: boolean;
    eventsSecret: boolean;
  };
  variablesFaltantes: string[];
  configuracionCompleta: boolean;
  modoCoherente: boolean;
  webhookConfigurado: boolean;
  baseApi: string;
}

export interface ResultadoVerificacion {
  valida: boolean;
  problemas: string[];
  conexion: {
    ok: boolean;
    mensaje: string;
    comercio?: string | null;
    metodosAceptados?: string[];
  };
  diagnostico: DiagnosticoPagos;
}

export const ETIQUETA_LLAVE: Record<string, string> = {
  publicKey: 'Public Key',
  privateKey: 'Private Key',
  integritySecret: 'Integrity Secret',
  eventsSecret: 'Events Secret'
};

export const configuracionPagosService = {
  obtener: async (): Promise<{
    configuracion: ConfiguracionPagos;
    diagnostico: DiagnosticoPagos;
  }> => {
    const response = await axios.get('pagos/configuracion');
    return response.data;
  },

  diagnostico: async (): Promise<DiagnosticoPagos> => {
    const response = await axios.get<DiagnosticoPagos>('pagos/configuracion/diagnostico');
    return response.data;
  },

  verificar: async (): Promise<ResultadoVerificacion> => {
    const response = await axios.post<ResultadoVerificacion>('pagos/configuracion/verificar');
    return response.data;
  },

  actualizar: async (
    datos: Partial<ConfiguracionPagos> & {
      publicKey?: string;
      privateKey?: string;
      integritySecret?: string;
      eventsSecret?: string;
    }
  ): Promise<{
    message: string;
    configuracion: ConfiguracionPagos;
    diagnostico: DiagnosticoPagos;
  }> => {
    const response = await axios.put('pagos/configuracion', datos);
    return response.data;
  }
};
