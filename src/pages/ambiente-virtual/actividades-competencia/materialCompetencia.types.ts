export type MaterialCompetenciaOrigen = 'DIRECTO' | 'ACTIVIDAD' | 'MATERIAL_APOYO';

export interface MaterialCompetenciaCreador {
  idPersona?: number | null;
  nombreCompleto?: string | null;
  email?: string | null;
  rutaFoto?: string | null;
  rutaFotoUrl?: string | null;
}

export interface MaterialCompetenciaItem {
  id: number;
  idCompetencia: number;
  origen: MaterialCompetenciaOrigen | string;
  origenLabel?: string;
  titulo: string;
  descripcion?: string | null;
  tipoMaterial?: string | null;
  urlDocumento?: string | null;
  urlDocumentoUrl?: string | null;
  urlAdicional?: string | null;
  idActividad?: number | null;
  idMaterialApoyoActividad?: number | null;
  actividadOrigen?: { id: number; titulo?: string | null } | null;
  rapOrigen?: { id: number; nombre?: string | null; codigo?: string | null } | null;
  idPersona?: number | null;
  creador?: MaterialCompetenciaCreador | null;
  competencia?: {
    id: number;
    nombre: string;
    codigo?: string | null;
  } | null;
  competenciaNombre?: string | null;
  puedeDesvincular?: boolean;
  created_at?: string | null;
}

export interface CompetenciaAccesible {
  id: number;
  nombreMateria: string;
  codigo?: string | null;
  totalRaps?: number | null;
}

export interface CompetenciasAccesiblesResponse {
  data: CompetenciaAccesible[];
  puedeAdministrar: boolean;
}

export interface MaterialCompetenciaElegible {
  origen: MaterialCompetenciaOrigen | string;
  idActividad: number | null;
  idMaterialApoyoActividad: number | null;
  titulo: string;
  descripcion?: string | null;
  tipoMaterial?: string | null;
  actividadTitulo?: string | null;
  instructor?: MaterialCompetenciaCreador | null;
  rapNombre?: string | null;
  created_at?: string | null;
  urlDocumento?: string | null;
  urlDocumentoUrl?: string | null;
  urlAdicional?: string | null;
}
