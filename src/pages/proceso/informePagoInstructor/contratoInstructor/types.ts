export interface CentroFormacion {
  rutaFotoUrl: string;
  nombre: string;
  correo: string;
  direccion: string;
}

export interface CiudadExpedicion {
  id: number;
  descripcion: string;
  departamento: {
    id: number;
    descripcion: string;
  };
}

export interface Persona {
  ciudadExpedicion: number | null;
  ciudad_expedicion_rel: CiudadExpedicion | null;
}

export interface ActividadContrato {
  id: number;
  obligaciones: string;
  accionesRealizadas: string;
  evidencias: string;
  idContrato: number;
  created_at: string;
  updated_at: string;
}

export interface Contrato {
  id: number;
  centroFormacion: CentroFormacion;
  persona: Persona;
  cargoSupervisor: null | string;
  supervisorContrato: null | string;
  objetoContrato: null | string;
  formaDePago: 'COMISIONES' | 'SALARIO INTEGRAL' | 'NORMAL';
  numeroContrato: null | string;
  siif: null | number;
  descripcionFormaPago: string | null;
}

export interface CiudadDepartamento {
  id: number;
  descripcion: string;
  departamento: {
    id: number;
    descripcion: string;
  };
}

export interface ContratoFormData {
  supervisorContrato: string;
  cargoSupervisor: string;
  objetoContrato: string;
  formaDePago: Contrato['formaDePago'];
  ciudadExpedicionId: number | '';
  siif: null | number;
  numeroContrato: null | string;
  descripcionFormaPago: string;
}

export interface ActividadFormData {
  obligaciones: string;
  accionesRealizadas: string;
  evidencias: string;
}

export interface ContratoGeneralInstructorRef {
  validate: () => { isValid: boolean; errors: string[] };
}
