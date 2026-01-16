export interface Servicio {
  id: number;
  nombre: string;
  descripcion?: string;
  valor?: number;
  rutaServicioUrl?: string;
  tiempoServicio?: number | string;
  idTipoServicio?: string | number;
  idCategoriaServicio?: string | number;
}

export interface Persona {
    id: number;
    nombre1: string;
    apellido1: string;
    nombreCompleto: string; 
}

// Estructura del Prestador (ResponsableServicio)
export type Prestador = {
  id: number; 
  nombreCompleto: string;
  persona: Persona; 
  servicios: Servicio[]; 
};