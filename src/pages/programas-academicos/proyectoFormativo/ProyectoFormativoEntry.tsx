import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';

interface Programa {
  id: number;
  nombrePrograma: string;
  codigoPrograma: string;
}

interface Materia {
  id: number;
  nombreMateria: string;
  descripcion?: string | null;
  codigo: string;
  horas: string | null;
  creditos: number | null;
  DocUrl?: string | null;
}

interface FaseProyectoRap {
  id: number;
  idFaseProyecto: number;
  idMateria: number;
  idActividadProyecto: number;
  materia: Materia;
}

interface ActividadProyecto {
  id: number;
  descripcionActividad: string;
  idFaseProyecto: number;
  fase_proyecto_raps: FaseProyectoRap[];
}

interface FaseProyecto {
  id: number;
  descripcionFase: string;
  idProyectoFormativo: number;
  actividades: ActividadProyecto[];
}

interface ProyectoFormativo {
  id: number;
  nombreProyecto: string;
  version: string;
  estado: 'ACTIVO' | 'INACTIVO';
  idPrograma: number;
  rutaDocumentoUrl: string | null;
  programa?: Programa;
  fases?: FaseProyecto[];
}

const ESTADO_STYLES: Record<ProyectoFormativo['estado'], string> = {
  ACTIVO: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  INACTIVO: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
};

const EMPTY_PROYECTO_FORM = {
  nombreProyecto: '',
  version: '',
  estado: 'ACTIVO' as ProyectoFormativo['estado']
};

const EMPTY_FASE_FORM = { descripcionFase: '' };
const EMPTY_ACTIVIDAD_FORM = { descripcionActividad: '' };

const ProyectoFormativoEntry: React.FC = () => {
  const { idPrograma, idRed } = useParams<{ idPrograma: string; idRed: string }>();
  const navigate = useNavigate();

  // Proyectos
  const [proyectos, setProyectos] = useState<ProyectoFormativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Materias disponibles (para asignar RAP) — se cargan una sola vez
  const [materias, setMaterias] = useState<Materia[]>([]);

  // Acordeones: qué proyecto / fase / actividad está expandida
  const [expandedProyecto, setExpandedProyecto] = useState<number | null>(null);
  const [expandedFases, setExpandedFases] = useState<Set<number>>(new Set());
  const [expandedActividades, setExpandedActividades] = useState<Set<number>>(new Set());

  // ── Modal crear/editar proyecto ──
  const [proyectoModalOpen, setProyectoModalOpen] = useState(false);
  const [editProyecto, setEditProyecto] = useState<ProyectoFormativo | null>(null);
  const [proyectoForm, setProyectoForm] = useState(EMPTY_PROYECTO_FORM);
  const [deleteProyecto, setDeleteProyecto] = useState<ProyectoFormativo | null>(null);
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);

  // ── Modal crear/editar fase ──
  const [faseModalOpen, setFaseModalOpen] = useState(false);
  const [faseModalProyectoId, setFaseModalProyectoId] = useState<number | null>(null);
  const [editFase, setEditFase] = useState<FaseProyecto | null>(null);
  const [faseForm, setFaseForm] = useState(EMPTY_FASE_FORM);
  const [savingFase, setSavingFase] = useState(false);
  const [deleteFase, setDeleteFase] = useState<{ proyectoId: number; fase: FaseProyecto } | null>(
    null
  );
  const [deletingFase, setDeletingFase] = useState<number | null>(null);

  // ── Modal crear/editar actividad ──
  const [actividadModalOpen, setActividadModalOpen] = useState(false);
  const [actividadModalCtx, setActividadModalCtx] = useState<{
    proyectoId: number;
    faseId: number;
  } | null>(null);
  const [editActividad, setEditActividad] = useState<ActividadProyecto | null>(null);
  const [actividadForm, setActividadForm] = useState(EMPTY_ACTIVIDAD_FORM);
  const [savingActividad, setSavingActividad] = useState(false);
  const [deleteActividad, setDeleteActividad] = useState<{
    proyectoId: number;
    faseId: number;
    actividad: ActividadProyecto;
  } | null>(null);
  const [deletingActividad, setDeletingActividad] = useState<number | null>(null);

  // ── Modal asignar materias/RAP ──
  const [rapModalOpen, setRapModalOpen] = useState(false);
  const [rapModalCtx, setRapModalCtx] = useState<{
    proyectoId: number;
    faseId: number;
    actividad: ActividadProyecto;
  } | null>(null);
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

  //Programa:
  const [programa, setPrograma] = useState<Programa | null>(null);

  useEffect(() => {
    fetchProyectos();
  }, [idPrograma]);

  const fetchProyectos = async () => {
    setLoading(true);
    try {
      const res = await axios.get('proyectos-formativos', { params: { idPrograma } });
      setProyectos(res.data);

      // Extrae el programa del primer resultado
      if (res.data.length > 0) {
        setPrograma(res.data[0].programa ?? null);
      }
    } catch {
      enqueueSnackbar('Error al cargar los proyectos.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterias = async () => {
    try {
      const res = await axios.get('fase-proyecto-rap/materias', { params: { idPrograma } });
      setMaterias(res.data);
    } catch {
      enqueueSnackbar('Error al cargar las materias disponibles.', { variant: 'error' });
    }
  };

  // ── Acordeón handlers ──
  const toggleProyecto = (id: number) => {
    setExpandedProyecto((prev) => (prev === id ? null : id));
  };

  const toggleFase = (id: number) => {
    setExpandedFases((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleActividad = (id: number) => {
    setExpandedActividades((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Helpers de actualización inmutable del árbol anidado ──
  const updateProyecto = (
    proyectoId: number,
    updater: (p: ProyectoFormativo) => ProyectoFormativo
  ) => {
    setProyectos((prev) => prev.map((p) => (p.id === proyectoId ? updater(p) : p)));
  };

  const updateFase = (
    proyectoId: number,
    faseId: number,
    updater: (f: FaseProyecto) => FaseProyecto
  ) => {
    updateProyecto(proyectoId, (p) => ({
      ...p,
      fases: (p.fases ?? []).map((f) => (f.id === faseId ? updater(f) : f))
    }));
  };

  const updateActividad = (
    proyectoId: number,
    faseId: number,
    actividadId: number,
    updater: (a: ActividadProyecto) => ActividadProyecto
  ) => {
    updateFase(proyectoId, faseId, (f) => ({
      ...f,
      actividades: (f.actividades ?? []).map((a) => (a.id === actividadId ? updater(a) : a))
    }));
  };

  // ── Proyecto handlers ──
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
        // Laravel necesita _method para PUT con FormData
        const res = await axios.post(
          `proyectos-formativos/${editProyecto.id}/update`, // ← /update
          formData
        );
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

  // ── Fase handlers ──
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

  // ── Actividad handlers ──
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

  // ── Materias/RAP handlers ──
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

  const asignadasIds = rapModalCtx
    ? new Set((rapModalCtx.actividad.fase_proyecto_raps ?? []).map((r) => r.idMateria))
    : new Set<number>();

  const materiasFiltradas =
    searchMateria.trim().length >= 2
      ? materias
          .filter(
            (m) =>
              !asignadasIds.has(m.id) &&
              (m.nombreMateria.toLowerCase().includes(searchMateria.toLowerCase()) ||
                m.descripcion?.toLowerCase().includes(searchMateria.toLowerCase()) ||
                m.codigo?.toLowerCase().includes(searchMateria.toLowerCase()))
          )
          .slice(0, 12)
      : [];

  const selectedMateriasList = materias.filter((m) => selectedMateriaIds.has(m.id));

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

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Proyectos Formativos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de proyectos, fases, actividades y RAP asociados
          </p>
        </div>
        <button
          onClick={openCreateProyecto}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm shadow-blue-500/20"
        >
          <i className="ki-outline ki-plus text-sm" />
          Nuevo proyecto
        </button>
      </div>

      {/* Banner programa */}
      {programa && (
        <div className="mb-6 px-5 py-4 bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
            <i className="ki-outline ki-book text-blue-600 dark:text-blue-400 text-base" />
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Programa asociado</p>
            <p className="text-sm font-bold text-gray-800 dark:text-white">
              {programa.nombrePrograma}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
              <i className="ki-outline ki-tag text-xs" />
              Código:{' '}
              <span className="font-medium text-gray-600 dark:text-gray-300 ml-1">
                {programa.codigoPrograma}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Lista de acordeones de proyectos */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : proyectos.length === 0 ? (
        <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 py-16 text-center text-sm text-gray-400 dark:text-gray-500">
          <i className="ki-outline ki-document text-3xl mb-2 block" />
          No hay proyectos formativos registrados.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {proyectos.map((proyecto) => {
            const isOpen = expandedProyecto === proyecto.id;
            const fases = proyecto.fases ?? [];
            const totalActividades = fases.reduce(
              (acc, f) => acc + (f.actividades?.length ?? 0),
              0
            );

            return (
              <div
                key={proyecto.id}
                className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 shadow-sm overflow-hidden"
              >
                {/* Header del proyecto (clic para expandir) */}
                <button
                  onClick={() => toggleProyecto(proyecto.id)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50/60 dark:hover:bg-coal-400/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                      <i className="ki-outline ki-document text-blue-600 dark:text-blue-400 text-base" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-white leading-snug truncate">
                        {proyecto.nombreProyecto}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          Versión {proyecto.version}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {fases.length} {fases.length === 1 ? 'fase' : 'fases'}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {totalActividades} {totalActividades === 1 ? 'actividad' : 'actividades'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[proyecto.estado]}`}
                    >
                      {proyecto.estado}
                    </span>
                    <i
                      className={`ki-outline ki-down text-gray-400 text-sm transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Panel expandido */}
                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-coal-300 p-4 space-y-4">
                    {/* Acciones integradas del proyecto */}
                    <div className="flex flex-wrap gap-2">
                      {/**
                        
                        <button
                          onClick={() =>
                            navigate(
                              `/gestion-academica/configuracion/redes/programas/${idRed}/proyecto/${idPrograma}/detalle/${proyecto.id}`
                            )
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 font-semibold text-indigo-700 dark:text-indigo-400 dark:bg-indigo-500/10 rounded-lg transition-all"
                        >
                          <i className="ki-outline ki-eye text-sm" /> Ver detalles completos
                        </button>
                       
                       */}
                      <button
                        onClick={() => openEditProyecto(proyecto)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 font-semibold text-blue-700 dark:text-blue-400 dark:bg-blue-500/10 rounded-lg transition-all"
                      >
                        <i className="ki-outline ki-pencil text-sm" /> Editar
                      </button>
                      <button
                        onClick={() => setDeleteProyecto(proyecto)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 font-semibold text-red-700 dark:text-red-400 dark:bg-red-500/10 rounded-lg transition-all"
                      >
                        <i className="ki-outline ki-trash text-sm" /> Eliminar
                      </button>
                      {proyecto.rutaDocumentoUrl && (
                        <a
                          href={proyecto.rutaDocumentoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 font-semibold text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all"
                        >
                          <i className="ki-outline ki-document text-sm" /> Ver documento
                        </a>
                      )}
                      <button
                        onClick={() => openCreateFase(proyecto.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-50 hover:bg-purple-100 font-semibold text-purple-700 dark:text-purple-400 dark:bg-purple-500/10 rounded-lg transition-all ml-auto"
                      >
                        <i className="ki-outline ki-plus text-sm" /> Nueva fase
                      </button>
                    </div>

                    {/* Árbol Fase → Actividad → Materias */}
                    {fases.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic px-1">
                        Este proyecto aún no tiene fases registradas.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {fases.map((fase) => {
                          const faseOpen = expandedFases.has(fase.id);
                          const actividades = fase.actividades ?? [];

                          return (
                            <div
                              key={fase.id}
                              className="border border-gray-200 dark:border-coal-300 rounded-lg overflow-hidden"
                            >
                              {/* Header de Fase */}
                              <div className="flex items-center gap-2 bg-gray-50 dark:bg-coal-400/40 hover:bg-gray-100 dark:hover:bg-coal-400/60 transition-colors">
                                <button
                                  onClick={() => toggleFase(fase.id)}
                                  className="flex-1 flex items-center justify-between gap-2 px-3 py-2.5 text-left min-w-0"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <i className="ki-outline ki-element-11 text-purple-500 text-sm shrink-0" />
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
                                      {fase.descripcionFase}
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                                      ({actividades.length}{' '}
                                      {actividades.length === 1 ? 'actividad' : 'actividades'})
                                    </span>
                                  </div>
                                  <i
                                    className={`ki-outline ki-down text-gray-400 text-xs transition-transform shrink-0 ${
                                      faseOpen ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>
                                <div className="flex items-center gap-1 pr-2 shrink-0">
                                  <button
                                    onClick={() => openEditFase(proyecto.id, fase)}
                                    title="Editar fase"
                                    className="w-7 h-7 flex items-center justify-center rounded-md text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-colors"
                                  >
                                    <i className="ki-outline ki-pencil text-xs" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteFase({ proyectoId: proyecto.id, fase })}
                                    title="Eliminar fase"
                                    className="w-7 h-7 flex items-center justify-center rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors"
                                  >
                                    <i className="ki-outline ki-trash text-xs" />
                                  </button>
                                </div>
                              </div>

                              {/* Actividades de la fase */}
                              {faseOpen && (
                                <div className="p-2 space-y-1.5 bg-white dark:bg-coal-500">
                                  <div className="flex justify-end px-1">
                                    <button
                                      onClick={() => openCreateActividad(proyecto.id, fase.id)}
                                      className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-amber-50 hover:bg-amber-100 font-semibold text-amber-700 dark:text-amber-400 dark:bg-amber-500/10 rounded-md transition-all"
                                    >
                                      <i className="ki-outline ki-plus text-[10px]" /> Nueva
                                      actividad
                                    </button>
                                  </div>

                                  {actividades.length === 0 ? (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 italic px-2 py-1">
                                      Sin actividades en esta fase.
                                    </p>
                                  ) : (
                                    actividades.map((actividad) => {
                                      const actividadOpen = expandedActividades.has(actividad.id);
                                      const raps = actividad.fase_proyecto_raps ?? [];

                                      return (
                                        <div
                                          key={actividad.id}
                                          className="border border-gray-100 dark:border-coal-300 rounded-md overflow-hidden ml-2"
                                        >
                                          <div className="flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-coal-400/30 transition-colors">
                                            <button
                                              onClick={() => toggleActividad(actividad.id)}
                                              className="flex-1 flex items-center justify-between gap-2 px-3 py-2 text-left min-w-0"
                                            >
                                              <div className="flex items-center gap-2 min-w-0">
                                                <i className="ki-outline ki-task text-amber-500 text-xs shrink-0" />
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                                  {actividad.descripcionActividad}
                                                </span>
                                              </div>
                                              <i
                                                className={`ki-outline ki-down text-gray-400 text-[10px] transition-transform shrink-0 ${
                                                  actividadOpen ? 'rotate-180' : ''
                                                }`}
                                              />
                                            </button>
                                            <div className="flex items-center gap-0.5 pr-2 shrink-0">
                                              <button
                                                onClick={() =>
                                                  openEditActividad(proyecto.id, fase.id, actividad)
                                                }
                                                title="Editar actividad"
                                                className="w-6 h-6 flex items-center justify-center rounded text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-colors"
                                              >
                                                <i className="ki-outline ki-pencil text-[10px]" />
                                              </button>
                                              <button
                                                onClick={() =>
                                                  setDeleteActividad({
                                                    proyectoId: proyecto.id,
                                                    faseId: fase.id,
                                                    actividad
                                                  })
                                                }
                                                title="Eliminar actividad"
                                                className="w-6 h-6 flex items-center justify-center rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors"
                                              >
                                                <i className="ki-outline ki-trash text-[10px]" />
                                              </button>
                                            </div>
                                          </div>

                                          {/* Materias / RAP de la actividad */}
                                          {actividadOpen && (
                                            <div className="px-3 pb-2.5 pt-1 space-y-1.5 bg-gray-50/50 dark:bg-coal-400/20">
                                              <div className="flex justify-end">
                                                <button
                                                  onClick={() =>
                                                    openRapModal(proyecto.id, fase.id, actividad)
                                                  }
                                                  className="flex items-center gap-1 px-2 py-1 text-[10px] bg-blue-50 hover:bg-blue-100 font-semibold text-blue-700 dark:text-blue-400 dark:bg-blue-500/10 rounded-md transition-all"
                                                >
                                                  <i className="ki-outline ki-plus text-[9px]" />{' '}
                                                  Asignar materia
                                                </button>
                                              </div>

                                              {raps.length === 0 ? (
                                                <p className="text-[11px] text-gray-400 dark:text-gray-500 italic">
                                                  Sin RAP/materias asociadas.
                                                </p>
                                              ) : (
                                                raps.map((rap) => (
                                                  <div
                                                    key={rap.id}
                                                    className="flex items-start gap-2 px-2.5 py-2 bg-white dark:bg-coal-500 border border-gray-100 dark:border-coal-300 rounded-md"
                                                  >
                                                    <i className="ki-outline ki-book-open text-blue-400 text-xs mt-0.5 shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                      <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300 leading-snug">
                                                        <span className="text-blue-500 dark:text-blue-400">
                                                          {rap.materia.codigo}
                                                        </span>{' '}
                                                        — {rap.materia.nombreMateria}
                                                      </p>
                                                      <div className="flex items-center gap-2 mt-1">
                                                        {rap.materia.horas && (
                                                          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
                                                            <i className="ki-outline ki-time text-[10px]" />
                                                            {rap.materia.horas} h
                                                          </span>
                                                        )}
                                                        {rap.materia.creditos != null && (
                                                          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
                                                            <i className="ki-outline ki-medal-star text-[10px]" />
                                                            {rap.materia.creditos}{' '}
                                                            {rap.materia.creditos === 1
                                                              ? 'crédito'
                                                              : 'créditos'}
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                    <button
                                                      onClick={() =>
                                                        setDeleteRap({
                                                          proyectoId: proyecto.id,
                                                          faseId: fase.id,
                                                          actividadId: actividad.id,
                                                          rap
                                                        })
                                                      }
                                                      title="Quitar materia"
                                                      className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 hover:text-red-600 transition-colors shrink-0"
                                                    >
                                                      <i className="ki-outline ki-trash text-[10px]" />
                                                    </button>
                                                  </div>
                                                ))
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Crear/Editar Proyecto ── */}
      {proyectoModalOpen && (
        <Modal open onClose={closeProyectoModal} className="mx-4 sm:mx-auto max-w-lg w-full">
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>
                {editProyecto ? 'Editar proyecto' : 'Nuevo proyecto formativo'}
              </ModalTitle>
              <button
                onClick={closeProyectoModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5 space-y-4">
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/30 rounded-lg px-3 py-2">
                <i className="ki-outline ki-information-2 text-sm" />
                Los campos se guardarán en mayúsculas automáticamente.
              </p>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Nombre del proyecto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={proyectoForm.nombreProyecto}
                  onChange={(e) =>
                    setProyectoForm({
                      ...proyectoForm,
                      nombreProyecto: e.target.value.toUpperCase()
                    })
                  }
                  placeholder="NOMBRE DEL PROYECTO"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Versión <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={proyectoForm.version}
                  onChange={(e) =>
                    setProyectoForm({ ...proyectoForm, version: e.target.value.toUpperCase() })
                  }
                  placeholder="EJ: V1.0"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Estado
                </label>
                <select
                  value={proyectoForm.estado}
                  onChange={(e) =>
                    setProyectoForm({
                      ...proyectoForm,
                      estado: e.target.value as ProyectoFormativo['estado']
                    })
                  }
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Documento{' '}
                  <span className="text-gray-400 font-normal">(PDF, DOC, DOCX — máx. 10MB)</span>
                </label>

                {/* Documento actual en edición */}
                {editProyecto?.rutaDocumentoUrl && !documentoFile && (
                  <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg">
                    <i className="ki-outline ki-document text-green-600 dark:text-green-400 text-sm" />
                    <a
                      href={editProyecto.rutaDocumentoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-green-700 dark:text-green-400 font-medium hover:underline flex-1 truncate"
                    >
                      Documento actual
                    </a>
                    <span className="text-xs text-gray-400">Sube uno nuevo para reemplazarlo</span>
                  </div>
                )}

                {/* Archivo seleccionado */}
                {documentoFile && (
                  <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg">
                    <i className="ki-outline ki-document text-blue-500 text-sm" />
                    <span className="text-xs text-blue-700 dark:text-blue-400 font-medium flex-1 truncate">
                      {documentoFile.name}
                    </span>
                    <button
                      onClick={() => setDocumentoFile(null)}
                      className="text-blue-400 hover:text-blue-600 transition-colors"
                    >
                      <i className="ki-outline ki-cross text-xs" />
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setDocumentoFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-500/10 dark:file:text-blue-400 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  onClick={closeProyectoModal}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-coal-400 hover:bg-gray-100 dark:hover:bg-coal-300 font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-coal-300 rounded-lg transition-all disabled:opacity-50"
                >
                  <i className="ki-outline ki-cross-circle text-sm" /> Cancelar
                </button>
                <button
                  onClick={handleSaveProyecto}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 font-semibold text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="ki-outline ki-check-circle text-sm" />
                  )}
                  {saving ? 'Guardando...' : editProyecto ? 'Guardar cambios' : 'Crear proyecto'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* ── Modal Confirmar Eliminar Proyecto ── */}
      {deleteProyecto && (
        <Modal
          open
          onClose={() => setDeleteProyecto(null)}
          className="mx-4 sm:mx-auto max-w-sm w-full"
        >
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>Confirmar eliminación</ModalTitle>
              <button
                onClick={() => setDeleteProyecto(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                  <i className="ki-outline ki-trash text-red-600 dark:text-red-400 text-base" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    ¿Eliminar este proyecto?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {deleteProyecto.nombreProyecto}
                    </span>{' '}
                    — v{deleteProyecto.version}
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  onClick={() => setDeleteProyecto(null)}
                  disabled={!!deleting}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteProyecto}
                  disabled={!!deleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all disabled:opacity-50"
                >
                  {deleting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="ki-outline ki-trash text-sm" />
                  )}
                  {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* ── Modal Crear/Editar Fase ── */}
      {faseModalOpen && (
        <Modal open onClose={closeFaseModal} className="mx-4 sm:mx-auto max-w-lg w-full">
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>{editFase ? 'Editar fase' : 'Nueva fase'}</ModalTitle>
              <button
                onClick={closeFaseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Descripción de la fase <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={faseForm.descripcionFase}
                  onChange={(e) => setFaseForm({ descripcionFase: e.target.value.toUpperCase() })}
                  placeholder="EJ: ANÁLISIS"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  onClick={closeFaseModal}
                  disabled={savingFase}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-coal-400 hover:bg-gray-100 dark:hover:bg-coal-300 font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-coal-300 rounded-lg transition-all disabled:opacity-50"
                >
                  <i className="ki-outline ki-cross-circle text-sm" /> Cancelar
                </button>
                <button
                  onClick={handleSaveFase}
                  disabled={savingFase}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 font-semibold text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all disabled:opacity-50"
                >
                  {savingFase ? (
                    <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="ki-outline ki-check-circle text-sm" />
                  )}
                  {savingFase ? 'Guardando...' : editFase ? 'Guardar cambios' : 'Crear fase'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* ── Modal Confirmar Eliminar Fase ── */}
      {deleteFase && (
        <Modal open onClose={() => setDeleteFase(null)} className="mx-4 sm:mx-auto max-w-sm w-full">
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>Confirmar eliminación</ModalTitle>
              <button
                onClick={() => setDeleteFase(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                  <i className="ki-outline ki-trash text-red-600 dark:text-red-400 text-base" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    ¿Eliminar esta fase?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                    {deleteFase.fase.descripcionFase}
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                    Se eliminarán también sus actividades y RAP asociados. Esta acción no se puede
                    deshacer.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  onClick={() => setDeleteFase(null)}
                  disabled={!!deletingFase}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteFase}
                  disabled={!!deletingFase}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all disabled:opacity-50"
                >
                  {deletingFase ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="ki-outline ki-trash text-sm" />
                  )}
                  {deletingFase ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* ── Modal Crear/Editar Actividad ── */}
      {actividadModalOpen && (
        <Modal open onClose={closeActividadModal} className="mx-4 sm:mx-auto max-w-lg w-full">
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>{editActividad ? 'Editar actividad' : 'Nueva actividad'}</ModalTitle>
              <button
                onClick={closeActividadModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Descripción de la actividad <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={actividadForm.descripcionActividad}
                  onChange={(e) =>
                    setActividadForm({ descripcionActividad: e.target.value.toUpperCase() })
                  }
                  placeholder="DESCRIPCIÓN DE LA ACTIVIDAD"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  onClick={closeActividadModal}
                  disabled={savingActividad}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-coal-400 hover:bg-gray-100 dark:hover:bg-coal-300 font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-coal-300 rounded-lg transition-all disabled:opacity-50"
                >
                  <i className="ki-outline ki-cross-circle text-sm" /> Cancelar
                </button>
                <button
                  onClick={handleSaveActividad}
                  disabled={savingActividad}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 font-semibold text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all disabled:opacity-50"
                >
                  {savingActividad ? (
                    <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="ki-outline ki-check-circle text-sm" />
                  )}
                  {savingActividad
                    ? 'Guardando...'
                    : editActividad
                      ? 'Guardar cambios'
                      : 'Crear actividad'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* ── Modal Confirmar Eliminar Actividad ── */}
      {deleteActividad && (
        <Modal
          open
          onClose={() => setDeleteActividad(null)}
          className="mx-4 sm:mx-auto max-w-sm w-full"
        >
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>Confirmar eliminación</ModalTitle>
              <button
                onClick={() => setDeleteActividad(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                  <i className="ki-outline ki-trash text-red-600 dark:text-red-400 text-base" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    ¿Eliminar esta actividad?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {deleteActividad.actividad.descripcionActividad}
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                    Se eliminarán también sus RAP/materias asociadas. Esta acción no se puede
                    deshacer.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  onClick={() => setDeleteActividad(null)}
                  disabled={!!deletingActividad}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteActividad}
                  disabled={!!deletingActividad}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all disabled:opacity-50"
                >
                  {deletingActividad ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="ki-outline ki-trash text-sm" />
                  )}
                  {deletingActividad ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* ── Modal Asignar Materias/RAP ── */}
      {rapModalOpen && rapModalCtx && (
        <Modal open onClose={closeRapModal} className="mx-4 sm:mx-auto max-w-lg w-full">
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>Asignar materias</ModalTitle>
              <button
                onClick={closeRapModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5 space-y-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg">
                <i className="ki-outline ki-task text-amber-500 text-sm shrink-0" />
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 truncate">
                  {rapModalCtx.actividad.descripcionActividad}
                </p>
              </div>

              {/* Chips de materias seleccionadas */}
              {selectedMateriaIds.size > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedMateriasList.map((m) => (
                    <span
                      key={m.id}
                      className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-full text-xs font-medium text-blue-700 dark:text-blue-400"
                    >
                      {m.codigo ? `[${m.codigo}] ` : ''}
                      {m.nombreMateria}
                      <button
                        onClick={() => toggleMateriaSeleccionada(m.id)}
                        className="ml-0.5 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                      >
                        <i className="ki-outline ki-cross text-[10px]" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => setSelectedMateriaIds(new Set())}
                    className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-1"
                  >
                    Limpiar todo
                  </button>
                </div>
              )}

              {/* Buscador de materias */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Buscar materias disponibles
                </label>
                <div className="relative">
                  <i className="ki-outline ki-magnifier absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                  <input
                    type="text"
                    value={searchMateria}
                    onChange={(e) => setSearchMateria(e.target.value)}
                    placeholder="Escribe al menos 2 caracteres..."
                    className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {searchMateria.trim().length > 0 && searchMateria.trim().length < 2 && (
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <i className="ki-outline ki-information-2 text-xs" />
                    Escribe al menos 2 caracteres para buscar.
                  </p>
                )}

                {materiasFiltradas.length > 0 && (
                  <div className="mt-1.5 border border-gray-200 dark:border-coal-300 rounded-lg overflow-hidden bg-white dark:bg-coal-400 shadow-sm divide-y divide-gray-100 dark:divide-coal-300 max-h-64 overflow-y-auto">
                    {materiasFiltradas.map((materia) => {
                      const checked = selectedMateriaIds.has(materia.id);
                      return (
                        <label
                          key={materia.id}
                          className={[
                            'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors select-none',
                            checked
                              ? 'bg-blue-50 dark:bg-blue-500/10'
                              : 'hover:bg-gray-50 dark:hover:bg-coal-300'
                          ].join(' ')}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMateriaSeleccionada(materia.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                              {materia.nombreMateria}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {materia.codigo && (
                                <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                                  {materia.codigo}
                                </span>
                              )}
                            </div>
                          </div>
                          {checked && (
                            <i className="ki-outline ki-check-circle text-blue-500 dark:text-blue-400 text-sm shrink-0" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}

                {searchMateria.trim().length >= 2 && materiasFiltradas.length === 0 && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <i className="ki-outline ki-information-2 text-xs" />
                    No se encontraron materias disponibles.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  onClick={closeRapModal}
                  disabled={savingRap}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-coal-400 hover:bg-gray-100 dark:hover:bg-coal-300 font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-coal-300 rounded-lg transition-all disabled:opacity-50"
                >
                  <i className="ki-outline ki-cross-circle text-sm" /> Cerrar
                </button>
                <button
                  onClick={handleAsignarRap}
                  disabled={savingRap || selectedMateriaIds.size === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 font-semibold text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all disabled:opacity-50"
                >
                  {savingRap ? (
                    <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="ki-outline ki-check-circle text-sm" />
                  )}
                  {savingRap
                    ? 'Asignando...'
                    : `Asignar ${selectedMateriaIds.size || ''} materia${
                        selectedMateriaIds.size !== 1 ? 's' : ''
                      }`}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* ── Modal Confirmar Desasignar Materia/RAP ── */}
      {deleteRap && (
        <Modal open onClose={() => setDeleteRap(null)} className="mx-4 sm:mx-auto max-w-sm w-full">
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>Confirmar desasignación</ModalTitle>
              <button
                onClick={() => setDeleteRap(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                  <i className="ki-outline ki-trash text-red-600 dark:text-red-400 text-base" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    ¿Quitar esta materia?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                    {deleteRap.rap.materia.nombreMateria}
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                    Se eliminará la asignación de esta materia a la actividad.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  onClick={() => setDeleteRap(null)}
                  disabled={!!deletingRap}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDesasignarRap}
                  disabled={!!deletingRap}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all disabled:opacity-50"
                >
                  {deletingRap ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="ki-outline ki-trash text-sm" />
                  )}
                  {deletingRap ? 'Quitando...' : 'Sí, quitar'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default ProyectoFormativoEntry;
