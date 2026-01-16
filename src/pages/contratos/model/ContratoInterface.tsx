import { DocumentoContrato } from "./DocumentosContratoInterface";

export interface ContratoInterface {
  id?: any;
  fechaContratacion?: any;
  perfilProfesional?: string;
  otrosi?: string;
  periodoPago?: string;
  idpersona?: string;
  idtipoContrato?: string;
  observacion?: string;
  fechaFinalContrato?: any;
  valorTotalContrato?: any;
  objetoContrato?: string;
  sueldo?: string;

  persona?: {
    nombre1: string;
    nombre2: string;
    apellido1: string;
    apellido2: string;
    identificacion: string;
    email: string;
    fechaNac: string;
    direccion: string;
    sexo: string;
    rh: string;
    celular: string;
  };
  estado?: {
    estado: string;
  };
  salario?: {
    id?: string;
    valor?:any
    rol: {
      id: string;
      name: string;
    };
  };

  area?:{
    nombre?: string;
  };
  

  empresa?: {
    id: string;
    razonSocial: string;
    rutaLogoUrl: string;
    nit: string;
    digitoVerificacion: string;
  };

  tipoContrato?: {
    nombreTipoContrato: string;
  };

  transacciones?: any;
  documentosContrato?: DocumentoContrato[];

  archivoContrato?:any
  otrosContratos?:any
}
