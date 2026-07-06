// hooks/useProyectoTree.ts
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import {
  ActividadProyecto,
  FaseProyecto,
  FaseProyectoRap,
  Programa,
  ProyectoFormativo
} from '../types/proyectoFormativo.types';

interface UseProyectoTreeParams {
  idPrograma?: string;
}

/**
 * Hook "raíz": mantiene el árbol completo de proyectos (con fases, actividades,
 * raps y materias hijas ya anidadas) y expone helpers inmutables para
 * actualizar cualquier nivel del árbol sin duplicar lógica de mapeo.
 *
 * El resto de hooks (useProyectosFormativos, useFasesProyecto, etc.) reciben
 * estos helpers como dependencia en vez de tener su propia copia del estado.
 */
export function useProyectoTree({ idPrograma }: UseProyectoTreeParams) {
  const [proyectos, setProyectos] = useState<ProyectoFormativo[]>([]);
  const [programa, setPrograma] = useState<Programa | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProyectos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('proyectos-formativos', { params: { idPrograma } });
      setProyectos(res.data);

      if (res.data.length > 0) {
        setPrograma(res.data[0].programa ?? null);
      }
    } catch {
      enqueueSnackbar('Error al cargar los proyectos.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [idPrograma]);

  useEffect(() => {
    fetchProyectos();
  }, [fetchProyectos]);

  const updateProyecto = useCallback(
    (proyectoId: number, updater: (p: ProyectoFormativo) => ProyectoFormativo) => {
      setProyectos((prev) => prev.map((p) => (p.id === proyectoId ? updater(p) : p)));
    },
    []
  );

  const updateFase = useCallback(
    (proyectoId: number, faseId: number, updater: (f: FaseProyecto) => FaseProyecto) => {
      updateProyecto(proyectoId, (p) => ({
        ...p,
        fases: (p.fases ?? []).map((f) => (f.id === faseId ? updater(f) : f))
      }));
    },
    [updateProyecto]
  );

  const updateActividad = useCallback(
    (
      proyectoId: number,
      faseId: number,
      actividadId: number,
      updater: (a: ActividadProyecto) => ActividadProyecto
    ) => {
      updateFase(proyectoId, faseId, (f) => ({
        ...f,
        actividades: (f.actividades ?? []).map((a) => (a.id === actividadId ? updater(a) : a))
      }));
    },
    [updateFase]
  );

  const updateRap = useCallback(
    (
      proyectoId: number,
      faseId: number,
      actividadId: number,
      rapId: number,
      updater: (r: FaseProyectoRap) => FaseProyectoRap
    ) => {
      updateActividad(proyectoId, faseId, actividadId, (a) => ({
        ...a,
        fase_proyecto_raps: (a.fase_proyecto_raps ?? []).map((r) =>
          r.id === rapId ? updater(r) : r
        )
      }));
    },
    [updateActividad]
  );

  return {
    proyectos,
    setProyectos,
    programa,
    loading,
    fetchProyectos,
    updateProyecto,
    updateFase,
    updateActividad,
    updateRap
  };
}

export type UseProyectoTreeReturn = ReturnType<typeof useProyectoTree>;
