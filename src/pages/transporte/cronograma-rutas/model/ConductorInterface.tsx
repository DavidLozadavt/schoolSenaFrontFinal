export interface Conductor {
  id: number
  identificacion: string
  nombre1: string
  nombre2: string
  apellido1: string
  apellido2: any
  fechaNac: string
  direccion: string
  email: string
  telefonoFijo: string
  celular: string
  perfil: string
  sexo: string
  rh: string
  rutaFoto: string
  idTipoIdentificacion: number
  idCiudad: any
  idCiudadNac: number
  idCiudadUbicacion: number
  created_at: string
  updated_at: string
  rutaFotoUrl: string
  contrato: Contrato[]
}

export interface Contrato {
  id: number
  idpersona: number
  idempresa: number
  idtipoContrato: number
  fechaContratacion: string
  fechaFinalContrato: string
  valorTotalContrato: number
  salario_id: number
  numeroContrato: string
  objetoContrato: string
  observacion: string
  perfilProfesional: string
  otrosi: string
  created_at: string
  updated_at: string
  periodoPago: number
  idContrato: number
  idEstado: number
  formaDePago: any
  idCentroCosto: any
}
