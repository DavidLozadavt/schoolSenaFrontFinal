
export interface AgendaItem {
  id?: number;
  punto: string;
}

export interface ObjetivoItem {
  id?: number;
  objetivo: string;
}

export interface ConclusionItem {
  id?: number;
  conclusion: string;
}

export interface CompromisoItem {
  id?: number;
  actividad: string;
  fecha: string;
  responsable: string;
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

export interface AnexoItem {
  id?: number;
  idacta?: number;
  nombre: string;
  archivo: string;
  rutaArchivoUrl?: string;
  descripcion?: string;
}

export interface Acta {
  id: number;
  nombre: string;
  fecha: string;
  fechaInicialFormacion?: string;
  fechaFinalFormacion?: string;
  horaInicio: string;
  horaFin: string;
  tipoActa: string;
  observacion: string;
  lugar: string;
  direccion: string;
  documento?: string;
  rutaDocumentoUrl?: string;
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
  conclusiones?: ConclusionItem[];
  compromisos?: CompromisoItem[];
  anexos?: AnexoItem[];
}
