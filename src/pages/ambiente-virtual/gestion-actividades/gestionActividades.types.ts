export interface MateriaCatalogo {
  id: number;
  nombreMateria?: string | null;
  codigo?: string | null;
}

export interface RapFiltro extends MateriaCatalogo {
  idCompetencia?: number | null;
  competenciaNombre?: string | null;
}

export interface CompetenciaFiltro extends MateriaCatalogo {
  totalRaps?: number;
}

export interface ActividadCatalogo {
  id: number;
  codigo: string;
  tituloActividad: string;
  descripcionActividad?: string | null;
  tipoActividad?: string | null;
  entregables?: string | null;
  idMateria: number;
  idEstado?: number | null;
  idPersona?: number | null;
  autor?: string | null;
  creadorNombre?: string | null;
  estado?: string | null;
  rap?: MateriaCatalogo | null;
  competencia?: MateriaCatalogo | null;
  fichasAsignadas: number;
  puedeEliminar: boolean;
  motivoNoEliminar?: string | null;
}

export interface CatalogoMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

export interface CatalogoResponse {
  data: ActividadCatalogo[];
  meta: CatalogoMeta;
}

export interface FiltrosResponse {
  competencias: CompetenciaFiltro[];
  raps: RapFiltro[];
}

export interface FichaCatalogo {
  id: number;
  codigo?: string | null;
  programa?: string | null;
  jornada?: string | null;
  estado?: string | null;
  idHorarioMateria?: number | null;
  asignada?: boolean;
  activa?: boolean;
  estadoPublicacion?: string | null;
  totalAsignaciones?: number;
}

export interface ActividadContextoAsignacion {
  id: number;
  tituloActividad?: string | null;
  tipoActividad?: string | null;
  competencia?: MateriaCatalogo | null;
  rap?: MateriaCatalogo | null;
}

export interface FichasCompatiblesResponse {
  actividad?: ActividadContextoAsignacion | null;
  data: FichaCatalogo[];
  fichas?: FichaCatalogo[];
  idRap?: number;
  meta?: {
    totalInstructor?: number;
    totalCompatibles?: number;
    totalPublicadas?: number;
  };
}
