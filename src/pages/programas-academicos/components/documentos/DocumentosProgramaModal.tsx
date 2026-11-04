import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Program } from '../../types';
import { VerDocumentosFichaModal } from './VerDocumentosFichaModal';
import { CrearProcesoModal } from './CrearProcesoModal';
import { CrearTipoDocumentoModal } from './CrearTipoDocumentoModal';
import { AsignarTiposDocumentoModal } from './AsignarTiposDocumentoModal';

interface ProcesoItem {
  id: number;
  nombreProceso: string;
  descripcion?: string;
}

interface DocumentoProceso {
  id: number;
  codigo: number;
  tipoDocumento: string;
  descripcion?: string;
  activo: boolean;
}

interface DocumentosProgramaModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program | null;
}

export const DocumentosProgramaModal = ({
  isOpen,
  onClose,
  program,
}: DocumentosProgramaModalProps) => {
  const [procesos, setProcesos] = useState<ProcesoItem[]>([]);
  const [fichas, setFichas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFichas, setLoadingFichas] = useState(false);
  const [crearProcesoOpen, setCrearProcesoOpen] = useState(false);
  const [asignarFicha, setAsignarFicha] = useState<any | null>(null);
  const [verFicha, setVerFicha] = useState<any | null>(null);
  const [crearDocumentoOpen, setCrearDocumentoOpen] = useState(false);
  const [verDocumento, setVerDocumento] = useState<any | null>(null);
  const [editarDocumento, setEditarDocumento] = useState<any | null>(null);
  
  // Estado para procesos expandidos y sus documentos
  const [procesosExpandidos, setProcesosExpandidos] = useState<Set<number>>(new Set());
  const [documentosPorProceso, setDocumentosPorProceso] = useState<Record<number, DocumentoProceso[]>>({});
  const [loadingDocsProceso, setLoadingDocsProceso] = useState<Record<number, boolean>>({});
  const [procesoActualParaAgregar, setProcesoActualParaAgregar] = useState<number | null>(null);
  const [asignarProcesoAFicha, setAsignarProcesoAFicha] = useState<{ procesoId: number } | null>(null);
  const [asignandoPrograma, setAsignandoPrograma] = useState<number | null>(null);
  const [asignandoFicha, setAsignandoFicha] = useState<number | null>(null);

  const loadProcesos = async () => {
    setLoading(true);
    try {
      const res = await axios.get('procesos');
      const list = Array.isArray(res.data) ? res.data : [];
      setProcesos(list);
    } catch {
      setProcesos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFichas = async () => {
    if (!program?.id) return;
    setLoadingFichas(true);
    try {
      const res = await axios.get(`programa/${program.id}/fichas`);
      if (res.data?.status === 'success' && Array.isArray(res.data?.data)) {
        setFichas(res.data.data);
      } else {
        setFichas([]);
      }
    } catch {
      setFichas([]);
    } finally {
      setLoadingFichas(false);
    }
  };

  const loadDocumentosProceso = async (idProceso: number) => {
    setLoadingDocsProceso((prev) => ({ ...prev, [idProceso]: true }));
    try {
      const res = await axios.get(`proceso/${idProceso}/documentos-autorizados`);
      if (res.data?.status === 'success' && Array.isArray(res.data?.data?.documentos)) {
        setDocumentosPorProceso((prev) => ({
          ...prev,
          [idProceso]: res.data.data.documentos,
        }));
      } else {
        setDocumentosPorProceso((prev) => ({
          ...prev,
          [idProceso]: [],
        }));
      }
    } catch {
      setDocumentosPorProceso((prev) => ({
        ...prev,
        [idProceso]: [],
      }));
    } finally {
      setLoadingDocsProceso((prev) => ({ ...prev, [idProceso]: false }));
    }
  };

  const toggleExpandirProceso = (idProceso: number) => {
    const nuevoExpandidos = new Set(procesosExpandidos);
    if (nuevoExpandidos.has(idProceso)) {
      nuevoExpandidos.delete(idProceso);
    } else {
      nuevoExpandidos.add(idProceso);
      // Cargar documentos si no están cargados
      if (!documentosPorProceso[idProceso]) {
        loadDocumentosProceso(idProceso);
      }
    }
    setProcesosExpandidos(nuevoExpandidos);
  };

  const toggleActivoDocumento = async (idProceso: number, idTipoDocumento: number, activo: boolean) => {
    try {
      // Actualizar estado local primero
      setDocumentosPorProceso((prev) => ({
        ...prev,
        [idProceso]: prev[idProceso]?.map((doc) =>
          doc.id === idTipoDocumento ? { ...doc, activo } : doc
        ) || [],
      }));
      
      // Por ahora, solo actualizamos localmente ya que no hay endpoint específico
      // Si necesitas persistir, puedes usar el endpoint de asignación
    } catch (e: any) {
      console.error('Error al cambiar estado:', e);
      alert(e?.response?.data?.message || 'Error al cambiar estado del documento.');
      // Revertir cambio
      loadDocumentosProceso(idProceso);
    }
  };

  const handleEliminarDocumentoProceso = async (idProceso: number, idTipoDocumento: number, nombreDocumento: string) => {
    if (!confirm(`¿Eliminar el documento "${nombreDocumento}" de este proceso?`)) return;
    try {
      await axios.delete(`proceso/${idProceso}/documento/${idTipoDocumento}`);
      // Recargar documentos del proceso
      loadDocumentosProceso(idProceso);
    } catch (e: any) {
      console.error('Error al eliminar documento:', e);
      alert(e?.response?.data?.message || 'Error al eliminar el documento.');
    }
  };

  const handleAsignarProcesoAPrograma = async (idProceso: number) => {
    if (!program?.id) return;
    setAsignandoPrograma(idProceso);
    try {
      const res = await axios.get(`proceso/${idProceso}/documentos-autorizados`);
      const docs = res.data?.data?.documentos ?? [];
      for (const doc of docs) {
        await axios.put(`programa/${program.id}/documento/${doc.id}/autorizar`, { activo: true });
      }
      if (docs.length) alert(`Se asignaron ${docs.length} documento(s) al programa.`);
      else alert('Este proceso no tiene documentos para asignar.');
    } catch (e: any) {
      console.error('Error al asignar proceso a programa:', e);
      alert(e?.response?.data?.message || 'Error al asignar proceso al programa.');
    } finally {
      setAsignandoPrograma(null);
    }
  };

  const handleAsignarProcesoAFicha = async (idProceso: number, ficha: any) => {
    const idFicha = ficha?.id;
    if (!idFicha) return;
    setAsignandoFicha(idProceso);
    try {
      const resProceso = await axios.get(`proceso/${idProceso}/documentos-autorizados`);
      const idsProceso = (resProceso.data?.data?.documentos ?? []).map((d: any) => d.id);
      if (!idsProceso.length) {
        alert('Este proceso no tiene documentos para asignar.');
        setAsignandoFicha(null);
        setAsignarProcesoAFicha(null);
        return;
      }
      const resFicha = await axios.get(`ficha/${idFicha}/tipos-documento`);
      const asignados = resFicha.data?.data?.asignados ?? [];
      const unicos = [...new Set([...asignados, ...idsProceso])];
      await axios.put(`ficha/${idFicha}/tipos-documento`, { ids: unicos });
      alert(`Se asignaron los documentos del proceso a la ficha ${ficha.grado?.nombreGrado ?? `#${idFicha}`}.`);
      loadFichas();
    } catch (e: any) {
      console.error('Error al asignar proceso a ficha:', e);
      alert(e?.response?.data?.message || 'Error al asignar proceso a la ficha.');
    } finally {
      setAsignandoFicha(null);
      setAsignarProcesoAFicha(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProcesos();
      loadFichas();
    } else {
      setProcesos([]);
      setFichas([]);
      setProcesosExpandidos(new Set());
      setDocumentosPorProceso({});
      setAsignarFicha(null);
      setVerFicha(null);
    }
  }, [isOpen, program?.id]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-coal-600 rounded-xl shadow-lg border border-gray-200 dark:border-coal-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-coal-100 bg-gray-50 dark:bg-coal-200 flex-shrink-0">
            <h2 className="text-base font-bold uppercase tracking-wider text-gray-800 dark:text-white">
              Documentos – {program?.name ?? 'Programa'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-danger/10 text-danger hover:bg-danger hover:text-white"
            >
              <i className="text-lg ki-filled ki-cross" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                Procesos
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCrearProcesoOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold uppercase rounded-lg bg-primary text-white hover:bg-primary-active"
                >
                  + Agregar proceso
                </button>
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : procesos.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic py-6 text-center">
                No hay procesos. Use el botón "+ Agregar proceso" para crear.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-coal-100">
                      <th className="py-2 pr-4 font-bold uppercase text-gray-600 dark:text-gray-400 w-12"></th>
                      <th className="py-2 pr-4 font-bold uppercase text-gray-600 dark:text-gray-400">Código</th>
                      <th className="py-2 pr-4 font-bold uppercase text-gray-600 dark:text-gray-400">Nombre</th>
                      <th className="py-2 pr-4 font-bold uppercase text-gray-600 dark:text-gray-400">Descripción</th>
                      <th className="py-2 font-bold uppercase text-gray-600 dark:text-gray-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {procesos.map((p) => {
                      const expandido = procesosExpandidos.has(p.id);
                      const documentos = documentosPorProceso[p.id] || [];
                      const cargandoDocs = loadingDocsProceso[p.id] || false;
                      
                      return (
                        <React.Fragment key={`proceso-${p.id}`}>
                          <tr className="border-b border-gray-100 dark:border-coal-100/50">
                            <td className="py-2 pr-4">
                              <button
                                type="button"
                                onClick={() => toggleExpandirProceso(p.id)}
                                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-primary/10 hover:text-primary transition-colors"
                                title={expandido ? 'Colapsar' : 'Expandir'}
                              >
                                <i className={`text-lg ki-outline ${expandido ? 'ki-up' : 'ki-down'}`} />
                              </button>
                            </td>
                            <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{p.id}</td>
                            <td className="py-2 pr-4 font-medium text-gray-800 dark:text-white">{p.nombreProceso}</td>
                            <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">{p.descripcion ?? '—'}</td>
                            <td className="py-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {program?.id && (
                                  <button
                                    type="button"
                                    onClick={() => handleAsignarProcesoAPrograma(p.id)}
                                    disabled={!!asignandoPrograma}
                                    title="Asignar documentos de este proceso al programa"
                                    className="px-2 py-1 text-xs font-bold uppercase rounded bg-primary/10 text-primary hover:bg-primary hover:text-white disabled:opacity-50 transition-colors"
                                  >
                                    {asignandoPrograma === p.id ? '…' : 'Asignar a programa'}
                                  </button>
                                )}
                                {fichas.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setAsignarProcesoAFicha({ procesoId: p.id })}
                                    disabled={!!asignandoFicha}
                                    title="Asignar documentos de este proceso a una ficha"
                                    className="px-2 py-1 text-xs font-bold uppercase rounded bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white disabled:opacity-50 transition-colors"
                                  >
                                    {asignandoFicha === p.id ? '…' : 'Asignar a ficha'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {expandido && (
                            <tr>
                              <td colSpan={5} className="p-0">
                                <div className="bg-gray-50 dark:bg-coal-200/30 p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                      Documentos del proceso
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProcesoActualParaAgregar(p.id);
                                        setCrearDocumentoOpen(true);
                                      }}
                                      className="px-2 py-1 text-xs font-bold uppercase rounded bg-primary text-white hover:bg-primary-active"
                                    >
                                      + Agregar documento
                                    </button>
                                  </div>
                                  {cargandoDocs ? (
                                    <div className="flex justify-center py-4">
                                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                  ) : documentos.length === 0 ? (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 italic py-2 text-center">
                                      No hay documentos en este proceso. Use "+ Agregar documento" para agregar.
                                    </p>
                                  ) : (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left text-xs">
                                        <thead>
                                          <tr className="border-b border-gray-200 dark:border-coal-100">
                                            <th className="py-2 pr-3 font-bold uppercase text-gray-600 dark:text-gray-400">Código</th>
                                            <th className="py-2 pr-3 font-bold uppercase text-gray-600 dark:text-gray-400">Tipo de documento</th>
                                            <th className="py-2 pr-3 font-bold uppercase text-gray-600 dark:text-gray-400">Descripción</th>
                                            <th className="py-2 font-bold uppercase text-gray-600 dark:text-gray-400">Acciones</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {documentos.map((doc) => (
                                            <tr key={`doc-${doc.id}`} className="border-b border-gray-100 dark:border-coal-100/50">
                                              <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{doc.codigo}</td>
                                              <td className="py-2 pr-3 font-medium text-gray-800 dark:text-white">{doc.tipoDocumento}</td>
                                              <td className="py-2 pr-3 text-gray-600 dark:text-gray-400">{doc.descripcion || '—'}</td>
                                              <td className="py-2">
                                                <div className="flex items-center gap-2">
                                                  {/* Toggle Activo/Inactivo */}
                                                  <button
                                                    type="button"
                                                    onClick={() => toggleActivoDocumento(p.id, doc.id, !doc.activo)}
                                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
                                                      doc.activo ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}
                                                    title={doc.activo ? 'Activo - Click para inactivar' : 'Inactivo - Click para activar'}
                                                  >
                                                    <span
                                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                        doc.activo ? 'translate-x-4' : 'translate-x-0.5'
                                                      }`}
                                                    />
                                                  </button>
                                                  {/* Botón Ver */}
                                                  <button
                                                    type="button"
                                                    onClick={() => setVerDocumento(doc)}
                                                    title="Ver detalles"
                                                    className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-primary/10 hover:text-primary transition-colors"
                                                  >
                                                    <i className="text-sm ki-outline ki-eye" />
                                                  </button>
                                                  {/* Botón Editar */}
                                                  <button
                                                    type="button"
                                                    onClick={() => setEditarDocumento({ ...doc, idProceso: p.id })}
                                                    title="Editar"
                                                    className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                                                  >
                                                    <i className="text-sm ki-outline ki-pencil" />
                                                  </button>
                                                  {/* Botón Eliminar */}
                                                  <button
                                                    type="button"
                                                    onClick={() => handleEliminarDocumentoProceso(p.id, doc.id, doc.tipoDocumento)}
                                                    title="Eliminar"
                                                    className="flex items-center justify-center w-7 h-7 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                                                  >
                                                    <i className="text-sm ki-outline ki-trash" />
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sección Fichas del programa - Asignar documentos */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-coal-100">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                Fichas del programa
              </h3>
              {loadingFichas ? (
                <div className="flex justify-center py-6">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : fichas.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic py-4 text-center">
                  No hay fichas para este programa.
                </p>
              ) : (
                <div className="space-y-3">
                  {fichas.map((f) => (
                    <div
                      key={f.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 dark:border-coal-100 bg-gray-50 dark:bg-coal-200/50"
                    >
                      <span className="font-medium text-gray-800 dark:text-white">
                        {f.grado?.nombreGrado ?? `Ficha #${f.id}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAsignarFicha(f)}
                          className="px-3 py-1.5 text-xs font-bold uppercase rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                        >
                          Asignar documentos
                        </button>
                        <button
                          type="button"
                          onClick={() => setVerFicha(f)}
                          className="px-3 py-1.5 text-xs font-bold uppercase rounded-lg bg-gray-200 dark:bg-coal-400 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-coal-300 transition-colors"
                        >
                          Ver documentos
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end px-5 py-4 border-t border-gray-200 dark:border-coal-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold uppercase rounded-lg bg-gray-200 dark:bg-coal-400 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-coal-300"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <CrearProcesoModal
        isOpen={crearProcesoOpen}
        onClose={() => {
          setCrearProcesoOpen(false);
          setProcesoActualParaAgregar(null);
        }}
        onSave={() => {
          setCrearProcesoOpen(false);
          setProcesoActualParaAgregar(null);
          loadProcesos();
        }}
      />

      <AsignarTiposDocumentoModal
        isOpen={!!asignarFicha}
        onClose={() => setAsignarFicha(null)}
        onSave={() => {
          setAsignarFicha(null);
          loadFichas();
        }}
        ficha={asignarFicha}
      />
      <VerDocumentosFichaModal
        isOpen={!!verFicha}
        onClose={() => setVerFicha(null)}
        ficha={verFicha}
      />

      <CrearTipoDocumentoModal
        isOpen={crearDocumentoOpen}
        onClose={() => {
          setCrearDocumentoOpen(false);
          setProcesoActualParaAgregar(null);
        }}
        idProcesoFijo={procesoActualParaAgregar}
        onSave={async () => {
          if (procesoActualParaAgregar) {
            loadDocumentosProceso(procesoActualParaAgregar);
          }
          setCrearDocumentoOpen(false);
          setProcesoActualParaAgregar(null);
        }}
      />

      {/* Modal para elegir ficha al asignar proceso */}
      {asignarProcesoAFicha && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-coal-600 rounded-xl shadow-lg border border-gray-200 dark:border-coal-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-coal-100 bg-gray-50 dark:bg-coal-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-white">
                Asignar proceso a ficha
              </h3>
              <button
                type="button"
                onClick={() => setAsignarProcesoAFicha(null)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-danger/10 text-danger hover:bg-danger hover:text-white transition-colors"
              >
                <i className="text-lg ki-filled ki-cross" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Elija la ficha a la que asignar los documentos del proceso:
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {fichas.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleAsignarProcesoAFicha(asignarProcesoAFicha.procesoId, f)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 dark:border-coal-100 hover:bg-primary/10 hover:border-primary/30 transition-colors text-left"
                  >
                    <span className="font-medium text-gray-800 dark:text-white">
                      {f.grado?.nombreGrado ?? `Ficha #${f.id}`}
                    </span>
                    <i className="text-primary ki-outline ki-right" />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end px-5 py-4 border-t border-gray-200 dark:border-coal-100">
              <button
                type="button"
                onClick={() => setAsignarProcesoAFicha(null)}
                className="px-4 py-2 text-sm font-bold uppercase rounded-lg bg-gray-200 dark:bg-coal-400 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-coal-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal simple para ver detalles del documento */}
      {verDocumento && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-coal-600 rounded-xl shadow-lg border border-gray-200 dark:border-coal-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-coal-100 bg-gray-50 dark:bg-coal-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-white">
                Detalles del documento
              </h3>
              <button
                type="button"
                onClick={() => setVerDocumento(null)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-danger/10 text-danger hover:bg-danger hover:text-white transition-colors"
              >
                <i className="text-lg ki-filled ki-cross" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                  Código
                </label>
                <p className="text-sm text-gray-800 dark:text-white">{verDocumento.codigo}</p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                  Tipo de documento
                </label>
                <p className="text-sm text-gray-800 dark:text-white">{verDocumento.tipoDocumento}</p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                  Descripción
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">{verDocumento.descripcion || '—'}</p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                  Estado
                </label>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${verDocumento.activo ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {verDocumento.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end px-5 py-4 border-t border-gray-200 dark:border-coal-100">
              <button
                type="button"
                onClick={() => setVerDocumento(null)}
                className="px-4 py-2 text-sm font-bold uppercase rounded-lg bg-gray-200 dark:bg-coal-400 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-coal-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar documento - Por ahora solo muestra, puedes implementar el formulario completo */}
      {editarDocumento && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-coal-600 rounded-xl shadow-lg border border-gray-200 dark:border-coal-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-coal-100 bg-gray-50 dark:bg-coal-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-white">
                Editar documento
              </h3>
              <button
                type="button"
                onClick={() => setEditarDocumento(null)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-danger/10 text-danger hover:bg-danger hover:text-white transition-colors"
              >
                <i className="text-lg ki-filled ki-cross" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Funcionalidad de edición en desarrollo. Por ahora puedes eliminar y crear uno nuevo.
              </p>
            </div>
            <div className="flex justify-end px-5 py-4 border-t border-gray-200 dark:border-coal-100">
              <button
                type="button"
                onClick={() => setEditarDocumento(null)}
                className="px-4 py-2 text-sm font-bold uppercase rounded-lg bg-gray-200 dark:bg-coal-400 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-coal-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
