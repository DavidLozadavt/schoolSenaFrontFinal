import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { ActividadContrato, ActividadFormData } from '../types';
import { actividadesInciales } from '../actividadesInciales';

export const useActividades = (contratoId: number | null) => {
  const [actividades, setActividades] = useState<ActividadContrato[]>([]);
  const [loadingActividades, setLoadingActividades] = useState(false);
  const [showActividadesModal, setShowActividadesModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [editingActividad, setEditingActividad] = useState<ActividadContrato | null>(null);
  const [savingActividad, setSavingActividad] = useState(false);
  const [totalActividades, setTotalActividades] = useState<number | null>(null);
  const [openForm, setOpenForm] = useState(true);

  const [actividadForm, setActividadForm] = useState<ActividadFormData>({
    obligaciones: '',
    accionesRealizadas: '',
    evidencias: ''
  });

  const baseActividadIds = useMemo(() => {
    return [...actividades]
      .sort((a, b) => a.id - b.id)
      .slice(0, 6)
      .map((a) => a.id);
  }, [actividades]);

  useEffect(() => {
    if (contratoId) {
      loadActividades();
    }
  }, [contratoId]);

  const loadActividades = async () => {
    if (!contratoId) return;
    setLoadingActividades(true);
    try {
      const response = await axios.get(`actividades-contrato?idContrato=${contratoId}`);
      setActividades(response.data.actividades || []);
      setTotalActividades((response.data.actividades || []).length);
      if (response.data.actividades.length === 0) {
        setShowHelpModal(true);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al cargar las actividades.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setLoadingActividades(false);
    }
  };

  const handleOpenActividades = () => {
    setShowActividadesModal(true);
    loadActividades();
  };

  const handleCloseActividadesModal = () => {
    setShowActividadesModal(false);
    setEditingActividad(null);
    setActividadForm({
      obligaciones: '',
      accionesRealizadas: '',
      evidencias: ''
    });
  };

  const handleEditActividad = (actividad: ActividadContrato) => {
    setEditingActividad(actividad);
    setActividadForm({
      obligaciones: actividad.obligaciones,
      accionesRealizadas: actividad.accionesRealizadas,
      evidencias: actividad.evidencias
    });
  };

  const handleCancelActividadEdit = () => {
    setEditingActividad(null);
    setActividadForm({
      obligaciones: '',
      accionesRealizadas: '',
      evidencias: ''
    });
  };

  const handleSaveActividad = async () => {
    if (!contratoId) return;

    // Validación
    if (
      !actividadForm.obligaciones.trim() ||
      !actividadForm.accionesRealizadas.trim() ||
      !actividadForm.evidencias.trim()
    ) {
      enqueueSnackbar('Todos los campos son requeridos.', { variant: 'warning' });
      return;
    }

    setSavingActividad(true);
    try {
      if (editingActividad) {
        // Actualizar
        const response = await axios.put(`actividades-contrato/${editingActividad.id}`, {
          ...actividadForm,
          idContrato: contratoId
        });
        setActividades((prev) =>
          prev.map((a) => (a.id === editingActividad.id ? response.data.actividad : a))
        );
        enqueueSnackbar('Actividad actualizada con éxito.', { variant: 'success' });
      } else {
        // Crear
        const response = await axios.post('actividades-contrato', {
          ...actividadForm,
          idContrato: contratoId
        });
        setActividades((prev) => [response.data.actividad, ...prev]);
        enqueueSnackbar('Actividad creada con éxito.', { variant: 'success' });
        setTotalActividades((prev) => (editingActividad ? prev : (prev ?? 0) + 1));
      }

      handleCancelActividadEdit();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al guardar la actividad.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSavingActividad(false);
    }
  };

  const handleDeleteActividad = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta actividad?')) return;

    try {
      await axios.delete(`actividades-contrato/${id}`);
      setActividades((prev) => prev.filter((a) => a.id !== id));
      enqueueSnackbar('Actividad eliminada con éxito.', { variant: 'success' });
      setTotalActividades((prev) => (prev ?? 1) - 1);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al eliminar la actividad.';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const handleRegistrarBase = async () => {
    if (!contratoId) return;
    setSavingActividad(true);
    try {
      const baseActivities = actividadesInciales.map((act) => ({
        obligaciones: act.obligaciones,
        accionesRealizadas: act.accionesRealizadas,
        evidencias: act.evidencias,
        idContrato: contratoId
      }));

      await Promise.all(baseActivities.map((act) => axios.post('actividades-contrato', act)));

      await loadActividades();
      enqueueSnackbar('6 actividades base generadas con éxito.', { variant: 'success' });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al generar las actividades base.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSavingActividad(false);
    }
  };

  return {
    actividades,
    loadingActividades,
    showActividadesModal,
    showHelpModal,
    editingActividad,
    savingActividad,
    totalActividades,
    openForm,
    actividadForm,
    baseActividadIds,
    setShowActividadesModal,
    setShowHelpModal,
    setOpenForm,
    setActividadForm,
    handleOpenActividades,
    handleCloseActividadesModal,
    handleEditActividad,
    handleCancelActividadEdit,
    handleSaveActividad,
    handleDeleteActividad,
    handleRegistrarBase,
    loadActividades
  };
};
