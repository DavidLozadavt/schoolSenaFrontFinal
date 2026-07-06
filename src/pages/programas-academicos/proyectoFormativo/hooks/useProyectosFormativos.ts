// hooks/useProyectosFormativos.ts
import { useState } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import {
  EMPTY_PROYECTO_FORM,
  ProyectoFormState,
  ProyectoFormativo
} from '../types/proyectoFormativo.types';

interface UseProyectosFormativosParams {
  idPrograma?: string;
  setProyectos: React.Dispatch<React.SetStateAction<ProyectoFormativo[]>>;
}

export function useProyectosFormativos({ idPrograma, setProyectos }: UseProyectosFormativosParams) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [proyectoModalOpen, setProyectoModalOpen] = useState(false);
  const [editProyecto, setEditProyecto] = useState<ProyectoFormativo | null>(null);
  const [proyectoForm, setProyectoForm] = useState<ProyectoFormState>(EMPTY_PROYECTO_FORM);
  const [deleteProyecto, setDeleteProyecto] = useState<ProyectoFormativo | null>(null);
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);

  const openCreateProyecto = () => {
    setEditProyecto(null);
    setProyectoForm(EMPTY_PROYECTO_FORM);
    setProyectoModalOpen(true);
  };

  const openEditProyecto = (p: ProyectoFormativo) => {
    setEditProyecto(p);
    setProyectoForm({ nombreProyecto: p.nombreProyecto, version: p.version, estado: p.estado });
    setProyectoModalOpen(true);
  };

  const closeProyectoModal = () => {
    setProyectoModalOpen(false);
    setEditProyecto(null);
    setProyectoForm(EMPTY_PROYECTO_FORM);
    setDocumentoFile(null);
  };

  const handleSaveProyecto = async () => {
    if (!proyectoForm.nombreProyecto.trim() || !proyectoForm.version.trim()) {
      enqueueSnackbar('El nombre y la versión son obligatorios.', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('nombreProyecto', proyectoForm.nombreProyecto);
      formData.append('version', proyectoForm.version);
      formData.append('estado', proyectoForm.estado);
      formData.append('idPrograma', String(idPrograma));
      if (documentoFile) {
        formData.append('documento', documentoFile);
      }

      if (editProyecto) {
        // Laravel necesita _method para PUT con FormData → se resuelve con /update
        const res = await axios.post(`proyectos-formativos/${editProyecto.id}/update`, formData);
        setProyectos((prev) =>
          prev.map((p) => (p.id === editProyecto.id ? { ...p, ...res.data, fases: p.fases } : p))
        );
        enqueueSnackbar('Proyecto actualizado.', { variant: 'success' });
      } else {
        const res = await axios.post('proyectos-formativos', formData);
        setProyectos((prev) => [...prev, { ...res.data, fases: [] }]);
        enqueueSnackbar('Proyecto creado.', { variant: 'success' });
      }
      closeProyectoModal();
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al guardar.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProyecto = async () => {
    if (!deleteProyecto) return;
    setDeleting(deleteProyecto.id);
    try {
      await axios.delete(`proyectos-formativos/${deleteProyecto.id}`);
      setProyectos((prev) => prev.filter((p) => p.id !== deleteProyecto.id));
      enqueueSnackbar('Proyecto eliminado.', { variant: 'success' });
      setDeleteProyecto(null);
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al eliminar.', { variant: 'error' });
    } finally {
      setDeleting(null);
    }
  };

  return {
    saving,
    deleting,
    proyectoModalOpen,
    editProyecto,
    proyectoForm,
    setProyectoForm,
    deleteProyecto,
    setDeleteProyecto,
    documentoFile,
    setDocumentoFile,
    openCreateProyecto,
    openEditProyecto,
    closeProyectoModal,
    handleSaveProyecto,
    handleDeleteProyecto
  };
}

export type UseProyectosFormativosReturn = ReturnType<typeof useProyectosFormativos>;
