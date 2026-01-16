
export interface IdocuensType{
  id?: number
  idProceso: number
  idTipoDocumento: number
  actualizar?: number
  proceso: Proceso
  tipoDocumento: TipoDocumento
}

export interface Proceso {
  id: number
  nombreProceso: string
  descripcion: string
  created_at: any
  updated_at: any
}

export interface TipoDocumento {
  id: number
  tituloDocumento: string
  descripcion: string
  idEstado: number
  created_at: any
  fechaTipo?: any
  updated_at: any
  estado: Estado

}

export interface Estado {
  id: number
  estado: string
  descripcion: string
}
