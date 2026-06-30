import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/auth';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';

interface Ficha {
  id: number;
  codigo: string;
  codigoFicha?: string;
}

interface PortafolioDocumento {
  id: number;
  descripcion: string;
  urlDocumento?: string | null;
  idPortafolioFichas: number;
  urlDocumentoUrl?: string | null;
}

interface PortafolioFicha {
  id: number;
  descripcion: string;
  idPortafolio: number;
  idFicha: number;
  ficha?: Ficha;
  portafolio_documentos?: PortafolioDocumento[];
}

interface Portafolio {
  id: number;
  descripcion: string;
  idContrato: number;
  portafolio_fichas?: PortafolioFicha[];
}

const EMPTY_PORTAFOLIO_FORM = { descripcion: '' };
const EMPTY_FICHA_FORM = { descripcion: '', idFicha: 0 };
const EMPTY_DOCUMENTO_FORM = { descripcion: '' };

const PortafolioInstructorGeneral: React.FC = () => {
  const authContext = useAuthContext();
  const idContrato = authContext.persona?.contrato[0]?.id;

  const [portafolios, setPortafolios] = useState<Portafolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [downloadingZip, setDownloadingZip] = useState<number | null>(null);

  const [fichasDisponibles, setFichasDisponibles] = useState<Ficha[]>([]);

  const [previewPdf, setPreviewPdf] = useState<{ url: string; nombre: string } | null>(null);

  const [expandedPortafolio, setExpandedPortafolio] = useState<number | null>(null);
  const [expandedFichas, setExpandedFichas] = useState<Set<number>>(new Set());

  const [portafolioModalOpen, setPortafolioModalOpen] = useState(false);
  const [editPortafolio, setEditPortafolio] = useState<Portafolio | null>(null);
  const [portafolioForm, setPortafolioForm] = useState(EMPTY_PORTAFOLIO_FORM);
  const [deletePortafolio, setDeletePortafolio] = useState<Portafolio | null>(null);

  const [fichaModalOpen, setFichaModalOpen] = useState(false);
  const [fichaModalPortafolioId, setFichaModalPortafolioId] = useState<number | null>(null);
  const [editFicha, setEditFicha] = useState<PortafolioFicha | null>(null);
  const [fichaForm, setFichaForm] = useState(EMPTY_FICHA_FORM);
  const [savingFicha, setSavingFicha] = useState(false);
  const [deleteFicha, setDeleteFicha] = useState<{
    portafolioId: number;
    ficha: PortafolioFicha;
  } | null>(null);
  const [deletingFicha, setDeletingFicha] = useState<number | null>(null);

  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docModalCtx, setDocModalCtx] = useState<{ portafolioId: number; fichaId: number } | null>(
    null
  );
  const [editDoc, setEditDoc] = useState<PortafolioDocumento | null>(null);
  const [docForm, setDocForm] = useState(EMPTY_DOCUMENTO_FORM);
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  const [savingDoc, setSavingDoc] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<{
    portafolioId: number;
    fichaId: number;
    doc: PortafolioDocumento;
  } | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<number | null>(null);

  useEffect(() => {
    if (idContrato) {
      fetchPortafolios();
      fetchFichasInstructor();
    }
  }, [idContrato]);

  const fetchPortafolios = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`portafolios/instructor/${idContrato}`);
      setPortafolios(res.data.data || res.data);
    } catch (error) {
      enqueueSnackbar('Error al cargar portafolios.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFichasInstructor = async () => {
    try {
      const res = await axios.get(`instructores/fichas?idContrato=${idContrato}`);
      setFichasDisponibles(res.data);
    } catch (error) {
      // Ignorar error si no se pueden cargar
    }
  };

  const togglePortafolio = (id: number) => {
    setExpandedPortafolio((prev) => (prev === id ? null : id));
  };

  const toggleFicha = (id: number) => {
    setExpandedFichas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const updatePortafolio = (id: number, updater: (p: Portafolio) => Portafolio) => {
    setPortafolios((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));
  };

  const updateFicha = (
    portafolioId: number,
    fichaId: number,
    updater: (f: PortafolioFicha) => PortafolioFicha
  ) => {
    updatePortafolio(portafolioId, (p) => ({
      ...p,
      portafolioFichas: (p.portafolio_fichas ?? []).map((f) => (f.id === fichaId ? updater(f) : f))
    }));
  };

  const openCreatePortafolio = () => {
    setEditPortafolio(null);
    setPortafolioForm(EMPTY_PORTAFOLIO_FORM);
    setPortafolioModalOpen(true);
  };

  const openEditPortafolio = (p: Portafolio) => {
    setEditPortafolio(p);
    setPortafolioForm({ descripcion: p.descripcion });
    setPortafolioModalOpen(true);
  };

  const closePortafolioModal = () => {
    setPortafolioModalOpen(false);
    setEditPortafolio(null);
    setPortafolioForm(EMPTY_PORTAFOLIO_FORM);
  };

  const handleSavePortafolio = async () => {
    if (!portafolioForm.descripcion.trim()) {
      enqueueSnackbar('La descripción es obligatoria.', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      if (editPortafolio) {
        const res = await axios.put(`portafolios/${editPortafolio.id}`, {
          ...portafolioForm,
          idContrato
        });
        updatePortafolio(editPortafolio.id, (p) => ({
          ...p,
          ...(res.data.data || res.data),
          portafolioFichas: p.portafolio_fichas
        }));
        enqueueSnackbar('Portafolio actualizado.', { variant: 'success' });
      } else {
        const res = await axios.post('portafolios', { ...portafolioForm, idContrato });
        setPortafolios((prev) => [
          ...prev,
          { ...(res.data.data || res.data), portafolioFichas: [] }
        ]);
        enqueueSnackbar('Portafolio creado.', { variant: 'success' });
      }
      closePortafolioModal();
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al guardar.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePortafolio = async () => {
    if (!deletePortafolio) return;
    setDeleting(deletePortafolio.id);
    try {
      await axios.delete(`portafolios/${deletePortafolio.id}`);
      setPortafolios((prev) => prev.filter((p) => p.id !== deletePortafolio.id));
      enqueueSnackbar('Portafolio eliminado.', { variant: 'success' });
      setDeletePortafolio(null);
    } catch (error: any) {
      enqueueSnackbar('Error al eliminar.', { variant: 'error' });
    } finally {
      setDeleting(null);
    }
  };

  const openCreateFicha = (portafolioId: number) => {
    setFichaModalPortafolioId(portafolioId);
    setEditFicha(null);
    setFichaForm(EMPTY_FICHA_FORM);
    setFichaModalOpen(true);
  };

  const openEditFicha = (portafolioId: number, ficha: PortafolioFicha) => {
    setFichaModalPortafolioId(portafolioId);
    setEditFicha(ficha);
    setFichaForm({ descripcion: ficha.descripcion, idFicha: ficha.idFicha });
    setFichaModalOpen(true);
  };

  const closeFichaModal = () => {
    setFichaModalOpen(false);
    setFichaModalPortafolioId(null);
    setEditFicha(null);
    setFichaForm(EMPTY_FICHA_FORM);
  };

  const handleSaveFicha = async () => {
    if (!fichaForm.descripcion.trim() || !fichaForm.idFicha) {
      enqueueSnackbar('La descripción y ficha son obligatorias.', { variant: 'warning' });
      return;
    }
    if (!fichaModalPortafolioId) return;
    setSavingFicha(true);
    try {
      if (editFicha) {
        const res = await axios.put(`portafolio-fichas/${editFicha.id}`, fichaForm);
        updateFicha(fichaModalPortafolioId, editFicha.id, (f) => ({
          ...f,
          ...(res.data.data || res.data),
          portafolioDocumentos: f.portafolio_documentos
        }));
        enqueueSnackbar('Ficha actualizada.', { variant: 'success' });
      } else {
        const res = await axios.post('portafolio-fichas', {
          ...fichaForm,
          idPortafolio: fichaModalPortafolioId
        });
        updatePortafolio(fichaModalPortafolioId, (p) => ({
          ...p,
          portafolioFichas: [
            ...(p.portafolio_fichas ?? []),
            { ...(res.data.data || res.data), portafolio_documentos: [] }
          ]
        }));
        enqueueSnackbar('Ficha asignada.', { variant: 'success' });
      }
      closeFichaModal();
    } catch (error: any) {
      enqueueSnackbar('Error al guardar.', { variant: 'error' });
    } finally {
      setSavingFicha(false);
    }
  };

  const handleDeleteFicha = async () => {
    if (!deleteFicha) return;
    setDeletingFicha(deleteFicha.ficha.id);
    try {
      await axios.delete(`portafolio-fichas/${deleteFicha.ficha.id}`);
      updatePortafolio(deleteFicha.portafolioId, (p) => ({
        ...p,
        portafolioFichas: (p.portafolio_fichas ?? []).filter((f) => f.id !== deleteFicha.ficha.id)
      }));
      enqueueSnackbar('Ficha desasignada.', { variant: 'success' });
      setDeleteFicha(null);
    } catch (error) {
      enqueueSnackbar('Error al eliminar.', { variant: 'error' });
    } finally {
      setDeletingFicha(null);
    }
  };

  const openCreateDoc = (portafolioId: number, fichaId: number) => {
    setDocModalCtx({ portafolioId, fichaId });
    setEditDoc(null);
    setDocForm(EMPTY_DOCUMENTO_FORM);
    setDocumentoFile(null);
    setDocModalOpen(true);
  };

  const openEditDoc = (portafolioId: number, fichaId: number, doc: PortafolioDocumento) => {
    setDocModalCtx({ portafolioId, fichaId });
    setEditDoc(doc);
    setDocForm({ descripcion: doc.descripcion });
    setDocumentoFile(null);
    setDocModalOpen(true);
  };

  const closeDocModal = () => {
    setDocModalOpen(false);
    setDocModalCtx(null);
    setEditDoc(null);
    setDocForm(EMPTY_DOCUMENTO_FORM);
    setDocumentoFile(null);
  };

  const handleSaveDoc = async () => {
    if (!docForm.descripcion.trim()) {
      enqueueSnackbar('La descripción es obligatoria.', { variant: 'warning' });
      return;
    }
    if (!docModalCtx) return;
    const { portafolioId, fichaId } = docModalCtx;
    setSavingDoc(true);
    try {
      const formData = new FormData();
      formData.append('descripcion', docForm.descripcion);
      formData.append('idPortafolioFichas', String(fichaId));
      if (documentoFile) formData.append('documento', documentoFile);

      if (editDoc) {
        const res = await axios.post(`portafolio-documentos/${editDoc.id}?_method=PUT`, formData);
        updateFicha(portafolioId, fichaId, (f) => ({
          ...f,
          portafolioDocumentos: (f.portafolio_documentos ?? []).map((d) =>
            d.id === editDoc.id ? { ...d, ...(res.data.data || res.data) } : d
          )
        }));
        enqueueSnackbar('Documento actualizado.', { variant: 'success' });
      } else {
        const res = await axios.post('portafolio-documentos', formData);
        updateFicha(portafolioId, fichaId, (f) => ({
          ...f,
          portafolioDocumentos: [...(f.portafolio_documentos ?? []), res.data.data || res.data]
        }));
        enqueueSnackbar('Documento creado.', { variant: 'success' });
      }
      closeDocModal();
    } catch (error) {
      enqueueSnackbar('Error al guardar documento.', { variant: 'error' });
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDoc = async () => {
    if (!deleteDoc) return;
    const { portafolioId, fichaId, doc } = deleteDoc;
    setDeletingDoc(doc.id);
    try {
      await axios.delete(`portafolio-documentos/${doc.id}`);
      updateFicha(portafolioId, fichaId, (f) => ({
        ...f,
        portafolioDocumentos: (f.portafolio_documentos ?? []).filter((d) => d.id !== doc.id)
      }));
      enqueueSnackbar('Documento eliminado.', { variant: 'success' });
      setDeleteDoc(null);
    } catch (error) {
      enqueueSnackbar('Error al eliminar.', { variant: 'error' });
    } finally {
      setDeletingDoc(null);
    }
  };

  const handleDownloadZip = async (portafolioId: number, descripcion: string) => {
    setDownloadingZip(portafolioId);
    try {
      const response = await axios.get(`portafolios/${portafolioId}/descargar-zip`, {
        responseType: 'blob' // Important to receive binary data
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${descripcion.replace(/\s+/g, '_')}.zip`);
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) link.parentNode.removeChild(link);
      enqueueSnackbar('Portafolio descargado correctamente.', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error al descargar el portafolio.', { variant: 'error' });
    } finally {
      setDownloadingZip(null);
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Portafolios del Instructor
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de portafolios, fichas y documentos
          </p>
        </div>
        <button
          onClick={openCreatePortafolio}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm shadow-blue-500/20"
        >
          <i className="ki-outline ki-plus text-sm" />
          Nuevo portafolio
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : portafolios.length === 0 ? (
        <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 py-16 text-center text-sm text-gray-400 dark:text-gray-500">
          <i className="ki-outline ki-folder text-3xl mb-2 block" />
          No hay portafolios registrados.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {portafolios.map((portafolio) => {
            const isOpen = expandedPortafolio === portafolio.id;
            const fichas = portafolio.portafolio_fichas ?? [];
            const totalDocs = fichas.reduce(
              (acc, f) => acc + (f.portafolio_documentos?.length ?? 0),
              0
            );

            return (
              <div
                key={portafolio.id}
                className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => togglePortafolio(portafolio.id)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50/60 dark:hover:bg-coal-400/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                      <i className="ki-outline ki-folder text-blue-600 dark:text-blue-400 text-base" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-white leading-snug truncate">
                        {portafolio.descripcion}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {fichas.length} {fichas.length === 1 ? 'ficha' : 'fichas'}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {totalDocs} {totalDocs === 1 ? 'documento' : 'documentos'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <i
                      className={`ki-outline ki-down text-gray-400 text-sm transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-coal-300 p-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openEditPortafolio(portafolio)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 font-semibold text-blue-700 dark:text-blue-400 dark:bg-blue-500/10 rounded-lg transition-all"
                      >
                        <i className="ki-outline ki-pencil text-sm" /> Editar
                      </button>
                      <button
                        onClick={() => handleDownloadZip(portafolio.id, portafolio.descripcion)}
                        disabled={downloadingZip === portafolio.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 font-semibold text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/10 rounded-lg transition-all disabled:opacity-50"
                      >
                        {downloadingZip === portafolio.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <i className="ki-outline ki-file-down text-sm" />
                        )}
                        Descargar
                      </button>
                      <button
                        onClick={() => setDeletePortafolio(portafolio)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 font-semibold text-red-700 dark:text-red-400 dark:bg-red-500/10 rounded-lg transition-all"
                      >
                        <i className="ki-outline ki-trash text-sm" /> Eliminar
                      </button>
                    </div>

                    {fichas.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic px-1">
                        Este portafolio aún no tiene fichas registradas.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {fichas.map((ficha) => {
                          const fichaOpen = expandedFichas.has(ficha.id);
                          const documentos = ficha.portafolio_documentos ?? [];

                          return (
                            <div
                              key={ficha.id}
                              className="border border-gray-200 dark:border-coal-300 rounded-lg overflow-hidden"
                            >
                              <div className="flex items-center gap-2 bg-gray-50 dark:bg-coal-400/40 hover:bg-gray-100 dark:hover:bg-coal-400/60 transition-colors">
                                <button
                                  onClick={() => toggleFicha(ficha.id)}
                                  className="flex-1 flex items-center justify-between gap-2 px-3 py-2.5 text-left min-w-0"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <i className="ki-outline ki-element-11 text-purple-500 text-sm shrink-0" />
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
                                      {ficha.descripcion}{' '}
                                      {ficha.ficha?.codigo ? `(${ficha.ficha.codigo})` : ''}
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                                      ({documentos.length}{' '}
                                      {documentos.length === 1 ? 'doc' : 'docs'})
                                    </span>
                                  </div>
                                  <i
                                    className={`ki-outline ki-down text-gray-400 text-xs transition-transform shrink-0 ${
                                      fichaOpen ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>
                                <div className="flex items-center gap-1 pr-2 shrink-0"></div>
                              </div>

                              {fichaOpen && (
                                <div className="p-2 space-y-1.5 bg-white dark:bg-coal-500">
                                  <div className="flex justify-end px-1"></div>

                                  {documentos.length === 0 ? (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 italic px-2 py-1">
                                      Sin documentos en esta ficha.
                                    </p>
                                  ) : (
                                    <div className="space-y-1.5">
                                      {documentos.map((doc) => (
                                        <div
                                          key={doc.id}
                                          className="flex items-center gap-2 px-3 py-2 bg-gray-50/50 dark:bg-coal-400/20 border border-gray-100 dark:border-coal-300 rounded-md ml-2"
                                        >
                                          <i className="ki-outline ki-document text-amber-500 text-xs shrink-0" />
                                          <div className="min-w-0 flex-1 flex items-center gap-2">
                                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                              {doc.descripcion}
                                            </p>
                                            {doc.urlDocumentoUrl && (
                                              <button
                                                onClick={() => {
                                                  const url = doc.urlDocumentoUrl!;
                                                  const isPdf = url.toLowerCase().endsWith('.pdf') || doc.descripcion.toLowerCase().endsWith('.pdf');
                                                  if (isPdf) {
                                                    setPreviewPdf({
                                                      url: url,
                                                      nombre: doc.descripcion
                                                    });
                                                  } else {
                                                    window.open(url, '_blank');
                                                  }
                                                }}
                                                title={(doc.urlDocumentoUrl!.toLowerCase().endsWith('.pdf') || doc.descripcion.toLowerCase().endsWith('.pdf')) ? "Previsualizar PDF" : "Descargar Documento"}
                                                className="w-6 h-6 flex items-center justify-center rounded text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors"
                                              >
                                                <i className={`ki-outline ${(doc.urlDocumentoUrl!.toLowerCase().endsWith('.pdf') || doc.descripcion.toLowerCase().endsWith('.pdf')) ? 'ki-eye' : 'ki-file-down'} text-[10px]`} />
                                              </button>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-0.5 shrink-0">
                                            <button
                                              onClick={() =>
                                                openEditDoc(portafolio.id, ficha.id, doc)
                                              }
                                              title="Editar documento"
                                              className="w-6 h-6 flex items-center justify-center rounded text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-colors"
                                            >
                                              <i className="ki-outline ki-pencil text-[10px]" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
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

      {previewPdf && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setPreviewPdf(null)}
        >
          <div
            className="bg-white dark:bg-coal-500 rounded-xl shadow-2xl flex flex-col"
            style={{ width: '90vw', height: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-coal-300 shrink-0">
              <div className="flex items-center gap-2">
                <i className="ki-outline ki-document text-amber-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs">
                  {previewPdf.nombre}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPdf.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  Abrir en pestaña
                </a>
                <button
                  onClick={() => setPreviewPdf(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-coal-400 transition-colors"
                >
                  <i className="ki-outline ki-cross text-sm text-gray-500" />
                </button>
              </div>
            </div>

            {/* iframe */}
            <iframe
              src={previewPdf.url}
              className="flex-1 w-full rounded-b-xl"
              title={previewPdf.nombre}
            />
          </div>
        </div>
      )}

      {portafolioModalOpen && (
        <Modal open onClose={closePortafolioModal} className="mx-4 sm:mx-auto max-w-lg w-full">
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>{editPortafolio ? 'Editar portafolio' : 'Nuevo portafolio'}</ModalTitle>
              <button
                onClick={closePortafolioModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={portafolioForm.descripcion}
                  onChange={(e) =>
                    setPortafolioForm({
                      ...portafolioForm,
                      descripcion: e.target.value.toUpperCase()
                    })
                  }
                  placeholder="EJ: PORTAFOLIO 2026"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  onClick={closePortafolioModal}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-coal-400 hover:bg-gray-100 dark:hover:bg-coal-300 font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-coal-300 rounded-lg transition-all disabled:opacity-50"
                >
                  <i className="ki-outline ki-cross-circle text-sm" /> Cancelar
                </button>
                <button
                  onClick={handleSavePortafolio}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 font-semibold text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="ki-outline ki-check-circle text-sm" />
                  )}
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {deletePortafolio && (
        <Modal
          open
          onClose={() => setDeletePortafolio(null)}
          className="mx-4 sm:mx-auto max-w-sm w-full"
        >
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>Confirmar eliminación</ModalTitle>
              <button
                onClick={() => setDeletePortafolio(null)}
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
                    ¿Eliminar este portafolio?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {deletePortafolio.descripcion}
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  onClick={() => setDeletePortafolio(null)}
                  disabled={!!deleting}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeletePortafolio}
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

      {fichaModalOpen && (
        <Modal open onClose={closeFichaModal} className="mx-4 sm:mx-auto max-w-lg w-full">
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>{editFicha ? 'Editar ficha' : 'Nueva ficha'}</ModalTitle>
              <button
                onClick={closeFichaModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Ficha <span className="text-red-500">*</span>
                </label>
                <select
                  value={fichaForm.idFicha || ''}
                  onChange={(e) => {
                    const selectedFicha = fichasDisponibles.find(
                      (f: any) => f.idFicha === Number(e.target.value)
                    );
                    setFichaForm({
                      ...fichaForm,
                      idFicha: Number(e.target.value),
                      descripcion: selectedFicha ? `Ficha ${selectedFicha.codigoFicha}` : ''
                    });
                  }}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Seleccione una ficha...</option>
                  {fichasDisponibles.map((f: any, index) => (
                    <option key={index} value={f.idFicha}>
                      {f.codigoFicha}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campo descripción - solo lectura */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={fichaForm.descripcion || ''}
                  readOnly
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-gray-100 dark:bg-coal-500 text-gray-500 dark:text-gray-400 cursor-not-allowed focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  onClick={closeFichaModal}
                  disabled={savingFicha}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-coal-400 hover:bg-gray-100 dark:hover:bg-coal-300 font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-coal-300 rounded-lg transition-all disabled:opacity-50"
                >
                  <i className="ki-outline ki-cross-circle text-sm" /> Cancelar
                </button>
                <button
                  onClick={handleSaveFicha}
                  disabled={savingFicha}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 font-semibold text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all disabled:opacity-50"
                >
                  {savingFicha ? (
                    <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="ki-outline ki-check-circle text-sm" />
                  )}
                  {savingFicha ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {deleteFicha && (
        <Modal
          open
          onClose={() => setDeleteFicha(null)}
          className="mx-4 sm:mx-auto max-w-sm w-full"
        >
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>Confirmar eliminación</ModalTitle>
              <button
                onClick={() => setDeleteFicha(null)}
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
                    ¿Eliminar esta ficha?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                    {deleteFicha.ficha.descripcion}
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  onClick={() => setDeleteFicha(null)}
                  disabled={!!deletingFicha}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteFicha}
                  disabled={!!deletingFicha}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all disabled:opacity-50"
                >
                  {deletingFicha ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="ki-outline ki-trash text-sm" />
                  )}
                  {deletingFicha ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {docModalOpen && (
        <Modal open onClose={closeDocModal} className="mx-4 sm:mx-auto max-w-lg w-full">
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>{editDoc ? 'Editar documento' : 'Nuevo documento'}</ModalTitle>
              <button
                onClick={closeDocModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={docForm.descripcion}
                  onChange={(e) => setDocForm({ descripcion: e.target.value.toUpperCase() })}
                  placeholder="EJ: PLAN DE TRABAJO"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Archivo{' '}
                  <span className="text-gray-400 font-normal">
                    (PDF, DOC, DOCX, XLS, XLSX — máx. 10MB)
                  </span>
                </label>
                {editDoc?.urlDocumentoUrl && !documentoFile && (
                  <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg">
                    <i className="ki-outline ki-document text-green-600 dark:text-green-400 text-sm" />
                    <a
                      href={editDoc.urlDocumentoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-green-700 dark:text-green-400 font-medium hover:underline flex-1 truncate"
                    >
                      Documento actual
                    </a>
                  </div>
                )}
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
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setDocumentoFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-500/10 dark:file:text-blue-400 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  onClick={closeDocModal}
                  disabled={savingDoc}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-coal-400 hover:bg-gray-100 dark:hover:bg-coal-300 font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-coal-300 rounded-lg transition-all disabled:opacity-50"
                >
                  <i className="ki-outline ki-cross-circle text-sm" /> Cancelar
                </button>
                <button
                  onClick={handleSaveDoc}
                  disabled={savingDoc}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 font-semibold text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all disabled:opacity-50"
                >
                  {savingDoc ? (
                    <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="ki-outline ki-check-circle text-sm" />
                  )}
                  {savingDoc ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {deleteDoc && (
        <Modal open onClose={() => setDeleteDoc(null)} className="mx-4 sm:mx-auto max-w-sm w-full">
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>Confirmar eliminación</ModalTitle>
              <button
                onClick={() => setDeleteDoc(null)}
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
                    ¿Eliminar este documento?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {deleteDoc.doc.descripcion}
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  onClick={() => setDeleteDoc(null)}
                  disabled={!!deletingDoc}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteDoc}
                  disabled={!!deletingDoc}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all disabled:opacity-50"
                >
                  {deletingDoc ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <i className="ki-outline ki-trash text-sm" />
                  )}
                  {deletingDoc ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default PortafolioInstructorGeneral;
