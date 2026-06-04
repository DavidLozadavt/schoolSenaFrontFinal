export type EstadoSolicitudInscripcion = 'PENDIENTE' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA';

export type FiltroEstadoSolicitudInscripcion = 'PENDIENTES' | 'APROBADAS' | 'TODOS';

/** Factura pagada / transacción aprobada → no va en "Pendientes de validar". */
export function esSolicitudAprobada(s: SolicitudInscripcion): boolean {
  return s.estado === 'APROBADA' || Boolean(s.validacionCompletada);
}

/** Solo lo que aún requiere acción del administrador. */
export function esSolicitudPendienteValidacion(s: SolicitudInscripcion): boolean {
  if (s.estado === 'RECHAZADA') return false;
  return !esSolicitudAprobada(s);
}

export interface SolicitudInscripcion {
  idSolicitud: number;
  idFactura: number;
  numeroSolicitud: string;
  numeroFactura?: string;
  idEstudiante: number | null;
  idTercero?: number | null;
  nombreEstudiante: string;
  documento: string;
  email?: string | null;
  telefono?: string | null;
  idMatricula: number | null;
  estadoMatricula?: string | null;
  idPrograma: number | null;
  nombrePrograma: string;
  codigoPrograma: string;
  idProceso?: number | null;
  nombreProceso?: string | null;
  fechaSolicitud: string;
  estado: EstadoSolicitudInscripcion;
  validacionCompletada?: boolean;
  estadoFactura?: string;
  saldoPendiente?: number;
  totalFactura?: number;
  idTransaccion?: number | null;
  requierePago: boolean;
  editado?: boolean;
  fechaEditado?: string | null;
}

export interface EstudianteSolicitudInscripcion {
  idPersona: number | null;
  idMatricula?: number | null;
  nombreCompleto: string;
  tipoDocumento: string;
  documento: string;
  email?: string | null;
  celular?: string | null;
  telefono?: string | null;
  fechaNacimiento?: string | null;
  direccion?: string | null;
  estadoMatricula?: string | null;
}

export interface RespuestasFormulario {
  formulario: string;
  respuestas: Array<{
    pregunta: string;
    respuesta: string;
  }>;
}

export interface SolicitudInscripcionDetalleResponse {
  solicitud: SolicitudInscripcion;
  factura: {
    id: number;
    numeroFactura: string;
    fecha?: string;
    valor: number;
    estado: string;
    saldoPendiente?: number;
    idTransaccion?: number | null;
    detalles?: Array<{
      id: number;
      concepto?: string;
      detalle?: string;
      valor: number;
    }>;
  };
  estudiante: EstudianteSolicitudInscripcion | null;
  respuestasFormulario: RespuestasFormulario | null;
}
