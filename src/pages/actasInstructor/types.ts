export interface Novedad {
  id?: number;
  idacta?: number;
  idmatriculaAcademica: number;
  observacion: string;
  matriculaAcademica?: {
    id: number;
    matricula?: {
      persona?: {
        nombre1: string;
        nombre2?: string;
        apellido1: string;
        apellido2?: string;
      };
    };
  };
}

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
  novedades?: Novedad[];
  agenda?: AgendaItem[];
  objetivos?: ObjetivoItem[];
}
