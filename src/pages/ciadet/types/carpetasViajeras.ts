export interface ArchivoCarpeta {
  id: number;
  urlArchivo: string;
  nombreArchivo?: string;
  rutaArchivoUrl?: string;
  aprobada: boolean;
  carpetas_viajeras_id: number;
}

export interface Persona {
  id: number;
  nombre1?: string;
  nombre2?: string;
  apellido1?: string;
  apellido2?: string;
  identificacion?: string;
  email?: string;
}

export interface CarpetaViajeraItem {
  id: number;
  total: number | string | null;
  nivel_academico: 'BACHILLERATO' | 'TECNICO' | 'TECNOLOGO';
  modulo: string;
  aprobada: boolean;
  pago: 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO';
  total_horas: number;
  persona_id: number;
  codigo_transferencia?: string | null;
  persona?: Persona;
  archivos?: ArchivoCarpeta[];
}
