import { FacturaDetalleMock, FacturaSolicitudMock } from './mockFacturaSolicitud';
import {
  EstudianteSolicitudInscripcion,
  SolicitudInscripcion
} from './solicitudInscripcionTypes';

export interface MedioTipoPagoSeleccion {
  id: number;
  nombre: string;
}

export interface ValidacionSolicitudWizardState {
  recibida: boolean;
  pagoRevisado: boolean;
  pagoRequerido: boolean;
  pagoRegistrado: boolean;
  informacionRevisada: boolean;
  medioPagoSeleccionado: MedioTipoPagoSeleccion | null;
  tipoPagoSeleccionado: MedioTipoPagoSeleccion | null;
  observacionesFinales: string;
}

export const initialWizardState: ValidacionSolicitudWizardState = {
  recibida: false,
  pagoRevisado: false,
  pagoRequerido: false,
  pagoRegistrado: false,
  informacionRevisada: false,
  medioPagoSeleccionado: null,
  tipoPagoSeleccionado: null,
  observacionesFinales: ''
};

export interface ValidacionSolicitudPayload {
  idSolicitud: number;
  idEstudiante: number | null;
  idMatricula: number | null;
  idPrograma: number | null;
  estudiante: Pick<
    EstudianteSolicitudInscripcion,
    'nombreCompleto' | 'tipoDocumento' | 'documento' | 'email' | 'celular' | 'estadoMatricula'
  > | null;
  idFactura: number | null;
  numeroFactura: string | null;
  idTransaccion: number | null;
  estadoFactura: string | null;
  facturaDetalles: FacturaDetalleMock[];
  totalFactura: number;
  saldoPendiente: number;
  requierePago: boolean;
  pagoRevisado: boolean;
  pagoRegistrado: boolean;
  medioPagoSeleccionado: MedioTipoPagoSeleccion | null;
  tipoPagoSeleccionado: MedioTipoPagoSeleccion | null;
  validadoPor: 'ADMIN';
  contexto: 'VALIDACION_SOLICITUD_INSCRIPCION';
}

export function buildValidacionPayload(
  solicitud: SolicitudInscripcion,
  factura: FacturaSolicitudMock | null,
  wizard: ValidacionSolicitudWizardState,
  estudiante: EstudianteSolicitudInscripcion | null
): ValidacionSolicitudPayload {
  return {
    idSolicitud: solicitud.idSolicitud,
    idEstudiante: solicitud.idEstudiante,
    idMatricula: solicitud.idMatricula,
    idPrograma: solicitud.idPrograma,
    estudiante: estudiante
      ? {
          nombreCompleto: estudiante.nombreCompleto,
          tipoDocumento: estudiante.tipoDocumento,
          documento: estudiante.documento,
          email: estudiante.email,
          celular: estudiante.celular,
          estadoMatricula: estudiante.estadoMatricula
        }
      : {
          nombreCompleto: solicitud.nombreEstudiante,
          tipoDocumento: 'CC',
          documento: solicitud.documento,
          email: solicitud.email,
          celular: solicitud.telefono,
          estadoMatricula: solicitud.estadoMatricula
        },
    idFactura: factura?.idFactura ?? solicitud.idFactura ?? null,
    numeroFactura: factura?.numeroFactura ?? solicitud.numeroFactura ?? null,
    idTransaccion: factura?.idTransaccion ?? solicitud.idTransaccion ?? null,
    estadoFactura: factura?.estadoFactura ?? solicitud.estadoFactura ?? null,
    facturaDetalles: factura?.detalles ?? [],
    totalFactura: factura?.total ?? solicitud.totalFactura ?? 0,
    saldoPendiente: factura?.saldoPendiente ?? solicitud.saldoPendiente ?? 0,
    requierePago: wizard.pagoRequerido,
    pagoRevisado: wizard.pagoRevisado,
    pagoRegistrado: wizard.pagoRegistrado,
    medioPagoSeleccionado: wizard.medioPagoSeleccionado,
    tipoPagoSeleccionado: wizard.tipoPagoSeleccionado,
    validadoPor: 'ADMIN',
    contexto: 'VALIDACION_SOLICITUD_INSCRIPCION'
  };
}

export const formatearPeso = (valor: number): string =>
  valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
