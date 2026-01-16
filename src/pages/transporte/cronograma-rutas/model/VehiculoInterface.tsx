
export interface VehiculosInterface {
  id: number
  placa: string
  chasis: string
  serie: any
  numPuestos: string
  runt: any
  foto: string
  idModelo: number
  idTipo: number
  idMarca: number
  idEstado: number
  idEmpresa: number
  created_at: string
  updated_at: string
  rutaUrl: string
  marca: Marca
  modelo: Modelo
  tipo_vehiculo: TipoVehiculo
  estado: Estado
}

export interface Marca {
  id: number
  marca: string
  descripcion: any
}

export interface Modelo {
  id: number
  modelo: string
  descripcion: any
}

export interface TipoVehiculo {
  id: number
  tipo: string
  descripcion: string
}

export interface Estado {
  id: number
  estado: string
  descripcion: string
}
