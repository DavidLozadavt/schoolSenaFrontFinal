import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import FaseProyectoRapModal from './FaseProyectoRapModal';

interface FaseProyecto {
  id: number;
  descripcionFase: string;
  idProyectoFormativo: number;
}

interface Programa {
  id: number;
  nombrePrograma: string;
  codigoPrograma: string;
}

interface ProyectoFormativo {
  id: number;
  nombreProyecto: string;
  version: string;
  estado: 'ACTIVO' | 'INACTIVO';
  idPrograma: number;
  rutaDocumentoUrl: string | null;
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

const ProyectoFormativoEntry: React.FC = () => {
  const { idPrograma, idRed } = useParams<{ idPrograma: string; idRed: string }>();

  // Proyectos
  const [proyectos, setProyectos] = useState<ProyectoFormativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Modal crear/editar proyecto
  const [proyectoModalOpen, setProyectoModalOpen] = useState(false);
  const [editProyecto, setEditProyecto] = useState<ProyectoFormativo | null>(null);
  const [proyectoForm, setProyectoForm] = useState(EMPTY_PROYECTO_FORM);
  const [deleteProyecto, setDeleteProyecto] = useState<ProyectoFormativo | null>(null);
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  // Modal fases
  const [fasesProyecto, setFasesProyecto] = useState<ProyectoFormativo | null>(null);
  const [fases, setFases] = useState<FaseProyecto[]>([]);
  const [loadingFases, setLoadingFases] = useState(false);

  // Modal crear/editar fase
  const [faseModalOpen, setFaseModalOpen] = useState(false);
  const [editFase, setEditFase] = useState<FaseProyecto | null>(null);
  const [faseForm, setFaseForm] = useState(EMPTY_FASE_FORM);
  const [savingFase, setSavingFase] = useState(false);
  const [deleteFase, setDeleteFase] = useState<FaseProyecto | null>(null);
  const [deletingFase, setDeletingFase] = useState<number | null>(null);

  //Programa:
  const [programa, setPrograma] = useState<Programa | null>(null);

  //Asignacion de Raps a las fases del proyecto:
  const [rapModalFase, setRapModalFase] = useState<FaseProyecto | null>(null);

  const navigate = useNavigate();

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
        setProyectos((prev) => prev.map((p) => (p.id === editProyecto.id ? res.data : p)));
        enqueueSnackbar('Proyecto actualizado.', { variant: 'success' });
      } else {
        const res = await axios.post('proyectos-formativos', formData);
        setProyectos((prev) => [...prev, res.data]);
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

  // ── Fases handlers ──
  const openFasesModal = async (proyecto: ProyectoFormativo) => {
    setFasesProyecto(proyecto);
    setLoadingFases(true);
    try {
      const res = await axios.get('fases-proyecto', {
        params: { idProyectoFormativo: proyecto.id }
      });
      setFases(res.data);
    } catch {
      enqueueSnackbar('Error al cargar las fases.', { variant: 'error' });
    } finally {
      setLoadingFases(false);
    }
  };

  const closeFasesModal = () => {
    setFasesProyecto(null);
    setFases([]);
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
          idProyectoFormativo: fasesProyecto!.id
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
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Proyectos Formativos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de proyectos y sus fases
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

      {/* Grid de cards */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {proyectos.map((proyecto) => (
            <div
              key={proyecto.id}
              className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Card body */}
              <button
                onClick={() => openFasesModal(proyecto)}
                className="flex-1 p-5 text-left hover:bg-gray-50/50 dark:hover:bg-coal-400/30 transition-colors rounded-t-xl"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                    <i className="ki-outline ki-document text-blue-600 dark:text-blue-400 text-base" />
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_STYLES[proyecto.estado]}`}
                  >
                    {proyecto.estado}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-800 dark:text-white leading-snug mb-1">
                  {proyecto.nombreProyecto}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <i className="ki-outline ki-tag text-xs" />
                  Versión:{' '}
                  <span className="font-medium text-gray-600 dark:text-gray-300 ml-1">
                    {proyecto.version}
                  </span>
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-3 flex items-center gap-1">
                  <i className="ki-outline ki-eye text-xs" />
                  Ver fases
                </p>
                {proyecto.rutaDocumentoUrl && (
                  <a
                    href={proyecto.rutaDocumentoUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1 hover:underline"
                  >
                    <i className="ki-outline ki-document text-xs" />
                    Ver documento
                  </a>
                )}
              </button>

              {/* Card footer acciones */}
              <div className="px-4 py-3 border-t border-gray-100 dark:border-coal-300 flex gap-2">
                <button
                  onClick={() => openEditProyecto(proyecto)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 font-semibold text-blue-700 dark:text-blue-400 dark:bg-blue-500/10 rounded-lg transition-all"
                >
                  <i className="ki-outline ki-pencil text-sm" /> Editar
                </button>
                <button
                  onClick={() => setDeleteProyecto(proyecto)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-red-50 hover:bg-red-100 font-semibold text-red-700 dark:text-red-400 dark:bg-red-500/10 rounded-lg transition-all"
                >
                  <i className="ki-outline ki-trash text-sm" /> Eliminar
                </button>
              </div>
            </div>
          ))}
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

      {/* ── Modal Fases de los raps de las fases ── */}

      {rapModalFase && (
        <FaseProyectoRapModal
          idFaseProyecto={rapModalFase.id}
          descripcionFase={rapModalFase.descripcionFase}
          idPrograma={programa?.id}
          onClose={() => setRapModalFase(null)}
        />
      )}

      {/* ── Modal Fases del Proyecto ── */}
      {fasesProyecto && (
        <Modal open onClose={closeFasesModal} className="mx-4 sm:mx-auto max-w-2xl w-full">
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <div>
                <ModalTitle>Fases del proyecto</ModalTitle>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {fasesProyecto.nombreProyecto} — v{fasesProyecto.version}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openCreateFase}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 font-semibold text-blue-700 dark:text-blue-400 dark:bg-blue-500/10 rounded-lg transition-all"
                >
                  <i className="ki-outline ki-plus text-sm" /> Nueva fase
                </button>
                <button
                  onClick={closeFasesModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <i className="ki-outline ki-cross text-lg" />
                </button>
              </div>
            </ModalHeader>
            <ModalBody className="p-5">
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
                <div className="space-y-2">
                  {fases.map((fase, index) => (
                    <div
                      key={fase.id}
                      className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-coal-400 rounded-lg border border-gray-100 dark:border-coal-300"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
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
                          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-purple-50 hover:bg-purple-100 font-semibold text-purple-700 dark:text-purple-400 dark:bg-purple-500/10 rounded-lg transition-all"
                        >
                          <i className="ki-outline ki-list text-xs" /> Actividades
                        </button>
                        <button
                          onClick={() => openEditFase(fase)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-50 hover:bg-blue-100 font-semibold text-blue-700 dark:text-blue-400 dark:bg-blue-500/10 rounded-lg transition-all"
                        >
                          <i className="ki-outline ki-pencil text-xs" /> Editar
                        </button>
                        <button
                          onClick={() => setDeleteFase(fase)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 font-semibold text-red-700 dark:text-red-400 dark:bg-red-500/10 rounded-lg transition-all"
                        >
                          <i className="ki-outline ki-trash text-xs" /> Eliminar
                        </button>
                        {/** Botón dentro del listado de fases */}
                        <button
                          onClick={() => setRapModalFase(fase)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-purple-50 hover:bg-purple-100 font-semibold text-purple-700 dark:text-purple-400 dark:bg-purple-500/10 rounded-lg transition-all"
                        >
                          <i className="ki-outline ki-book text-xs" /> RAPs
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

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

export default ProyectoFormativoEntry;
