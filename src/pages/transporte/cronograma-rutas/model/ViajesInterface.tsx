// export interface Root {
//   total: number
//   viajes: Viaje[]
// }

import { Modelo, TipoVehiculo } from "./VehiculoInterface"

export interface ViajesModel {
  id: number
  idVehiculo: number
  idConductor: number
  idRuta: any
  estado: string
  created_at: string
  updated_at: string
  conductor: Conductor
  vehiculo: Vehiculo
  ruta: Ruta
  agendar_viajes?: AgendarViajes
  tickets: Ticket[]
  hasRevisionReciente: boolean
  conductor_auxiliar?: ConductorAux
  valorTotal: number
}

export interface Conductor {
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
  persona: Persona
}
export interface ConductorAux {
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
  idCiudad: any
  idCiudadNac: number
  idCiudadUbicacion: number
  created_at: string
  updated_at: string
  rutaFotoUrl: string
}

export interface Vehiculo {
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
  clase_vehiculo?: ClaseVehiculo
  configuracion_vehiculo: ConfiguracionVehiculo
  asignacion_propietarios: AsignacionPropietario[]
}

export interface ClaseVehiculo {
  id: number
  nombre: string
  descripcion: string
  mapas_asientos?: MapaAsiento[]
}

export interface MapaAsiento {
  id: number
  nombreMapa: string
  cantidadAsientos: number
  ladoPuerta: string
  tipoDistribucion: string
  ultimaFilaEspecial: boolean
  asientosUltimaFila: number | null
  descripcion: string
  activo: boolean
  estado: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  idClaseVehiculo: number
}

export interface AsignacionPropietario {
  id: number
  idPropietario: number
  fechaAsignacion: string
  idVehiculo: number
  porcentaje: number | null
  observacion: string | null
  idEstado: number
  idAfiliacion: number
  created_at: string
  updated_at: string
  estado: string
  administrador: string
  afiliacion: Afiliacion
}

export interface Afiliacion {
  id: number
  fechaAfiliacion: string
  fechaFinalAfiliacion: string | null
  numero: string
  idEmpresa: number
  estado: string
  numeroContratoCoperativa: string | null
  numeroContratoRadio: string | null
  restricciones: string | null
  observaciones: string | null
}
export interface Marca {
  id: number
  marca: string
  descripcion: any
}

export interface ConfiguracionVehiculo {
  id: number
  puesto: number
  idVehiculo: number
  created_at: string
  updated_at: string
}

export interface Ruta {
  id: number
  distancia: string
  latitud: any
  longitud: any
  tiempoEstimado: string
  descripcion: string
  precio: number
  idCiudadOrigen: number
  idCiudadDestino: number
  idLugar: any
  idRutaPadre: any
  idRutaVuelta: number
  created_at: string
  updated_at: string
  ciudad_origen: CiudadOrigen
  ciudad_destino: CiudadDestino
}

export interface CiudadOrigen {
  id: number
  codigo: string
  descripcion: string
  iddepartamento: number
  created_at: any
  updated_at: any
}

export interface CiudadDestino {
  id: number
  codigo: string
  descripcion: string
  iddepartamento: number
  created_at: any
  updated_at: any
}

export interface AgendarViajes {
  id: number
  idViaje: number
  dia: string
  fecha: string
  hora: string
  repetir: number
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: number
  idViaje: number
  idTercero: number
  idConfiguracionVehiculo: number
  idAgendaViaje: number
  created_at: string
  updated_at: string
  cantidad: number
  ruta: Ruta
}
