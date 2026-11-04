import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';

interface FaseProyecto {
  id: number;
  descripcionFase: string;
  idProyectoFormativo: number;
}

interface ProyectoFormativo {
  id: number;
  nombreProyecto: string;
  version: string;
  estado: 'ACTIVO' | 'INACTIVO';
  idPrograma: number;
  rutaDocumentoUrl: string | null;
}

const EMPTY_FASE_FORM = { descripcionFase: '' };

const ESTADO_STYLES: Record<ProyectoFormativo['estado'], string> = {
  ACTIVO: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  INACTIVO: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
};

const ProyectoFormativoDetalle: React.FC = () => {
  const { idPrograma, idRed, idProyecto } = useParams<{
    idPrograma: string;
    idRed: string;
    idProyecto: string;
  }>();
  const navigate = useNavigate();

  const [proyecto, setProyecto] = useState<ProyectoFormativo | null>(null);
  const [loadingProyecto, setLoadingProyecto] = useState(true);

  const [fases, setFases] = useState<FaseProyecto[]>([]);
  const [loadingFases, setLoadingFases] = useState(true);

  // Modal crear/editar fase
  const [faseModalOpen, setFaseModalOpen] = useState(false);
  const [editFase, setEditFase] = useState<FaseProyecto | null>(null);
  const [faseForm, setFaseForm] = useState(EMPTY_FASE_FORM);
  const [savingFase, setSavingFase] = useState(false);
  const [deleteFase, setDeleteFase] = useState<FaseProyecto | null>(null);
  const [deletingFase, setDeletingFase] = useState<number | null>(null);

  // Modal crear/editar fase

  useEffect(() => {
    fetchProyecto();
    fetchFases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idProyecto]);

  const fetchProyecto = async () => {
    setLoadingProyecto(true);
    try {
      const res = await axios.get(`proyectos-formativos/${idProyecto}`);
      setProyecto(res.data);
    } catch {
      enqueueSnackbar('Error al cargar el proyecto.', { variant: 'error' });
    } finally {
      setLoadingProyecto(false);
    }
  };

  const fetchFases = async () => {
    setLoadingFases(true);
    try {
      const res = await axios.get('fases-proyecto', {
        params: { idProyectoFormativo: idProyecto }
      });
      setFases(res.data);
    } catch {
      enqueueSnackbar('Error al cargar las fases.', { variant: 'error' });
    } finally {
      setLoadingFases(false);
    }
  };

  const openCreateFase = () => {
    setEditFase(null);
    setFaseForm(EMPTY_FASE_FORM);
    setFaseModalOpen(true);
  };

  const openEditFase = (fase: FaseProyecto) => {
    setEditFase(fase);
    setFaseForm({ descripcionFase: fase.descripcionFase });
    setFaseModalOpen(true);
  };

  const closeFaseModal = () => {
    setFaseModalOpen(false);
    setEditFase(null);
    setFaseForm(EMPTY_FASE_FORM);
  };

  const handleSaveFase = async () => {
    if (!faseForm.descripcionFase.trim()) {
      enqueueSnackbar('La descripción es obligatoria.', { variant: 'warning' });
      return;
    }
    setSavingFase(true);
    try {
      if (editFase) {
        const res = await axios.put(`fases-proyecto/${editFase.id}`, faseForm);
        setFases((prev) => prev.map((f) => (f.id === editFase.id ? res.data : f)));
        enqueueSnackbar('Fase actualizada.', { variant: 'success' });
      } else {
        const res = await axios.post('fases-proyecto', {
          ...faseForm,
          idProyectoFormativo: Number(idProyecto)
        });
        setFases((prev) => [...prev, res.data]);
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
    setDeletingFase(deleteFase.id);
    try {
      await axios.delete(`fases-proyecto/${deleteFase.id}`);
      setFases((prev) => prev.filter((f) => f.id !== deleteFase.id));
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

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      {/* Header con botón regresar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 dark:bg-coal-400 dark:hover:bg-coal-300 text-gray-600 dark:text-gray-300 rounded-lg transition-colors"
          >
            <i className="ki-outline ki-arrow-left text-lg" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Detalles del Proyecto
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Información y fases del proyecto formativo
            </p>
          </div>
        </div>
      </div>

      {/* Tarjeta del proyecto */}
      {loadingProyecto ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : proyecto ? (
        <div className="mb-8 p-6 bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 shadow-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                <i className="ki-outline ki-document text-blue-600 dark:text-blue-400 text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white leading-snug">
                  {proyecto.nombreProyecto}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[proyecto.estado]}`}
                  >
                    {proyecto.estado}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <i className="ki-outline ki-tag text-xs" />
                    Versión:{' '}
                    <span className="font-medium text-gray-600 dark:text-gray-300">
                      {proyecto.version}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {proyecto.rutaDocumentoUrl && (
            <a
              href={proyecto.rutaDocumentoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 rounded-lg transition-all"
            >
              <i className="ki-outline ki-document text-sm" />
              Ver documento PDF
            </a>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
          No se encontró el proyecto.
        </div>
      )}

      {/* Fases del Proyecto */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Fases del Proyecto</h2>
        <button
          onClick={openCreateFase}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm shadow-blue-500/20"
        >
          <i className="ki-outline ki-plus text-sm" />
          Nueva fase
        </button>
      </div>

      <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 shadow-sm p-5">
        {loadingFases ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fases.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            <i className="ki-outline ki-abstract-26 text-3xl mb-2 block" />
            No hay fases registradas para este proyecto.
          </div>
        ) : (
          <div className="space-y-3">
            {fases.map((fase, index) => (
              <div
                key={fase.id}
                className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-coal-400/50 hover:bg-gray-100 dark:hover:bg-coal-400 transition-colors rounded-lg border border-gray-100 dark:border-coal-300"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {fase.descripcionFase}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <button
                    onClick={() =>
                      navigate(
                        `/gestion-academica/configuracion/redes/programas/${idRed}/proyecto/${idPrograma}/fase/${fase.id}`
                      )
                    }
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-purple-50 hover:bg-purple-100 font-semibold text-purple-700 dark:text-purple-400 dark:bg-purple-500/10 rounded-lg transition-all"
                  >
                    <i className="ki-outline ki-list text-xs" /> Actividades
                  </button>
                  <button
                    onClick={() =>
                      navigate(
                        `/gestion-academica/configuracion/redes/programas/${idRed}/proyecto/${idPrograma}/fase/${fase.id}/competencias`
                      )
                    }
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 font-semibold text-blue-700 dark:text-blue-400 dark:bg-blue-500/10 rounded-lg transition-all"
                  >
                    <i className="ki-outline ki-book text-xs" /> Competencias
                  </button>
                  <button
                    onClick={() => openEditFase(fase)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700 dark:text-gray-300 dark:bg-coal-300 rounded-lg transition-all"
                  >
                    <i className="ki-outline ki-pencil text-xs" /> Editar
                  </button>
                  <button
                    onClick={() => setDeleteFase(fase)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 font-semibold text-red-700 dark:text-red-400 dark:bg-red-500/10 rounded-lg transition-all"
                  >
                    <i className="ki-outline ki-trash text-xs" /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Crear/Editar Fase ── */}
      {faseModalOpen && (
        <Modal open onClose={closeFaseModal} className="mx-4 sm:mx-auto max-w-md w-full">
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
                <textarea
                  value={faseForm.descripcionFase}
                  onChange={(e) => setFaseForm({ descripcionFase: e.target.value.toUpperCase() })}
                  placeholder="DESCRIPCIÓN DE LA FASE"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {deleteFase.descripcionFase}
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                    Esta acción no se puede deshacer.
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
    </div>
  );
};

export default ProyectoFormativoDetalle;
