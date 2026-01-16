export interface PuntoVenta {
  id: number
  nombre: string
  imagenUrl: string
  idSede: number
  created_at: string
  updated_at: string
  cajas: Caja[]
}

export interface Caja {
  id: number
  fecha: string
  valorEfectivo: string
  valorGasto: string
  valorTransaccion: string
  idUsuario: number
  observacion: string
  exedente: string
  idEstado: number
  created_at: string
  updated_at: string
  idPuntoDeVenta: number
  usuario: Usuario
  estado?: Estado
}

export interface Usuario {
  id: number
  email: string
  contrasena: string
  idpersona: number
  email_verified_at: string
  created_at: string
  updated_at: string
  persona: Persona
}

export interface Persona {
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
  idCiudad: number
  idCiudadNac: number
  idCiudadUbicacion: number
  created_at: string
  updated_at: string
  perfilActualizado: boolean
  rutaFotoUrl: string
}

export interface Estado {
  id: number
  estado: string
  descripcion: string
}
