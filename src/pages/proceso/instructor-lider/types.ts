export interface Ficha {
  id: number;
  codigo: string;
  asignacion?: {
    programa?: {
      nombrePrograma: string;
    };
  };
  jornada?: {
    nombreJornada?: string;
  };
  sede?: {
    nombreSede: string;
  };
}

export interface Aprendiz {
  idMatricula: number;
  idPersona: number;
  identificacion: string;
  nombreCompleto: string;
  rutaFoto: string | null;
  email: string | null;
  estadoMatricula: string;
}
