// hooks/useFaseProyectoRap.ts
import { useMemo, useState } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import {
  ActividadProyecto,
  FaseProyectoRap,
  Materia,
  RapModalCtx
} from '../types/proyectoFormativo.types';

interface UseFaseProyectoRapParams {
  idPrograma?: string;
  updateActividad: (
    proyectoId: number,
    faseId: number,
    actividadId: number,
    updater: (a: ActividadProyecto) => ActividadProyecto
  ) => void;
}

export function useFaseProyectoRap({ idPrograma, updateActividad }: UseFaseProyectoRapParams) {
  const [materias, setMaterias] = useState<Materia[]>([]);

  const [rapModalOpen, setRapModalOpen] = useState(false);
  const [rapModalCtx, setRapModalCtx] = useState<RapModalCtx | null>(null);
  const [searchMateria, setSearchMateria] = useState('');
  const [selectedMateriaIds, setSelectedMateriaIds] = useState<Set<number>>(new Set());
  const [savingRap, setSavingRap] = useState(false);

  const [deleteRap, setDeleteRap] = useState<{
    proyectoId: number;
    faseId: number;
    actividadId: number;
    rap: FaseProyectoRap;
  } | null>(null);
  const [deletingRap, setDeletingRap] = useState<number | null>(null);

  const fetchMaterias = async () => {
    try {
      const res = await axios.get('fase-proyecto-rap/materias', { params: { idPrograma } });
      setMaterias(res.data);
    } catch {
      enqueueSnackbar('Error al cargar las materias disponibles.', { variant: 'error' });
    }
  };

  const openRapModal = (proyectoId: number, faseId: number, actividad: ActividadProyecto) => {
    setRapModalCtx({ proyectoId, faseId, actividad });
    setSearchMateria('');
    setSelectedMateriaIds(new Set());
    setRapModalOpen(true);
    if (materias.length === 0) {
      fetchMaterias();
    }
  };

  const closeRapModal = () => {
    setRapModalOpen(false);
    setRapModalCtx(null);
    setSearchMateria('');
    setSelectedMateriaIds(new Set());
  };

  const toggleMateriaSeleccionada = (id: number) => {
    setSelectedMateriaIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const asignadasIds = useMemo(
    () =>
      rapModalCtx
        ? new Set((rapModalCtx.actividad.fase_proyecto_raps ?? []).map((r) => r.idMateria))
        : new Set<number>(),
    [rapModalCtx]
  );

  const materiasFiltradas = useMemo(() => {
    if (searchMateria.trim().length < 2) return [];
    const term = searchMateria.toLowerCase();
    return materias
      .filter(
        (m) =>
          !asignadasIds.has(m.id) &&
          (m.nombreMateria.toLowerCase().includes(term) ||
            m.descripcion?.toLowerCase().includes(term) ||
            m.codigo?.toLowerCase().includes(term))
      )
      .slice(0, 12);
  }, [materias, asignadasIds, searchMateria]);

  const selectedMateriasList = useMemo(
    () => materias.filter((m) => selectedMateriaIds.has(m.id)),
    [materias, selectedMateriaIds]
  );

  const handleAsignarRap = async () => {
    if (!rapModalCtx || selectedMateriaIds.size === 0) return;
    const { proyectoId, faseId, actividad } = rapModalCtx;
    setSavingRap(true);
    try {
      const res = await axios.post('fase-proyecto-rap', {
        idFaseProyecto: faseId,
        idMaterias: Array.from(selectedMateriaIds),
        idActividadProyecto: actividad.id
      });

      const { creados, duplicados } = res.data as {
        creados: FaseProyectoRap[];
        duplicados: number[];
      };

      if (creados.length > 0) {
        updateActividad(proyectoId, faseId, actividad.id, (a) => ({
          ...a,
          fase_proyecto_raps: [...(a.fase_proyecto_raps ?? []), ...creados]
        }));
        // mantener el contexto del modal sincronizado para que asignadasIds se actualice
        setRapModalCtx((prev) =>
          prev
            ? {
                ...prev,
                actividad: {
                  ...prev.actividad,
                  fase_proyecto_raps: [...(prev.actividad.fase_proyecto_raps ?? []), ...creados]
                }
              }
            : prev
        );
        enqueueSnackbar(
          `${creados.length} materia${creados.length !== 1 ? 's' : ''} asignada${
            creados.length !== 1 ? 's' : ''
          } correctamente.`,
          { variant: 'success' }
        );
      }
      if (duplicados.length > 0) {
        enqueueSnackbar(
          `${duplicados.length} materia${duplicados.length !== 1 ? 's' : ''} ya estaba${
            duplicados.length !== 1 ? 'n' : ''
          } asignada${duplicados.length !== 1 ? 's' : ''} y se omitió${
            duplicados.length !== 1 ? 'eron' : ''
          }.`,
          { variant: 'warning' }
        );
      }

      setSelectedMateriaIds(new Set());
      setSearchMateria('');
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al asignar.', { variant: 'error' });
    } finally {
      setSavingRap(false);
    }
  };

  const handleDesasignarRap = async () => {
    if (!deleteRap) return;
    const { proyectoId, faseId, actividadId, rap } = deleteRap;
    setDeletingRap(rap.id);
    try {
      await axios.delete(`fase-proyecto-rap/${rap.id}`);
      updateActividad(proyectoId, faseId, actividadId, (a) => ({
        ...a,
        fase_proyecto_raps: (a.fase_proyecto_raps ?? []).filter((r) => r.id !== rap.id)
      }));
      // sincronizar contexto del modal de asignación si está abierto sobre la misma actividad
      setRapModalCtx((prev) =>
        prev && prev.actividad.id === actividadId
          ? {
              ...prev,
              actividad: {
                ...prev.actividad,
                fase_proyecto_raps: (prev.actividad.fase_proyecto_raps ?? []).filter(
                  (r) => r.id !== rap.id
                )
              }
            }
          : prev
      );
      enqueueSnackbar('Materia desasignada.', { variant: 'success' });
      setDeleteRap(null);
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al desasignar.', {
        variant: 'error'
      });
    } finally {
      setDeletingRap(null);
    }
  };

  return {
    materias,
    rapModalOpen,
    rapModalCtx,
    searchMateria,
    setSearchMateria,
    selectedMateriaIds,
    savingRap,
    materiasFiltradas,
    selectedMateriasList,
    deleteRap,
    setDeleteRap,
    deletingRap,
    openRapModal,
    closeRapModal,
    toggleMateriaSeleccionada,
    handleAsignarRap,
    handleDesasignarRap
  };
}

export type UseFaseProyectoRapReturn = ReturnType<typeof useFaseProyectoRap>;
