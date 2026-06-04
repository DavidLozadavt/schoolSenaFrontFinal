import axios from 'axios';
import { FacturaSolicitudMock } from './validacionSolicitudTypes';
import {
  FiltroEstadoSolicitudInscripcion,
  SeguimientoInscripcionAdmin,
  SolicitudInscripcion,
  SolicitudInscripcionDetalleResponse,
  SolicitudRecibida,
  SolicitudRecibidaDetalle
} from './solicitudInscripcionTypes';
export interface FacturaAcademicaApi {
  id: number;
  numeroFactura: string;
  fecha?: string;
  valor: number;
  valorSinIva?: number;
  valorIva?: number;
  estado: string;
  saldoPendiente?: number;
  idTransaccion?: number | null;
  detalles?: Array<{
    id: number;
    concepto?: string;
    detalle?: string;
    valor: number;
  }>;
}

export interface RegistrarPagoFacturaPayload {
  idMedioPago: number;
  idTipoPago?: number;
  valorAbono?: number;
  contexto?: string;
}

export interface RegistrarPagoFacturaResponse {
  message: string;
  idTransaccion: number;
  factura: FacturaAcademicaApi;
}

export function mapFacturaApiToMock(
  api: FacturaAcademicaApi,
  idSolicitud: number
): FacturaSolicitudMock {
  const estadoRaw = (api.estado ?? 'PENDIENTE').toUpperCase();
  const estadoFactura =
    estadoRaw === 'PAGADO' || estadoRaw === 'PAGADA'
      ? 'PAGADA'
      : estadoRaw === 'ANULADA' || estadoRaw === 'ANULADO'
        ? 'ANULADA'
        : estadoRaw === 'EN PROCESO' || estadoRaw === 'EN_PROCESO'
          ? 'EN_PROCESO'
          : 'PENDIENTE';

  const saldo = api.saldoPendiente ?? api.valor;

  return {
    idFactura: api.id,
    numeroFactura: api.numeroFactura,
    idSolicitud,
    idTransaccion: api.idTransaccion ?? undefined,
    estadoFactura,
    fechaEmision: api.fecha ?? new Date().toISOString().slice(0, 10),
    subtotal: api.valorSinIva ?? api.valor,
    descuento: 0,
    impuestos: api.valorIva ?? 0,
    total: api.valor,
    saldoPendiente: saldo,
    requierePago: saldo > 0 && estadoFactura === 'PENDIENTE',
    detalles: (api.detalles ?? []).map((d) => ({
      idFacturaDetalle: d.id,
      concepto: d.concepto ?? d.detalle ?? 'Concepto',
      descripcion: d.detalle,
      cantidad: 1,
      valorUnitario: d.valor,
      subtotal: d.valor,
      estado: saldo <= 0 ? 'PAGADO' : 'PENDIENTE'
    }))
  };
}

export async function fetchSolicitudesInscripcion(
  estadoSolicitud: FiltroEstadoSolicitudInscripcion = 'PENDIENTES'
): Promise<SolicitudInscripcion[]> {
  const res = await axios.get<SolicitudInscripcion[]>('solicitudes_inscripcion', {
    params: { estadoSolicitud }
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchSolicitudInscripcionDetalle(
  idFactura: number
): Promise<SolicitudInscripcionDetalleResponse> {
  const res = await axios.get<SolicitudInscripcionDetalleResponse>(
    `solicitudes_inscripcion/${idFactura}`
  );
  return res.data;
}

export async function fetchFacturaAcademica(idFactura: number): Promise<FacturaAcademicaApi | null> {
  try {
    const res = await axios.get<FacturaAcademicaApi>(`facturas_academicas/${idFactura}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function registrarPagoFacturaAcademica(
  idFactura: number,
  payload: RegistrarPagoFacturaPayload
): Promise<RegistrarPagoFacturaResponse> {
  const res = await axios.post<RegistrarPagoFacturaResponse>(
    `facturas_academicas/${idFactura}/registrar_pago`,
    {
      ...payload,
      contexto: payload.contexto ?? 'VALIDACION_SOLICITUD_INSCRIPCION'
    }
  );
  return res.data;
}

export async function aprobarValidacionSolicitudInscripcion(
  idFactura: number,
  observaciones?: string
): Promise<{ message: string; solicitud: SolicitudInscripcion }> {
  const res = await axios.post<{ message: string; solicitud: SolicitudInscripcion }>(
    `solicitudes_inscripcion/${idFactura}/aprobar_validacion`,
    observaciones ? { observaciones } : {}
  );
  return res.data;
}

export interface ConfirmarInformacionPayload {
  correo: string;
  fechaLimitePago?: string;
  observaciones?: string;
}

export interface ConfirmarInformacionResponse {
  message: string;
  solicitud: SolicitudInscripcion;
  seguimiento: SeguimientoInscripcionAdmin;
}

export async function confirmarInformacionEnviarCorreo(
  idFactura: number,
  payload: ConfirmarInformacionPayload
): Promise<ConfirmarInformacionResponse> {
  const res = await axios.post<ConfirmarInformacionResponse>(
    `solicitudes_inscripcion/${idFactura}/confirmar_informacion`,
    payload
  );
  return res.data;
}

export async function fetchSolicitudesRecibidas(): Promise<SolicitudRecibida[]> {
  const res = await axios.get('solicitudes_recibidas');
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchSolicitudRecibidaDetalle(id: number): Promise<SolicitudRecibidaDetalle> {
  const res = await axios.get(`solicitudes_recibidas/${id}`);
  return res.data;
}

export async function confirmarInformacionSolicitudRecibida(
  id: number,
  payload: {
    correo: string;
    idProceso?: number;
    fechaLimitePago?: string;
    observaciones?: string;
  }
): Promise<{ message: string; idFactura: number; seguimiento?: SeguimientoInscripcionAdmin }> {
  const res = await axios.post(`solicitudes_recibidas/${id}/confirmar_informacion`, payload);
  return res.data;
}

export async function generarFacturaSolicitudRecibida(
  id: number,
  payload: { idProceso: number; correo: string; fechaLimitePago?: string }
): Promise<{ message: string; idFactura: number }> {
  const res = await axios.post(`solicitudes_recibidas/${id}/generar_factura`, payload);
  return res.data;
}

export async function rechazarSolicitudRecibida(
  id: number,
  observacion: string
): Promise<{ message: string }> {
  const res = await axios.post(`solicitudes_recibidas/${id}/rechazar`, { observacion });
  return res.data;
}

export async function solicitarCorreccionSolicitudRecibida(
  id: number,
  observacion: string
): Promise<{ message: string }> {
  const res = await axios.post(`solicitudes_recibidas/${id}/solicitar_correccion`, { observacion });
  return res.data;
}
