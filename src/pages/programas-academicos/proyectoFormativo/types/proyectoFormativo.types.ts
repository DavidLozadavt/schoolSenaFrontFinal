// types/proyectoFormativo.types.ts

export interface Programa {
  id: number;
  nombrePrograma: string;
  codigoPrograma: string;
}

export interface Materia {
  id: number;
  nombreMateria: string;
  descripcion?: string | null;
  codigo: string;
  horas: string | null;
  creditos: number | null;
  DocUrl?: string | null;
}

export interface FaseProyectoMateria {
  id: number;
  idFaseProyectoRap: number;
  idMateria: number;
  materia: Materia;
}

export interface FaseProyectoRap {
  id: number;
  idFaseProyecto: number;
  idMateria: number;
  idActividadProyecto: number;
  materia: Materia;
  fase_proyecto_materias?: FaseProyectoMateria[];
}

export interface ActividadProyecto {
  id: number;
  descripcionActividad: string;
  idFaseProyecto: number;
  fase_proyecto_raps: FaseProyectoRap[];
}

export interface FaseProyecto {
  id: number;
  descripcionFase: string;
  idProyectoFormativo: number;
  actividades: ActividadProyecto[];
}

export interface ProyectoFormativo {
  id: number;
  nombreProyecto: string;
  version: string;
  estado: 'ACTIVO' | 'INACTIVO';
  idPrograma: number;
  rutaDocumentoUrl: string | null;
  programa?: Programa;
  fases?: FaseProyecto[];
}

export const ESTADO_STYLES: Record<ProyectoFormativo['estado'], string> = {
  ACTIVO: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  INACTIVO: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
};

// ── Form state shapes ──

export interface ProyectoFormState {
  nombreProyecto: string;
  version: string;
  estado: ProyectoFormativo['estado'];
}

export interface FaseFormState {
  descripcionFase: string;
}

export interface ActividadFormState {
  descripcionActividad: string;
}

export const EMPTY_PROYECTO_FORM: ProyectoFormState = {
  nombreProyecto: '',
  version: '',
  estado: 'ACTIVO'
};

export const EMPTY_FASE_FORM: FaseFormState = { descripcionFase: '' };

export const EMPTY_ACTIVIDAD_FORM: ActividadFormState = { descripcionActividad: '' };

// ── Contextos de modales anidados (útiles para tipar los hooks) ──

export interface RapModalCtx {
  proyectoId: number;
  faseId: number;
  actividad: ActividadProyecto;
}

export interface FpmModalCtx {
  proyectoId: number;
  faseId: number;
  actividadId: number;
  rap: FaseProyectoRap;
}
