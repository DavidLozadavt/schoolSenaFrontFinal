
export interface TerceroInterface {
  id: number;
  nombre: string;
  idTipoTercero: number;
  created_at: string;
  updated_at: string | null;
  idCompany: number;
  idTipoIdentificacion: number;
  identificacion: string;
  email: string;
  direccion: string | null;
  digitoVerficacion: string | null;
  telefono: string | null;
  retenciones: boolean;
  responsableIva: boolean;
  emailContacto: string | null;
  telefonoContacto: string | null;
  representanteLegal: string | null;
  rutDocumento: string | null;
  nombreContacto: string | null;
  rutaRutUrl: string;
}