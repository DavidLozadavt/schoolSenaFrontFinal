 export interface Marca {
  id: number;
  marca: string;
  descripcion: string | null;
}

 export interface Modelo {
  id: number;
  modelo: string;
  descripcion: string | null;
}

 export interface Vehiculo {
  id: number;
  placa: string;
  marca: Marca;
  modelo: Modelo;
  foto: string;
}

 export interface ItemRevision {
  detalle: string;
  observacion: string;
  fechaRevision: string;
}

 export interface ItemRechazo {
  detalle: string;
  observacion: string;
  fechaRechazo: string;
}

 export interface VehiculoRevision {
  vehiculo: Vehiculo;
  rechazos: ItemRechazo[];
  porRevision: ItemRevision[];
  tieneRechazo: boolean;
  tienePorRevision: boolean;
}

 export interface ApiResponse {
  message: string;
  data: VehiculoRevision[];
}