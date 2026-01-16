export interface AsignacionProcesoDocumentoInterface {
  id: number;
  idProceso: number;
  idTipoDocumento: number;
  actualizar: any | null;
  tipoDocumento: TipoDocumento;
  proceso: Proceso;
  vigencia: string;
}

export interface TipoDocumento {
  tipoFecha?: any;
  id: number;
  tituloDocumento: string;
  descripcion: string;
  idEstado: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface Proceso {
  id: number;
  nombreProceso: string;
  descripcion: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface PagoConfiguracion {
  id: number;
  idConfiguracionPago?: number;
  configuracion_pago: {
    titulo: string;
    valor: number;
  };
}
