import { DocumentoContrato } from "./DocumentosContratoInterface";

export interface ContratoInterface {
  id?: any;
  fechaContratacion?: any;
  perfilProfesional?: string;
  otrosi?: string;
  periodoPago?: string;
  horasmes?: number | string;
  idpersona?: string;
  idempresa?: number; // Agregado
  idCentroFormacion?: number; // Agregado
  idtipoContrato?: string;
  observacion?: string;
  fechaFinalContrato?: any;
  valorTotalContrato?: any;
  objetoContrato?: string;
  sueldo?: string;
  banco: any;
  tipoCuentaBancaria: any;
  numeroCuentaBancaria: any;
  idCompany?: number; // Agregado

  actividadRiesgo: {
    nombre: string;
    descripcion: string;
  };

  persona?: {
    id?: number;
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
    telefonoFijo?: string;
    rutaFotoUrl?: string;
    usuario?: {
      idCentroFormacion?: number;
      centroFormacion?: {
        id: number;
        nombre: string;
        ciudad?: {
          descripcion: string;
        };
        empresa?: {
          razonSocial: string;
        };
      };
    };
  };
  
  estado?: {
    id?: number; // Agregado
    estado: string;
    descripcion?: string; // Agregado
  };
  
  salario?: {
    id?: string;
    valor?: any;
    rol: {
      id: string;
      name: string;
    };
  };

  area?: {
    id?: string | number;
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

  archivoContrato?: any;
  otrosContratos?: any;

  // Seguridad Social
  pension?: {
    id?: number;
    nombre?: string;
  };
  salud?: {
    id?: number;
    nombre?: string;
  };
  arl?: {
    id?: number;
    nombre?: string;
  };
  cajaCompensacion?: {
    id?: number;
    nombre?: string;
  };
  cesantias?: {
    id?: number;
    nombre?: string;
  };

  // Información Académica
  idNivelEducativo?: number;
  nivelEducativo?: {
    id?: number;
    nombre?: string;
  };
  areasConocimiento?: Array<{
    id?: number;
    nombreAreaConocimiento?: string;
  }>;
  programas?: Array<{
    id?: number;
    nombrePrograma?: string;
    codigoPrograma?: string;
  }>;

  // Centro de Formación - Objeto completo (opcional)
  centroFormacion?: {
    id?: number;
    nombre?: string;
    // otras propiedades según tu modelo
  } | null;
}