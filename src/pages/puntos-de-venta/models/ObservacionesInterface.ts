
export interface Observacion {
  id: number
  observacion: string
  idViaje: number
  idUser: number
  created_at: string
  updated_at: string
  user: User
}

export interface User {
  id: number
  email: string
  contrasena: string
  idpersona: number
  email_verified_at: string
  created_at: string
  updated_at: string
  device_token: any
  persona: Persona
}

export interface Persona {
  id: number
  identificacion: string
  nombre1: string
  nombre2: string
  apellido1: string
  apellido2: string
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
  rutaFotoUrl: string
}
