// Servicios usados en el módulo de servicios

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