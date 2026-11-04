// hooks/useFaseProyectoMateria.ts
import { useState } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import {
  FaseProyectoMateria,
  FaseProyectoRap,
  FpmModalCtx,
  Materia
} from '../types/proyectoFormativo.types';

interface UseFaseProyectoMateriaParams {
  updateRap: (
    proyectoId: number,
    faseId: number,
    actividadId: number,
    rapId: number,
    updater: (r: FaseProyectoRap) => FaseProyectoRap
  ) => void;
}

export function useFaseProyectoMateria({ updateRap }: UseFaseProyectoMateriaParams) {
  const [fpmModalOpen, setFpmModalOpen] = useState(false);
  const [fpmModalCtx, setFpmModalCtx] = useState<FpmModalCtx | null>(null);
  const [materiasHijas, setMateriasHijas] = useState<Materia[]>([]);
  const [loadingMateriasHijas, setLoadingMateriasHijas] = useState(false);
  const [searchMateriaHija, setSearchMateriaHija] = useState('');
  const [selectedMateriaHijaIds, setSelectedMateriaHijaIds] = useState<Set<number>>(new Set());
  const [savingFpm, setSavingFpm] = useState(false);

  const [deleteFpm, setDeleteFpm] = useState<{
    proyectoId: number;
    faseId: number;
    actividadId: number;
    rapId: number;
    fpm: FaseProyectoMateria;
  } | null>(null);
  const [deletingFpm, setDeletingFpm] = useState<number | null>(null);

  const openFpmModal = async (
    proyectoId: number,
    faseId: number,
    actividadId: number,
    rap: FaseProyectoRap
  ) => {
    setFpmModalCtx({ proyectoId, faseId, actividadId, rap });
    setSearchMateriaHija('');
    setSelectedMateriaHijaIds(new Set());
    setFpmModalOpen(true);
    setLoadingMateriasHijas(true);
    try {
      const res = await axios.get('fase-proyecto-materia/materias', {
        params: { idMateriaPadre: rap.idMateria }
      });
      setMateriasHijas(res.data);
    } catch {
      enqueueSnackbar('Error al cargar las materias.', { variant: 'error' });
    } finally {
      setLoadingMateriasHijas(false);
    }
  };

  const closeFpmModal = () => {
    setFpmModalOpen(false);
    setFpmModalCtx(null);
    setSearchMateriaHija('');
    setSelectedMateriaHijaIds(new Set());
    setMateriasHijas([]);
  };

  const toggleMateriaHijaSeleccionada = (id: number) => {
    setSelectedMateriaHijaIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAsignarFpm = async () => {
    if (!fpmModalCtx || selectedMateriaHijaIds.size === 0) return;
    const { proyectoId, faseId, actividadId, rap } = fpmModalCtx;
    setSavingFpm(true);
    try {
      const res = await axios.post('fase-proyecto-materia', {
        idFaseProyectoRap: rap.id,
        idMaterias: Array.from(selectedMateriaHijaIds)
      });
      const { creados, duplicados } = res.data as {
        creados: FaseProyectoMateria[];
        duplicados: number[];
      };
      if (creados.length > 0) {
        updateRap(proyectoId, faseId, actividadId, rap.id, (r) => ({
          ...r,
          fase_proyecto_materias: [...(r.fase_proyecto_materias ?? []), ...creados]
        }));
        setFpmModalCtx((prev) =>
          prev
            ? {
                ...prev,
                rap: {
                  ...prev.rap,
                  fase_proyecto_materias: [...(prev.rap.fase_proyecto_materias ?? []), ...creados]
                }
              }
            : prev
        );
        enqueueSnackbar(
          `${creados.length} materia${creados.length !== 1 ? 's' : ''} asignada${
            creados.length !== 1 ? 's' : ''
          }.`,
          { variant: 'success' }
        );
      }
      if (duplicados.length > 0) {
        enqueueSnackbar(
          `${duplicados.length} ya estaba${duplicados.length !== 1 ? 'n' : ''} asignada${
            duplicados.length !== 1 ? 's' : ''
          }.`,
          { variant: 'warning' }
        );
      }
      setSelectedMateriaHijaIds(new Set());
      setSearchMateriaHija('');
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al asignar.', { variant: 'error' });
    } finally {
      setSavingFpm(false);
    }
  };

  const handleDesasignarFpm = async () => {
    if (!deleteFpm) return;
    const { proyectoId, faseId, actividadId, rapId, fpm } = deleteFpm;
    setDeletingFpm(fpm.id);
    try {
      await axios.delete(`fase-proyecto-materia/${fpm.id}`);
      updateRap(proyectoId, faseId, actividadId, rapId, (r) => ({
        ...r,
        fase_proyecto_materias: (r.fase_proyecto_materias ?? []).filter((m) => m.id !== fpm.id)
      }));
      enqueueSnackbar('Materia desasignada.', { variant: 'success' });
      setDeleteFpm(null);
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al desasignar.', {
        variant: 'error'
      });
    } finally {
      setDeletingFpm(null);
    }
  };

  return {
    fpmModalOpen,
    fpmModalCtx,
    materiasHijas,
    loadingMateriasHijas,
    searchMateriaHija,
    setSearchMateriaHija,
    selectedMateriaHijaIds,
    savingFpm,
    deleteFpm,
    setDeleteFpm,
    deletingFpm,
    openFpmModal,
    closeFpmModal,
    toggleMateriaHijaSeleccionada,
    handleAsignarFpm,
    handleDesasignarFpm
  };
}

export type UseFaseProyectoMateriaReturn = ReturnType<typeof useFaseProyectoMateria>;
