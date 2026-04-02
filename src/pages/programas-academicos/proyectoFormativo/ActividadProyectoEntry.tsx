import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';

interface FaseProyecto {
  id: number;
  descripcionFase: string;
  // Acepta ambos formatos por si el backend retorna snake_case
  proyectoFormativo?: {
    id: number;
    nombreProyecto: string;
    version: string;
  };
  proyecto_formativo?: {
    id: number;
    nombreProyecto: string;
    version: string;
  };
}

interface ActividadProyecto {
  id: number;
  descripcionActividad: string;
  idFaseProyecto: number;
}

const EMPTY_FORM = { descripcionActividad: '' };

const ActividadProyectoEntry: React.FC = () => {
  const { idPrograma, idFase } = useParams<{ idPrograma: string; idFase: string }>();
  const navigate = useNavigate();

  const [fase, setFase] = useState<FaseProyecto | null>(null);
  const [actividades, setActividades] = useState<ActividadProyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Modal crear/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ActividadProyecto | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Modal confirmar eliminar
  const [deleteTarget, setDeleteTarget] = useState<ActividadProyecto | null>(null);

  useEffect(() => {
    fetchData();
  }, [idFase]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resFase, resActividades] = await Promise.all([
        axios.get(`fases-proyecto/${idFase}`),
        axios.get('actividades-proyecto', { params: { idFaseProyecto: idFase } })
      ]);
      setFase(resFase.data);
      setActividades(resActividades.data);
    } catch {
      enqueueSnackbar('Error al cargar los datos.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (actividad: ActividadProyecto) => {
    setEditTarget(actividad);
    setForm({ descripcionActividad: actividad.descripcionActividad });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.descripcionActividad.trim()) {
      enqueueSnackbar('La descripción es obligatoria.', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        const res = await axios.put(`actividades-proyecto/${editTarget.id}`, form);
        setActividades((prev) => prev.map((a) => (a.id === editTarget.id ? res.data : a)));
        enqueueSnackbar('Actividad actualizada.', { variant: 'success' });
      } else {
        const res = await axios.post('actividades-proyecto', {
          ...form,
          idFaseProyecto: Number(idFase)
        });
        setActividades((prev) => [...prev, res.data]);
        enqueueSnackbar('Actividad creada.', { variant: 'success' });
      }
      closeModal();
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al guardar.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    try {
      await axios.delete(`actividades-proyecto/${deleteTarget.id}`);
      setActividades((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      enqueueSnackbar('Actividad eliminada.', { variant: 'success' });
      setDeleteTarget(null);
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al eliminar.', { variant: 'error' });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      {/* Breadcrumb / navegación */}
      <button
        onClick={() =>
          navigate(-1)
        }
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors mb-5"
      >
        <i className="ki-outline ki-left text-xs" />
        Volver a proyectos
      </button>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Actividades</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de actividades de la fase
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm shadow-blue-500/20"
        >
          <i className="ki-outline ki-plus text-sm" />
          Nueva actividad
        </button>
      </div>

      {/* Banner fase/proyecto */}
      {fase && (
        <div className="mb-6 px-5 py-4 bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
            <i className="ki-outline ki-abstract-26 text-purple-600 dark:text-purple-400 text-base" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 dark:text-gray-500">Fase</p>
            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
              {fase.descripcionFase}
            </p>
            {(() => {
              const proyecto = fase.proyectoFormativo ?? fase.proyecto_formativo;
              return proyecto ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                  <i className="ki-outline ki-document text-xs" />
                  Proyecto:
                  <span className="font-medium text-gray-600 dark:text-gray-300 ml-1">
                    {proyecto.nombreProyecto} — v{proyecto.version}
                  </span>
                </p>
              ) : null;
            })()}
          </div>
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-coal-400 px-2.5 py-1 rounded-full shrink-0">
            {actividades.length} actividad{actividades.length !== 1 ? 'es' : ''}
          </span>
        </div>
      )}

      {/* Listado */}
      <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-coal-300 bg-gray-50/50 dark:bg-coal-500 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
            <i className="ki-outline ki-list text-purple-600 dark:text-purple-400 text-base" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
              Listado de actividades
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {actividades.length} actividad{actividades.length !== 1 ? 'es' : ''} registrada
              {actividades.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : actividades.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
            <i className="ki-outline ki-list text-3xl mb-2 block" />
            No hay actividades registradas para esta fase.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-coal-300">
            {actividades.map((actividad, index) => (
              <div
                key={actividad.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-coal-400/40 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                    {actividad.descripcionActividad}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button
                    onClick={() => openEdit(actividad)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 font-semibold text-blue-700 dark:text-blue-400 dark:bg-blue-500/10 rounded-lg transition-all"
                  >
                    <i className="ki-outline ki-pencil text-sm" /> Editar
                  </button>
                  <button
                    onClick={() => setDeleteTarget(actividad)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 font-semibold text-red-700 dark:text-red-400 dark:bg-red-500/10 rounded-lg transition-all"
                  >
                    <i className="ki-outline ki-trash text-sm" /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Crear/Editar ── */}
      {modalOpen && (
        <Modal open onClose={closeModal} className="mx-4 sm:mx-auto max-w-lg w-full">
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>{editTarget ? 'Editar actividad' : 'Nueva actividad'}</ModalTitle>
              <button
                onClick={closeModal}
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
                  value={form.descripcionActividad}
                  onChange={(e) => setForm({ descripcionActividad: e.target.value.toUpperCase() })}
                  placeholder="DESCRIPCIÓN DE LA ACTIVIDAD"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-coal-400 hover:bg-gray-100 dark:hover:bg-coal-300 font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-coal-300 rounded-lg transition-all disabled:opacity-50"
                >
                  <i className="ki-outline ki-cross-circle text-sm" /> Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 font-semibold text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="ki-outline ki-check-circle text-sm" />
                  )}
                  {saving ? 'Guardando...' : editTarget ? 'Guardar cambios' : 'Crear actividad'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* ── Modal Confirmar Eliminar ── */}
      {deleteTarget && (
        <Modal
          open
          onClose={() => setDeleteTarget(null)}
          className="mx-4 sm:mx-auto max-w-sm w-full"
        >
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>Confirmar eliminación</ModalTitle>
              <button
                onClick={() => setDeleteTarget(null)}
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
                    {deleteTarget.descripcionActividad}
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={!!deleting}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
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
    </div>
  );
};

export default ActividadProyectoEntry;
