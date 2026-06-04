import axios from 'axios';
import { PortalSeguimientoInscripcion } from './seguimientoInscripcionTypes';

export interface ConsultaSeguimientoPayload {
  documento: string;
  tipoDocumento?: string;
  email?: string;
  fechaNacimiento?: string;
  idCompany?: number;
}

export async function consultarSeguimientoInscripcion(
  payload: ConsultaSeguimientoPayload
): Promise<PortalSeguimientoInscripcion> {
  const res = await axios.post<PortalSeguimientoInscripcion>(
    'publico/seguimiento-inscripcion/consultar',
    payload
  );
  return res.data;
}

/** @deprecated Usar consultarSeguimientoInscripcion */
export async function buscarSeguimientoPorDocumento(
  identificacion: string,
  idCompany = 1
): Promise<{ token: string; redirectPath: string } & PortalSeguimientoInscripcion> {
  const res = await axios.get(`publico/seguimiento-inscripcion/buscar`, {
    params: { identificacion, idCompany }
  });
  return res.data;
}

export async function fetchSeguimientoPorToken(token: string): Promise<PortalSeguimientoInscripcion> {
  const res = await axios.get<PortalSeguimientoInscripcion>(`publico/seguimiento-inscripcion/${token}`);
  return res.data;
}

export function urlFacturaPdfSeguimiento(token: string): string {
  const base = (axios.defaults.baseURL ?? '').replace(/\/$/, '');
  return `${base}/publico/seguimiento-inscripcion/${token}/factura-pdf`;
}

export async function subirComprobanteSeguimiento(
  token: string,
  archivo: File
): Promise<{ message: string; portal: PortalSeguimientoInscripcion }> {
  const form = new FormData();
  form.append('archivo', archivo);
  const res = await axios.post(`publico/seguimiento-inscripcion/${token}/comprobante`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}
