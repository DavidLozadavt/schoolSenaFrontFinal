import axios from 'axios';
import type {
  ActividadCatalogo,
  CatalogoResponse,
  FichaCatalogo,
  FichasCompatiblesResponse,
  FiltrosResponse,
} from './gestionActividades.types';

const BASE = 'ambiente-virtual/instructor/gestion-actividades';

export const gestionActividadesService = {
  errorMessage(err: unknown, fallback: string): string {
    const data = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
    return data?.error || data?.message || (err instanceof Error ? err.message : fallback);
  },

  async filtros(): Promise<FiltrosResponse> {
    const { data } = await axios.get<FiltrosResponse>(`${BASE}/filtros`);
    const toId = (value: unknown): number | null => {
      const n = Number(value);
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    return {
      competencias: (data?.competencias ?? [])
        .map((c) => ({ ...c, id: toId(c.id) ?? 0 }))
        .filter((c) => c.id > 0),
      raps: (data?.raps ?? [])
        .map((r) => ({
          ...r,
          id: toId(r.id) ?? 0,
          idCompetencia: toId(r.idCompetencia),
        }))
        .filter((r) => r.id > 0),
    };
  },

  async catalogo(params: {
    page: number;
    per_page?: number;
    search?: string;
    idCompetencia?: number | null;
    idRap?: number | null;
  }): Promise<CatalogoResponse> {
    const { data } = await axios.get<CatalogoResponse>(BASE, {
      params: {
        page: params.page,
        per_page: params.per_page ?? 30,
        search: params.search?.trim() || undefined,
        idCompetencia: params.idCompetencia || undefined,
        idRap: params.idRap || undefined,
      },
    });
    return {
      data: data?.data ?? [],
      meta: data?.meta ?? {
        current_page: 1,
        per_page: 30,
        total: 0,
        last_page: 1,
        from: 0,
        to: 0,
      },
    };
  },

  async fichasAsignadas(idActividad: number): Promise<FichaCatalogo[]> {
    const { data } = await axios.get<{ data: FichaCatalogo[] }>(`${BASE}/${idActividad}/fichas-asignadas`);
    return data?.data ?? [];
  },

  async fichasCompatibles(idActividad: number): Promise<FichasCompatiblesResponse> {
    const { data } = await axios.get<FichasCompatiblesResponse>(`${BASE}/${idActividad}/fichas-compatibles`);
    const fichas = data?.fichas ?? data?.data ?? [];
    return {
      actividad: data?.actividad ?? null,
      data: fichas,
      fichas,
      idRap: data?.idRap,
      meta: data?.meta,
    };
  },

  toActividadModal(row: ActividadCatalogo) {
    return {
      id: row.id,
      tituloActividad: row.tituloActividad,
      descripcionActividad: row.descripcionActividad ?? undefined,
      tipoActividad: (row.tipoActividad || 'con evidencia') as 'sin evidencia' | 'con evidencia' | 'cuestionario',
      idMateria: row.idMateria,
      idEstado: row.idEstado ?? 0,
      idCompany: 0,
      idPersona: row.idPersona ?? undefined,
      entregables: row.entregables ?? undefined,
      autor: row.autor ?? undefined,
      materia: row.rap
        ? { id: row.rap.id, nombreMateria: row.rap.nombreMateria ?? undefined, codigo: row.rap.codigo ?? undefined }
        : undefined,
    };
  },
};
