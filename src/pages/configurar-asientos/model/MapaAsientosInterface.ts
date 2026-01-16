export interface AsientoInterface {
  numero: number;
  fila: number;
  columna: number;
  posicion: 'izquierda' | 'derecha' | 'centro';
  disponible: boolean;
  reservado?: boolean;
  etiqueta?: string;
}

export interface ClaseVehiculoInterface {
  id: number;
  nombre: string;
}

export interface MapaAsientosInterface {
  id: number;
  nombreMapa: string;
  cantidadAsientos: number;
  ladoPuerta: 'izquierda' | 'derecha';
  tipoDistribucion: '2+2' | '2+1' | '1+2' | '1+1';
  ultimaFilaEspecial: boolean;
  asientosUltimaFila: number;
  idClaseVehiculo?: number;
  claseVehiculo?: ClaseVehiculoInterface;
  asientos: AsientoInterface[];
  createdAt?: string;
  updatedAt?: string;
}
