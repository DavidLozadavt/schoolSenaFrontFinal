import axios from 'axios';

export interface ComprobanteInscripcionBandeja {
  id: number;
  idSeguimiento: number;
  idFactura: number;
  estado: string;
  nombreEstudiante: string;
  documento: string;
  programa: string;
  nombreArchivo?: string;
  urlArchivo?: string;
  fechaCarga?: string;
  observacionRevision?: string | null;
}

export async function fetchComprobantesInscripcion(
  estado?: string
): Promise<ComprobanteInscripcionBandeja[]> {
  const res = await axios.get<ComprobanteInscripcionBandeja[]>('seguimiento_inscripcion/comprobantes', {
    params: estado ? { estado } : undefined
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function aprobarComprobanteInscripcion(
  id: number,
  idMedioPago = 1
): Promise<void> {
  await axios.post(`seguimiento_inscripcion/comprobantes/${id}/aprobar`, { idMedioPago });
}

export async function rechazarComprobanteInscripcion(
  id: number,
  observacion: string
): Promise<void> {
  await axios.post(`seguimiento_inscripcion/comprobantes/${id}/rechazar`, { observacion });
}
