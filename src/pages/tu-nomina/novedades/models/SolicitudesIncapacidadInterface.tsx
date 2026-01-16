import { TipoIncapacidadInterface } from "@/pages/tipo-incapacidades/models/TipoIncapacidadInterface";

export interface ObservacionSolicitudInterface {
    id: number;
    fecha: string;
    observacion: string;
    idSolicitud: number;
    idUsuario: number;
    created_at?: string; 
    updated_at?: string;
  }
  
  
  
  export interface SolicitudesIncapacidadInterface {
    id: number;
    fechaSolicitud: string;
    fechaLiquidacion?: string | null; 
    fechaInicial: string;
    periodos: string;
    estado: string;
    numDias: number;
    valor: number;
    fechaFinal: string;
    created_at?: string;
    updated_at?: string; 
    tipo_incapacidad?:TipoIncapacidadInterface
    
    observaciones: ObservacionSolicitudInterface[];
  }