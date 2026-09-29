// hooks/useFasesProyecto.ts
import { useState } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import {
  EMPTY_FASE_FORM,
  FaseFormState,
  FaseProyecto,
  ProyectoFormativo
} from '../types/proyectoFormativo.types';

interface UseFasesProyectoParams {
  updateProyecto: (
    proyectoId: number,
    updater: (p: ProyectoFormativo) => ProyectoFormativo
  ) => void;
  updateFase: (
    proyectoId: number,
    faseId: number,
    updater: (f: FaseProyecto) => FaseProyecto
  ) => void;
}

export function useFasesProyecto({ updateProyecto, updateFase }: UseFasesProyectoParams) {
  const [faseModalOpen, setFaseModalOpen] = useState(false);
  const [faseModalProyectoId, setFaseModalProyectoId] = useState<number | null>(null);
  const [editFase, setEditFase] = useState<FaseProyecto | null>(null);
  const [faseForm, setFaseForm] = useState<FaseFormState>(EMPTY_FASE_FORM);
  const [savingFase, setSavingFase] = useState(false);
  const [deleteFase, setDeleteFase] = useState<{ proyectoId: number; fase: FaseProyecto } | null>(
    null
  );
  const [deletingFase, setDeletingFase] = useState<number | null>(null);

  const openCreateFase = (proyectoId: number) => {
    setFaseModalProyectoId(proyectoId);
    setEditFase(null);
    setFaseForm(EMPTY_FASE_FORM);
    setFaseModalOpen(true);
  };

  const openEditFase = (proyectoId: number, fase: FaseProyecto) => {
    setFaseModalProyectoId(proyectoId);
    setEditFase(fase);
    setFaseForm({ descripcionFase: fase.descripcionFase });
    setFaseModalOpen(true);
  };

  const closeFaseModal = () => {
    setFaseModalOpen(false);
    setFaseModalProyectoId(null);
    setEditFase(null);
    setFaseForm(EMPTY_FASE_FORM);
  };

  const handleSaveFase = async () => {
    if (!faseForm.descripcionFase.trim()) {
      enqueueSnackbar('La descripción de la fase es obligatoria.', { variant: 'warning' });
      return;
    }
    if (!faseModalProyectoId) return;
    setSavingFase(true);
    try {
      if (editFase) {
        const res = await axios.put(`fases-proyecto/${editFase.id}`, faseForm);
        updateFase(faseModalProyectoId, editFase.id, (f) => ({
          ...f,
          ...res.data,
          actividades: f.actividades
        }));
        enqueueSnackbar('Fase actualizada.', { variant: 'success' });
      } else {
        const res = await axios.post('fases-proyecto', {
          ...faseForm,
          idProyectoFormativo: faseModalProyectoId
        });
        updateProyecto(faseModalProyectoId, (p) => ({
          ...p,
          fases: [...(p.fases ?? []), { ...res.data, actividades: [] }]
        }));
        enqueueSnackbar('Fase creada.', { variant: 'success' });
      }
      closeFaseModal();
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al guardar la fase.', {
        variant: 'error'
      });
    } finally {
      setSavingFase(false);
    }
  };

  const handleDeleteFase = async () => {
    if (!deleteFase) return;
    setDeletingFase(deleteFase.fase.id);
    try {
      await axios.delete(`fases-proyecto/${deleteFase.fase.id}`);
      updateProyecto(deleteFase.proyectoId, (p) => ({
        ...p,
        fases: (p.fases ?? []).filter((f) => f.id !== deleteFase.fase.id)
      }));
      enqueueSnackbar('Fase eliminada.', { variant: 'success' });
      setDeleteFase(null);
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al eliminar la fase.', {
        variant: 'error'
      });
    } finally {
      setDeletingFase(null);
    }
  };

  return {
    faseModalOpen,
    faseModalProyectoId,
    editFase,
    faseForm,
    setFaseForm,
    savingFase,
    deleteFase,
    setDeleteFase,
    deletingFase,
    openCreateFase,
    openEditFase,
    closeFaseModal,
    handleSaveFase,
    handleDeleteFase
  };
}

export type UseFasesProyectoReturn = ReturnType<typeof useFasesProyecto>;
