export interface VentasPendientes {
  id: number
  idUser: any
  cantidad: any
  estado: string
  nTransaccion: any
  tipoTransaccion: any
  observacion: any
  idUbicacion: any
  nombreRecibe: any
  idTercero: number
  valorUtilidad: any
  created_at: string
  updated_at: string
  origen: string
  idCompany: number
  asignaciones: Asignacione[]
  tercero: Tercero
}

export interface Asignacione {
  id: number
  idShoppingCart: number
  idProducto: number
  cantidad: string
  created_at: string
  updated_at: string
  valorUnitario: string
  idDetalleServicio: any
  producto: Producto
}

export interface Producto {
  id: number
  serial: string
  codigoProducto: string
  valorVenta: string
  cantidad: string
  publicacion: string
  modelo: string
  estado: string
  caracteristicas: string
  urlProducto: string
  idMedida: number
  idCategoria: number
  idMarca: number
  idTipoProducto: number
  created_at: string
  updated_at: string
  rutaProductoUrl: string
}

export interface Tercero {
  id: number
  nombre: string
  idTipoTercero: number
  created_at: string
  updated_at: string
  idCompany: number
  idTipoIdentificacion: number
  identificacion: string
  email: string
  direccion: any
  digitoVerficacion: any
  telefono: string
  retenciones: number
  responsableIva: number
  emailContacto: any
  telefonoContacto: any
  representanteLegal: any
  rutDocumento: any
  nombreContacto: any
  rutaRutUrl: string
}
