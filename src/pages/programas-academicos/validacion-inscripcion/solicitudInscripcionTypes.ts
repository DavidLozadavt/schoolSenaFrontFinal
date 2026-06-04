export type EstadoSolicitudInscripcion = 'PENDIENTE' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA';

export type FiltroEstadoSolicitudInscripcion = 'PENDIENTES' | 'APROBADAS' | 'TODOS';

/** Factura pagada / transacción aprobada → no va en "Pendientes de validar". */
export function esSolicitudAprobada(s: SolicitudInscripcion): boolean {
  if (s.estado === 'APROBADA' || s.validacionCompletada) return true;

  const ef = (s.estadoFactura ?? '').toUpperCase();
  const saldo = Number(s.saldoPendiente ?? 0);

  if (['PAGADO', 'PAGADA', 'APROBADO'].includes(ef)) return true;

  if (saldo <= 0 && ef !== 'PENDIENTE' && ef !== '') return true;

  if (saldo <= 0 && !s.requierePago && Boolean(s.numeroFactura)) return true;

  return false;
}

/** Solo lo que aún requiere acción del administrador. */
export function esSolicitudPendienteValidacion(s: SolicitudInscripcion): boolean {
  if (s.estado === 'RECHAZADA') return false;
  return !esSolicitudAprobada(s);
}

export interface DatosFormularioInscripcionEstudiante {
  nombreCompleto?: string | null;
  tipoDocumento?: string | null;
  documento?: string | null;
  fechaNacimiento?: string | null;
  email?: string | null;
  telefono?: string | null;
  programaInteres?: string | null;
  jornada?: string | null;
}

export interface DatosFormularioInscripcionTutor {
  nombreCompleto?: string | null;
  parentesco?: string | null;
  documento?: string | null;
  telefono?: string | null;
  email?: string | null;
}

export interface DatosFormularioInscripcionDocumento {
  titulo: string;
  url: string;
}

export interface DatosFormularioInscripcion {
  idFormularioRespuesta: number;
  fechaEnvio?: string | null;
  estudiante: DatosFormularioInscripcionEstudiante;
  tutor: DatosFormularioInscripcionTutor;
  documentos: DatosFormularioInscripcionDocumento[];
  respuestasCrudas?: Array<{ idPregunta: number; titulo?: string; valor: unknown }>;
}

export interface SeguimientoInscripcionAdmin {
  id: number;
  token: string;
  estadoProceso: string;
  estadoProcesoEtiqueta?: string;
  fechaLimitePago?: string | null;
  fechaCorreoEnviado?: string | null;
  correoDestino?: string | null;
  urlPortal?: string;
  informacionConfirmada?: boolean;
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
  seguimiento?: SeguimientoInscripcionAdmin | null;
  idFormularioRespuesta?: number | null;
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
  datosFormulario?: DatosFormularioInscripcion | null;
}

export interface SolicitudRecibida {
  id: number;
  idFormularioRespuesta: number;
  numeroSolicitud: string;
  nombreEstudiante: string;
  tipoDocumento?: string | null;
  documento: string;
  email?: string | null;
  telefono?: string | null;
  nombrePrograma?: string | null;
  fechaSolicitud?: string | null;
  estado: string;
  estadoEtiqueta?: string;
  observacionAdministrativa?: string | null;
  idSeguimiento?: number | null;
  tutor?: DatosFormularioInscripcionTutor | null;
  documentos?: DatosFormularioInscripcionDocumento[];
}

export interface SolicitudRecibidaDetalle {
  id: number;
  idFormularioRespuesta: number;
  numeroSolicitud: string;
  fechaSolicitud?: string | null;
  estado: string;
  estadoEtiqueta?: string;
  observacionAdministrativa?: string | null;
  idTercero?: number | null;
  idProceso?: number | null;
  nombrePrograma?: string | null;
  idSeguimiento?: number | null;
  informacionConfirmada?: boolean;
  datosFormulario: DatosFormularioInscripcion;
}
