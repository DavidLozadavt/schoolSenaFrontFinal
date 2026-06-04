import { EstadoConceptoPago } from './mockPagosPrograma';

export const ACADEMICO_PAGO_STORAGE_KEY = 'academicoPagoPayload';

export const CHECKOUT_ACADEMICO_PATH = '/gestion-academica/pagos/checkout';

export interface ConceptoSeleccionadoAcademico {
  idPago: number;
  concepto: string;
  descripcion: string;
  valor: number;
  estado: EstadoConceptoPago;
}

export interface EstudiantePagoResumen {
  id: number;
  nombre: string;
  documento: string;
}

export interface AcademicoPagoPayload {
  idTransaccion: number;
  programaId: number;
  estudianteId: number;
  idMatricula: number | null;
  origen: 'ACADEMICO';
  contexto: 'GESTION_ACADEMICA';
  registradoPor: 'ADMIN';
  pagosSeleccionados: number[];
  conceptosSeleccionados: ConceptoSeleccionadoAcademico[];
  totalSeleccionado: number;
  estudiante?: EstudiantePagoResumen;
}

export function guardarPayloadAcademico(payload: AcademicoPagoPayload): void {
  sessionStorage.setItem(ACADEMICO_PAGO_STORAGE_KEY, JSON.stringify(payload));
}

export function leerPayloadAcademico(): AcademicoPagoPayload | null {
  try {
    const raw = sessionStorage.getItem(ACADEMICO_PAGO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AcademicoPagoPayload;
    if (parsed?.origen !== 'ACADEMICO') return null;
    return parsed;
  } catch {
    return null;
  }
}
