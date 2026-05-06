
export interface AgendaItem {
  id?: number;
  punto: string;
}

export interface ObjetivoItem {
  id?: number;
  objetivo: string;
}

export interface Apprentice {
  id: number;
  nombre: string;
  identificacion: string;
}

export interface AsistenciaItem {
  id?: number;
  idActa?: number;
  idContrato: number | string;
  dependencia: string;
  aprueba: 'SI' | 'NO';
  observacion?: string;
  contrato?: {
    id: number;
    numeroContrato: string;
    persona?: {
      nombre1: string;
      nombre2?: string;
      apellido1: string;
      apellido2?: string;
    };
  };
}

export interface Acta {
  id: number;
  nombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipoActa: string;
  observacion: string;
  lugar: string;
  direccion: string;
  idCiudad: number;
  idFicha: number;
  idContrato: number;
  ciudad?: {
    id: number;
    descripcion: string;
  };
  ficha?: {
    id: number;
    codigo: string;
  };
  agenda?: AgendaItem[];
  objetivos?: ObjetivoItem[];
  asistencias?: AsistenciaItem[];
}
