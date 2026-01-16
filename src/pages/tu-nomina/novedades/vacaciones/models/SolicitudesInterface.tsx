export interface ObservacionSolicitudInterface {
    id: number;
    fecha: string;
    observacion: string;
    idSolicitud: number;
    idUsuario: number;
    created_at?: string; 
    updated_at?: string;
  }
  
  export interface VacacionPeridoInterface {
    id: number;
    periodo: string;
    estado: string;
    idSolicitud: number;
    idContrato: number;
    deleted_at?: string | null; 
    created_at?: string | null; 
    updated_at?: string;
  }
  
  export interface SolicitudVacacionInterface {
    id: number;
    fechaSolicitud: string;
    fechaLiquidacion?: string | null; 
    fechaEjecucion: string;
    periodos: string;
    estado: string;
    numDias: number;
    valor: number;
    fechaFinal: string;
    created_at?: string;
    updated_at?: string; 
    vacaciones: VacacionPeridoInterface[];
    observaciones: ObservacionSolicitudInterface[];
  }