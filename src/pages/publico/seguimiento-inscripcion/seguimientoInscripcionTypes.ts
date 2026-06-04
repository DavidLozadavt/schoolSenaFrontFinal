export interface ConceptoFacturaPortal {
  concepto?: string;
  valor: number;
}

export interface TutorPortal {
  nombreCompleto?: string | null;
  parentesco?: string | null;
  documento?: string | null;
  telefono?: string | null;
  email?: string | null;
}

export interface DocumentoPortal {
  titulo?: string;
  url?: string;
}

export interface AccionesPortal {
  puedeDescargarFactura?: boolean;
  puedeSubirComprobante?: boolean;
  puedePagarEnLinea?: boolean;
}

export interface MetodoPagoEnLinea {
  codigo: string;
  nombre: string;
  disponible: boolean;
}

export interface PortalSeguimientoInscripcion {
  token?: string | null;
  estadoInscripcion: string;
  estadoInscripcionEtiqueta?: string;
  mensajeEstado?: string;
  observacionAdministrativa?: string | null;
  fechaLimitePago?: string | null;
  fechaInscripcion?: string | null;
  numeroFactura?: string | null;
  saldoPendiente: number;
  valorPagado?: number;
  facturaPagada: boolean;
  comprobantePendiente?: boolean;
  ultimoComprobante?: {
    estado?: string;
    observacion_revision?: string | null;
    fecha_carga?: string;
  } | null;
  nombreCompleto: string;
  tipoDocumento?: string;
  documento: string;
  email?: string | null;
  telefono?: string | null;
  nombrePrograma: string;
  jornada?: string | null;
  periodoAcademico?: string | null;
  valorInscripcion?: number;
  valorMatricula?: number;
  totalPagar: number;
  conceptos?: ConceptoFacturaPortal[];
  tutor?: TutorPortal | null;
  documentos?: DocumentoPortal[];
  acciones?: AccionesPortal;
  pagosEnLinea?: MetodoPagoEnLinea[];
  redirectPath?: string | null;
}

export const formatearPesoPortal = (valor: number): string =>
  valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export function claseEstadoPortal(estado: string): string {
  switch (estado) {
    case 'INSCRIPCION_APROBADA':
    case 'PAGO_APROBADO':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'PAGO_EN_REVISION':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'RECHAZADA':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'CORRECCION_SOLICITADA':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'EN_REVISION':
      return 'bg-violet-100 text-violet-800 border-violet-200';
    case 'SOLICITUD_RECIBIDA':
    case 'BORRADOR':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'PENDIENTE_PAGO':
    case 'ACEPTADA':
    case 'FACTURA_GENERADA':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export const TIPOS_DOCUMENTO_PORTAL = [
  'Registro Civil',
  'Tarjeta de Identidad',
  'Cédula de Ciudadanía',
  'Cédula de Extranjería'
];
