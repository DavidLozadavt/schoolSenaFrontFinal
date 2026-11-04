// hooks/useActividadesProyecto.ts
import { useState } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import {
  ActividadFormState,
  ActividadProyecto,
  EMPTY_ACTIVIDAD_FORM,
  FaseProyecto
} from '../types/proyectoFormativo.types';

interface UseActividadesProyectoParams {
  updateFase: (
    proyectoId: number,
    faseId: number,
    updater: (f: FaseProyecto) => FaseProyecto
  ) => void;
  updateActividad: (
    proyectoId: number,
    faseId: number,
    actividadId: number,
    updater: (a: ActividadProyecto) => ActividadProyecto
  ) => void;
}

export function useActividadesProyecto({
  updateFase,
  updateActividad
}: UseActividadesProyectoParams) {
  const [actividadModalOpen, setActividadModalOpen] = useState(false);
  const [actividadModalCtx, setActividadModalCtx] = useState<{
    proyectoId: number;
    faseId: number;
  } | null>(null);
  const [editActividad, setEditActividad] = useState<ActividadProyecto | null>(null);
  const [actividadForm, setActividadForm] = useState<ActividadFormState>(EMPTY_ACTIVIDAD_FORM);
  const [savingActividad, setSavingActividad] = useState(false);
  const [deleteActividad, setDeleteActividad] = useState<{
    proyectoId: number;
    faseId: number;
    actividad: ActividadProyecto;
  } | null>(null);
  const [deletingActividad, setDeletingActividad] = useState<number | null>(null);

  const openCreateActividad = (proyectoId: number, faseId: number) => {
    setActividadModalCtx({ proyectoId, faseId });
    setEditActividad(null);
    setActividadForm(EMPTY_ACTIVIDAD_FORM);
    setActividadModalOpen(true);
  };

  const openEditActividad = (proyectoId: number, faseId: number, actividad: ActividadProyecto) => {
    setActividadModalCtx({ proyectoId, faseId });
    setEditActividad(actividad);
    setActividadForm({ descripcionActividad: actividad.descripcionActividad });
    setActividadModalOpen(true);
  };

  const closeActividadModal = () => {
    setActividadModalOpen(false);
    setActividadModalCtx(null);
    setEditActividad(null);
    setActividadForm(EMPTY_ACTIVIDAD_FORM);
  };

  const handleSaveActividad = async () => {
    if (!actividadForm.descripcionActividad.trim()) {
      enqueueSnackbar('La descripción de la actividad es obligatoria.', { variant: 'warning' });
      return;
    }
    if (!actividadModalCtx) return;
    const { proyectoId, faseId } = actividadModalCtx;
    setSavingActividad(true);
    try {
      if (editActividad) {
        const res = await axios.put(`actividades-proyecto/${editActividad.id}`, actividadForm);
        updateActividad(proyectoId, faseId, editActividad.id, (a) => ({
          ...a,
          ...res.data,
          fase_proyecto_raps: a.fase_proyecto_raps
        }));
        enqueueSnackbar('Actividad actualizada.', { variant: 'success' });
      } else {
        const res = await axios.post('actividades-proyecto', {
          ...actividadForm,
          idFaseProyecto: faseId
        });
        updateFase(proyectoId, faseId, (f) => ({
          ...f,
          actividades: [...(f.actividades ?? []), { ...res.data, fase_proyecto_raps: [] }]
        }));
        enqueueSnackbar('Actividad creada.', { variant: 'success' });
      }
      closeActividadModal();
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al guardar la actividad.', {
        variant: 'error'
      });
    } finally {
      setSavingActividad(false);
    }
  };

  const handleDeleteActividad = async () => {
    if (!deleteActividad) return;
    const { proyectoId, faseId, actividad } = deleteActividad;
    setDeletingActividad(actividad.id);
    try {
      await axios.delete(`actividades-proyecto/${actividad.id}`);
      updateFase(proyectoId, faseId, (f) => ({
        ...f,
        actividades: (f.actividades ?? []).filter((a) => a.id !== actividad.id)
      }));
      enqueueSnackbar('Actividad eliminada.', { variant: 'success' });
      setDeleteActividad(null);
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al eliminar la actividad.', {
        variant: 'error'
      });
    } finally {
      setDeletingActividad(null);
    }
  };

  return {
    actividadModalOpen,
    actividadModalCtx,
    editActividad,
    actividadForm,
    setActividadForm,
    savingActividad,
    deleteActividad,
    setDeleteActividad,
    deletingActividad,
    openCreateActividad,
    openEditActividad,
    closeActividadModal,
    handleSaveActividad,
    handleDeleteActividad
  };
}

export type UseActividadesProyectoReturn = ReturnType<typeof useActividadesProyecto>;
