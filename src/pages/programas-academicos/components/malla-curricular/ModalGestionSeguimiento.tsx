import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  UserCircle,
  AlertTriangle,
  MessageSquare,
  Clock,
  Eye,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  Edit3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Contrato, ModalGestionSeguimientoProps, Seguimiento, DocumentoSeguimiento } from './interfaces/Seguimiento';

export const ModalGestionSeguimiento: React.FC<ModalGestionSeguimientoProps> = ({
  isOpen,
  onClose,
  aprendiz
}) => {
  const [seguimiento, setSeguimiento] = useState<Seguimiento | null>(null);
  const [loading, setLoading] = useState(false);
  const [creando, setCreando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [nombreDocumento, setNombreDocumento] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [instructores, setInstructores] = useState<Contrato[]>([]);
  const [idContrato, setIdContrato] = useState<number | null>(null);

  // Estados para Modal de Evaluación y Observaciones (reemplazo de window.prompt)
  const [docParaEvaluar, setDocParaEvaluar] = useState<DocumentoSeguimiento | null>(null);
  const [estadoEval, setEstadoEval] = useState<'APROBADO' | 'RECHAZADO' | 'PENDIENTE'>('RECHAZADO');
  const [observacionEval, setObservacionEval] = useState<string>('');
  const [guardandoEval, setGuardandoEval] = useState<boolean>(false);
  const [errorEval, setErrorEval] = useState<string | null>(null);

  // Estados para Modal de Confirmación de Eliminación (reemplazo de window.confirm)
  const [docParaEliminar, setDocParaEliminar] = useState<DocumentoSeguimiento | null>(null);
  const [eliminandoDoc, setEliminandoDoc] = useState<boolean>(false);

  // Plantillas de observación rápida para el instructor
  const SUGERENCIAS_OBSERVACION = [
    'Documento ilegible o de baja resolución',
    'Falta la firma del aprendiz o de la empresa/instructor',
    'Formato no corresponde a la plantilla oficial del SENA',
    'Faltan fechas o período de ejecución',
    'Completar el registro de actividades en la bitácora',
    'Documento correcto y verificado'
  ];

  useEffect(() => {
    const loadIns = async () => {
      try {
        const res = await axios.get('seguimientos/instructores');
        setInstructores(res.data);
      } catch (err) {
        console.error('Error al cargar instructores:', err);
      }
    };
    loadIns();
  }, []);

  useEffect(() => {
    if (!isOpen || !aprendiz) {
      setSeguimiento(null);
      setError(null);
      setNombreDocumento('');
      setArchivo(null);
      setIdContrato(null);
      setDocParaEvaluar(null);
      setDocParaEliminar(null);
      return;
    }

    let cancelado = false;
    setSeguimiento(null);
    setError(null);
    setIdContrato(null);
    setLoading(true);

    const idPersonaSolicitado = aprendiz.idPersona;

    const loadData = async () => {
      try {
        const res = await axios.get('seguimientos/buscar', {
          params: { idpersona: idPersonaSolicitado }
        });
        if (!cancelado) {
          if (res.data && typeof res.data === 'object' && 'id' in res.data) {
            setSeguimiento(res.data);
          } else {
            setSeguimiento(null);
          }
        }
      } catch (err) {
        console.error('Error cargando seguimiento:', err);
        if (!cancelado) setError('No se pudo cargar la información del seguimiento.');
      } finally {
        if (!cancelado) setLoading(false);
      }
    };
    loadData();
  }, [isOpen, aprendiz?.idPersona]);

  const iniciarSeguimiento = async () => {
    if (!aprendiz) {
      setError('No se encontró el aprendiz.');
      return;
    }

    if (!idContrato) {
      setError('Seleccione un instructor para asignar el seguimiento.');
      return;
    }

    setCreando(true);
    setError(null);

    try {
      const { data } = await axios.post('seguimientos', {
        idpersona: aprendiz.idPersona,
        idcontrato: idContrato
      });

      setSeguimiento({
        ...data,
        documentos: Array.isArray(data.documentos) ? data.documentos : []
      });
    } catch (err) {
      console.error('Error al iniciar el seguimiento:', err);
      setError('No se pudo iniciar el seguimiento.');
    } finally {
      setCreando(false);
    }
  };

  const subirDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seguimiento || !archivo || !nombreDocumento.trim()) return;

    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('nombre_documento', nombreDocumento.trim());

    setSubiendo(true);
    setError(null);
    try {
      const { data } = await axios.post(`seguimientos/${seguimiento.id}/documentos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSeguimiento((prev) => (prev ? { ...prev, documentos: [data, ...prev.documentos] } : prev));
      setNombreDocumento('');
      setArchivo(null);
    } catch (err) {
      console.error('Error al subir el documento', err);
      setError('No se pudo subir el documento.');
    } finally {
      setSubiendo(false);
    }
  };

  // Cambiar estado directo (para Aprobar rápido o volver a Pendiente)
  const cambiarEstadoDirecto = async (doc: DocumentoSeguimiento, nuevoEstado: 'APROBADO' | 'PENDIENTE') => {
    try {
      const { data } = await axios.patch(`documentos/${doc.id}/estado`, {
        estado: nuevoEstado,
        observacion: nuevoEstado === 'APROBADO' ? doc.observacion : null
      });

      setSeguimiento((prev) =>
        prev
          ? {
              ...prev,
              documentos: prev.documentos.map((d) => (d.id === doc.id ? data : d))
            }
          : prev
      );
    } catch (err) {
      console.error('Error al cambiar el estado del documento:', err);
      setError('No se pudo actualizar el estado del documento.');
    }
  };

  // Abrir modal de evaluación para añadir/editar observaciones o rechazar
  const abrirModalEvaluacion = (doc: DocumentoSeguimiento, estadoSugerido?: 'APROBADO' | 'RECHAZADO' | 'PENDIENTE') => {
    setDocParaEvaluar(doc);
    setEstadoEval(estadoSugerido || (doc.estado as any) || 'RECHAZADO');
    setObservacionEval(doc.observacion || '');
    setErrorEval(null);
  };

  // Guardar desde el modal de evaluación
  const guardarEvaluacionDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docParaEvaluar) return;

    if (estadoEval === 'RECHAZADO' && !observacionEval.trim()) {
      setErrorEval('Debes escribir o seleccionar la observación / motivo del rechazo.');
      return;
    }

    setGuardandoEval(true);
    setErrorEval(null);

    try {
      const { data } = await axios.patch(`documentos/${docParaEvaluar.id}/estado`, {
        estado: estadoEval,
        observacion: observacionEval.trim() || null
      });

      setSeguimiento((prev) =>
        prev
          ? {
              ...prev,
              documentos: prev.documentos.map((d) => (d.id === docParaEvaluar.id ? data : d))
            }
          : prev
      );

      setDocParaEvaluar(null);
    } catch (err: any) {
      console.error('Error al guardar evaluación:', err);
      setErrorEval(err.response?.data?.message || 'No se pudo guardar la observación del documento.');
    } finally {
      setGuardandoEval(false);
    }
  };

  // Confirmar y eliminar documento
  const confirmarEliminarDocumento = async () => {
    if (!docParaEliminar) return;
    setEliminandoDoc(true);
    try {
      await axios.delete(`documentos/${docParaEliminar.id}`);
      setSeguimiento((prev) =>
        prev ? { ...prev, documentos: prev.documentos.filter((d) => d.id !== docParaEliminar.id) } : prev
      );
      setDocParaEliminar(null);
    } catch (err) {
      console.error('Error al eliminar documento:', err);
      setError('No se pudo eliminar el documento.');
    } finally {
      setEliminandoDoc(false);
    }
  };

  const cambiarEstadoSeguimiento = async (nuevoEstado: string) => {
    if (!seguimiento) return;
    try {
      const { data } = await axios.put(`seguimientos/${seguimiento.id}`, {
        estado: nuevoEstado
      });
      setSeguimiento((prev) => (prev ? { ...prev, estado: data.estado } : prev));
    } catch (err) {
      console.error('Error al actualizar el estado del seguimiento', err);
      setError('No se pudo actualizar el estado general del seguimiento.');
    }
  };

  const getFileUrl = (doc: any) => {
    if (doc.documentoUrlPublica) return doc.documentoUrlPublica;
    if (!doc.documentoUrl) return '#';
    if (doc.documentoUrl.startsWith('http://') || doc.documentoUrl.startsWith('https://')) {
      return doc.documentoUrl;
    }
    const cleanPath = doc.documentoUrl.startsWith('/')
      ? doc.documentoUrl.substring(1)
      : doc.documentoUrl;
    const baseUrl = axios.defaults.baseURL ? axios.defaults.baseURL.replace(/\/api\/?$/, '') : '';
    return `${baseUrl}/storage/${cleanPath.replace(/^storage\//, '')}`;
  };

  const renderIconoArchivo = (nombreUrl: string) => {
    const ext = (nombreUrl || '').split('.').pop()?.toLowerCase() || '';
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="text-emerald-500" size={18} />;
    }
    if (['doc', 'docx'].includes(ext)) {
      return <FileText className="text-blue-500" size={18} />;
    }
    if (['pdf'].includes(ext)) {
      return <FileCode className="text-rose-500" size={18} />;
    }
    return <FileText className="text-amber-500" size={18} />;
  };

  const badgeEstado = (estado: string) => {
    const estilos: Record<string, string> = {
      PENDIENTE: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
      EN_PROCESO: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
      APROBADO: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
      RECHAZADO: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
      FINALIZADO: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
      ATRASADO: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
      SUSPENDIDO: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
    };
    return estilos[estado] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border-gray-200';
  };

  if (!isOpen || !aprendiz) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-hidden">
      <div className="relative w-full max-w-3xl bg-white dark:bg-coal-500 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        
        {/* HEADER PRINCIPAL */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-coal-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center font-black text-sm border border-emerald-200 dark:border-emerald-800">
              <UserCircle size={22} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold uppercase text-gray-900 dark:text-white tracking-wide">
                Gestión de Seguimiento
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {aprendiz.nombreCompleto}{' '}
                {aprendiz.identificacion ? `· Identificación: ${aprendiz.identificacion}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 transition-all border border-gray-300 dark:border-gray-600 rounded-full hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-gray-500 dark:text-gray-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/60 dark:bg-coal-600 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col justify-center items-center py-16 space-y-3">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Cargando seguimiento...
              </p>
            </div>
          ) : !seguimiento ? (
            <div className="text-center py-12 px-4 bg-white dark:bg-coal-500 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600" />

              <div>
                <h4 className="text-base font-extrabold uppercase text-gray-800 dark:text-white">
                  Seguimiento no iniciado
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
                  Este aprendiz aún no cuenta con un registro de seguimiento de etapa productiva. Asigna un instructor responsable para dar inicio.
                </p>
              </div>

              {/* Selector de instructor */}
              <div className="max-w-md mx-auto text-left space-y-1.5 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Instructor Responsable *
                </label>

                <select
                  value={idContrato ?? ''}
                  onChange={(e) => setIdContrato(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-coal-400 text-xs text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccione el contrato del instructor</option>
                  {instructores.map((contrato) => (
                    <option key={contrato.id} value={contrato.id}>
                      {contrato.persona.nombre1} {contrato.persona.nombre2 ?? ''} {contrato.persona.apellido1 ?? ''} — {contrato.persona.identificacion}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={iniciarSeguimiento}
                disabled={creando || !idContrato}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-md inline-flex items-center gap-2"
              >
                {creando ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Iniciar seguimiento
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              {/* TARJETA DE ESTADO GENERAL DEL SEGUIMIENTO */}
              <div className="bg-white dark:bg-coal-500 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                    Estado General de la Etapa Productiva
                  </span>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Cambia el estado global del proceso según el avance del aprendiz.
                  </p>
                </div>

                <select
                  value={seguimiento.estado || 'PENDIENTE'}
                  onChange={(e) => cambiarEstadoSeguimiento(e.target.value)}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border cursor-pointer focus:outline-none transition-all ${badgeEstado(
                    seguimiento.estado
                  )}`}
                >
                  <option value="EN_PROCESO">EN PROCESO</option>
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="ATRASADO">ATRASADO</option>
                  <option value="SUSPENDIDO">SUSPENDIDO</option>
                  <option value="FINALIZADO">FINALIZADO</option>
                  <option value="CANCELADO">CANCELADO</option>
                </select>
              </div>

              {/* FORMULARIO DE NUEVO DOCUMENTO (INSTRUCTOR / AUXILIAR) */}
              <form
                onSubmit={subirDocumento}
                className="bg-white dark:bg-coal-500 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3"
              >
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-800 dark:text-white flex items-center gap-1.5">
                  <Upload size={15} className="text-emerald-600" />
                  Adjuntar Documento Adicional
                </span>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Nombre del documento (ej. Bitácora 1)"
                    value={nombreDocumento}
                    onChange={(e) => setNombreDocumento(e.target.value)}
                    required
                    className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-coal-400 text-xs text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls"
                    onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                    required
                    className="flex-1 text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:text-emerald-800 dark:file:bg-emerald-950/60 dark:file:text-emerald-300 file:font-bold file:uppercase file:text-[10px] file:cursor-pointer text-gray-600 dark:text-gray-300"
                  />
                  <button
                    type="submit"
                    disabled={subiendo}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {subiendo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    <span>{subiendo ? 'Subiendo...' : 'Subir'}</span>
                  </button>
                </div>
              </form>

              {/* SECCIÓN LISTADO DE DOCUMENTOS CON EVALUACIÓN INTERACTIVA */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FileText size={16} className="text-emerald-600" />
                    Documentos Entregados ({seguimiento.documentos?.length || 0})
                  </h4>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Haz clic en los estados o en el ícono de mensaje para revisar/observar.
                  </span>
                </div>

                {!Array.isArray(seguimiento.documentos) || seguimiento.documentos.length === 0 ? (
                  <div className="text-center py-10 bg-white dark:bg-coal-500 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <FileText size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      No hay documentos cargados en este seguimiento
                    </p>
                  </div>
                ) : (
                  seguimiento.documentos.map((doc) => {
                    const url = getFileUrl(doc);

                    return (
                      <div
                        key={doc.id}
                        className={`bg-white dark:bg-coal-500 p-4 rounded-2xl border transition-all space-y-3 ${
                          doc.estado === 'RECHAZADO'
                            ? 'border-rose-200 bg-rose-50/20 dark:bg-rose-950/10 dark:border-rose-900/40'
                            : doc.estado === 'APROBADO'
                              ? 'border-emerald-200 bg-emerald-50/20 dark:bg-emerald-950/10 dark:border-emerald-900/40'
                              : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {/* Fila superior: icono, título, link y botones de acción rápida */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-coal-400 flex-shrink-0">
                              {renderIconoArchivo(doc.documentoUrl)}
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline truncate block"
                              >
                                {doc.nombre_documento}
                              </a>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                                <span className="uppercase font-mono">
                                  {doc.documentoUrl.split('.').pop()}
                                </span>
                                <span>•</span>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                                >
                                  <Eye size={12} />
                                  Ver documento
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* BARRA DE ACCIONES DE CAMBIO DE ESTADO (Instructor puede cambiar cualquier documento) */}
                          <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
                            {/* Botón Aprobar */}
                            <button
                              onClick={() => cambiarEstadoDirecto(doc, 'APROBADO')}
                              title="Aprobar documento"
                              className={`px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 border ${
                                doc.estado === 'APROBADO'
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              }`}
                            >
                              <CheckCircle size={13} />
                              <span>Aprobar</span>
                            </button>

                            {/* Botón Rechazar (abre modal con observaciones) */}
                            <button
                              onClick={() => abrirModalEvaluacion(doc, 'RECHAZADO')}
                              title="Rechazar con observación"
                              className={`px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 border ${
                                doc.estado === 'RECHAZADO'
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                              }`}
                            >
                              <XCircle size={13} />
                              <span>Rechazar</span>
                            </button>

                            {/* Botón Pendiente */}
                            <button
                              onClick={() => cambiarEstadoDirecto(doc, 'PENDIENTE')}
                              title="Marcar como pendiente de revisión"
                              className={`px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 border ${
                                doc.estado === 'PENDIENTE'
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                              }`}
                            >
                              <Clock size={13} />
                            </button>

                            {/* Botón Observaciones / Comentario */}
                            <button
                              onClick={() => abrirModalEvaluacion(doc)}
                              title="Agregar o editar observación del instructor"
                              className="p-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all flex items-center gap-1 text-[10px] font-bold"
                            >
                              <MessageSquare size={13} />
                              <span className="hidden sm:inline">Observación</span>
                            </button>

                            {/* Eliminar */}
                            <button
                              onClick={() => setDocParaEliminar(doc)}
                              title="Eliminar documento"
                              className="p-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-rose-600 hover:text-white dark:bg-coal-400 dark:text-gray-300 transition-all border border-gray-200 dark:border-gray-600"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* VISTA DE OBSERVACIONES MEJORADA (Sin alertas, cuadro legible y estético) */}
                        {doc.observacion && (
                          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50/90 to-orange-50/70 dark:from-coal-400 dark:to-coal-400/80 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                                <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                Observaciones / Correcciones requeridas:
                              </span>
                              <button
                                onClick={() => abrirModalEvaluacion(doc)}
                                className="text-[10px] font-bold text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-white underline flex items-center gap-1"
                              >
                                <Edit3 size={11} />
                                Editar observación
                              </button>
                            </div>
                            <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed italic pl-5 border-l-2 border-amber-400 dark:border-amber-600">
                              "{doc.observacion}"
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* FOOTER PRINCIPAL */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end bg-white dark:bg-coal-400">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL SECUNDARIO: EVALUACIÓN Y REGISTRO DE OBSERVACIONES (REEMPLAZO PROMPT) */}
      {/* ========================================================================= */}
      {docParaEvaluar && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-coal-500 rounded-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col">
            {/* Header submodal */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-coal-400">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-emerald-600" size={18} />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white">
                  Evaluación & Observaciones
                </h4>
              </div>
              <button
                onClick={() => setDocParaEvaluar(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300"
              >
                <X size={15} />
              </button>
            </div>

            {/* Formulario submodal */}
            <form onSubmit={guardarEvaluacionDocumento} className="p-5 space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 block">
                  Documento:
                </span>
                <p className="text-xs font-extrabold text-gray-800 dark:text-white truncate">
                  {docParaEvaluar.nombre_documento}
                </p>
              </div>

              {/* Selector de Estado */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
                  Estado del Documento *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEstadoEval('APROBADO')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      estadoEval === 'APROBADO'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                    }`}
                  >
                    <CheckCircle size={14} />
                    <span>Aprobar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEstadoEval('RECHAZADO')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      estadoEval === 'RECHAZADO'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
                    }`}
                  >
                    <XCircle size={14} />
                    <span>Rechazar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEstadoEval('PENDIENTE')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      estadoEval === 'PENDIENTE'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800'
                    }`}
                  >
                    <Clock size={14} />
                    <span>Pendiente</span>
                  </button>
                </div>
              </div>

              {/* Pastillas de Observaciones Rápidas */}
              <div className="space-y-1.5">
                <span className="block text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400">
                  Sugerencias de motivo / respuesta rápida:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {SUGERENCIAS_OBSERVACION.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setObservacionEval(sug)}
                      className="px-2.5 py-1 text-[10px] font-medium rounded-lg bg-gray-100 dark:bg-coal-400 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 hover:text-emerald-800 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-300 transition-all border border-gray-200 dark:border-gray-600 text-left"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea de Observación */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
                  Observación / Comentario para el Aprendiz {estadoEval === 'RECHAZADO' ? '*' : '(Opcional)'}
                </label>
                <textarea
                  rows={3}
                  value={observacionEval}
                  onChange={(e) => setObservacionEval(e.target.value)}
                  placeholder={
                    estadoEval === 'RECHAZADO'
                      ? 'Escribe detalladamente la razón por la cual rechazas este documento...'
                      : 'Escribe un comentario u observación sobre este documento...'
                  }
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-coal-400 text-xs text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {errorEval && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-xs font-semibold">
                  {errorEval}
                </div>
              )}

              {/* Acciones */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setDocParaEvaluar(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEval}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {guardandoEval ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      Guardar Evaluación
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL SECUNDARIO: CONFIRMACIÓN DE ELIMINACIÓN DE DOCUMENTO (REEMPLAZO CONFIRM) */}
      {/* ========================================================================= */}
      {docParaEliminar && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-coal-500 rounded-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 dark:text-white">
                  ¿Eliminar Documento?
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-700 dark:text-gray-300">
              Se eliminará permanentemente el archivo <span className="font-bold text-gray-900 dark:text-white">"{docParaEliminar.nombre_documento}"</span> del seguimiento del aprendiz.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setDocParaEliminar(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold uppercase"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminarDocumento}
                disabled={eliminandoDoc}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {eliminandoDoc ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Sí, Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
