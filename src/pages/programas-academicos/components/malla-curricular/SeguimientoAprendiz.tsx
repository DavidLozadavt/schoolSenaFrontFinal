import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Trash2,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  FileCode,
  BarChart3,
  Search,
  AlertCircle,
  FileCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { useAuthContext } from '@/auth';
import { Seguimiento, DocumentoSeguimiento } from './interfaces/Seguimiento';

const DOCUMENTOS_SUGERIDOS = ['Bitácora 1 - Acompañamiento'];

const SeguimientoAprendiz: React.FC = () => {
  const { user, persona } = useAuthContext();
  const idPersona = user?.idpersona || persona?.id;

  const [seguimiento, setSeguimiento] = useState<Seguimiento | null>(null);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [reemplazandoDocId, setReemplazandoDocId] = useState<number | null>(null);
  const [reemplazandoArchivo, setReemplazandoArchivo] = useState<File | null>(null);
  const [reemplazandoNombre, setReemplazandoNombre] = useState('');

  const [nombreDocumento, setNombreDocumento] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const [filtroEstado, setFiltroEstado] = useState<
    'TODOS' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'
  >('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar seguimiento del aprendiz
  const fetchSeguimiento = async () => {
    if (!idPersona) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('seguimientos/buscar', {
        params: { idpersona: idPersona }
      });
      if (res.data && typeof res.data === 'object' && 'id' in res.data) {
        setSeguimiento(res.data);
      } else {
        setSeguimiento(null);
      }
    } catch (err: any) {
      console.error('Error al consultar seguimiento del aprendiz:', err);
      setError('No se pudo consultar la información de tu seguimiento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeguimiento();
  }, [idPersona]);

  // Limpiar mensajes temporales
  useEffect(() => {
    if (exito) {
      const timer = setTimeout(() => setExito(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [exito]);

  // Manejador de subida de nuevos documentos
  const handleSubirDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seguimiento) {
      setError('Aún no tienes un registro de seguimiento asignado.');
      return;
    }
    if (!archivo) {
      setError('Selecciona un archivo PDF, DOC, DOCX, XLS o XLSX.');
      return;
    }
    if (!nombreDocumento.trim()) {
      setError('Ingresa el nombre del documento.');
      return;
    }

    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('nombre_documento', nombreDocumento.trim());

    setSubiendo(true);
    setError(null);
    setExito(null);

    try {
      const { data } = await axios.post(`seguimientos/${seguimiento.id}/documentos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSeguimiento((prev) =>
        prev
          ? {
              ...prev,
              documentos: [data, ...(prev.documentos || [])]
            }
          : prev
      );

      setNombreDocumento('');
      setArchivo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setExito('¡Documento subido con éxito! Quedó en estado PENDIENTE para revisión.');
    } catch (err: any) {
      console.error('Error subiendo documento:', err);
      const msg =
        err.response?.data?.message ||
        'Error al subir el archivo. Verifica el formato y tamaño (Máx. 10MB).';
      setError(msg);
    } finally {
      setSubiendo(false);
    }
  };

  // Manejador para reemplazar/corregir un documento existente (re-upload)
  const handleReemplazarDocumento = async (e: React.FormEvent, docId: number) => {
    e.preventDefault();
    if (!reemplazandoArchivo && !reemplazandoNombre.trim()) {
      setError('Debes adjuntar un nuevo archivo o modificar el nombre.');
      return;
    }

    const formData = new FormData();
    if (reemplazandoArchivo) {
      formData.append('archivo', reemplazandoArchivo);
    }
    if (reemplazandoNombre.trim()) {
      formData.append('nombre_documento', reemplazandoNombre.trim());
    }

    setSubiendo(true);
    setError(null);

    try {
      const { data } = await axios.post(`documentos/${docId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSeguimiento((prev) =>
        prev
          ? {
              ...prev,
              documentos: prev.documentos.map((d) => (d.id === docId ? data : d))
            }
          : prev
      );

      setReemplazandoDocId(null);
      setReemplazandoArchivo(null);
      setReemplazandoNombre('');
      setExito(
        '¡Documento actualizado correctamente! Vuelve a estar en estado PENDIENTE de aprobación.'
      );
    } catch (err: any) {
      console.error('Error al reemplazar el documento:', err);
      setError('No se pudo actualizar el documento. Intenta nuevamente.');
    } finally {
      setSubiendo(false);
    }
  };

  // Eliminar un documento
  const handleEliminarDocumento = async (docId: number) => {
    if (
      !window.confirm('¿Estás seguro de eliminar este documento? Esta acción no se puede deshacer.')
    ) {
      return;
    }

    try {
      await axios.delete(`documentos/${docId}`);
      setSeguimiento((prev) =>
        prev
          ? {
              ...prev,
              documentos: prev.documentos.filter((d) => d.id !== docId)
            }
          : prev
      );
      setExito('Documento eliminado correctamente.');
    } catch (err: any) {
      console.error('Error eliminando documento:', err);
      setError('No se pudo eliminar el documento.');
    }
  };

  // Helper para armar URL del archivo
  const getFileUrl = (doc: DocumentoSeguimiento) => {
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

  // Icono según tipo de archivo
  const renderIconoArchivo = (nombreUrl: string) => {
    const ext = nombreUrl.split('.').pop()?.toLowerCase() || '';
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="text-emerald-500" size={24} />;
    }
    if (['doc', 'docx'].includes(ext)) {
      return <FileText className="text-blue-500" size={24} />;
    }
    if (['pdf'].includes(ext)) {
      return <FileCode className="text-rose-500" size={24} />;
    }
    return <FileText className="text-amber-500" size={24} />;
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setArchivo(droppedFile);
    }
  };

  // Estadísticas calculadas
  const stats = useMemo(() => {
    const docs = seguimiento?.documentos || [];
    const total = docs.length;
    const aprobados = docs.filter((d) => d.estado === 'APROBADO').length;
    const pendientes = docs.filter((d) => d.estado === 'PENDIENTE').length;
    const rechazados = docs.filter((d) => d.estado === 'RECHAZADO').length;
    const porcentaje = total > 0 ? Math.round((aprobados / total) * 100) : 0;
    return { total, aprobados, pendientes, rechazados, porcentaje };
  }, [seguimiento]);

  // Documentos filtrados
  const documentosFiltrados = useMemo(() => {
    const list = seguimiento?.documentos || [];
    return list.filter((doc) => {
      const coincideEstado = filtroEstado === 'TODOS' || doc.estado === filtroEstado;
      const coincideBusqueda =
        !busqueda.trim() || doc.nombre_documento.toLowerCase().includes(busqueda.toLowerCase());
      return coincideEstado && coincideBusqueda;
    });
  }, [seguimiento, filtroEstado, busqueda]);

  // Estilo badge estado general
  const badgeEstadoSeguimiento = (estado?: string) => {
    switch (estado) {
      case 'EN_PROCESO':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300';
      case 'FINALIZADO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'SUSPENDIDO':
        return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300';
      case 'ATRASADO':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const badgeEstadoDocumento = (estado: string) => {
    switch (estado) {
      case 'APROBADO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
      case 'RECHAZADO':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
      case 'PENDIENTE':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 dark:bg-coal-600 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER PRINCIPAL */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={14} className="text-amber-300" />
              <span>Etapa Productiva</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Seguimiento de Documentos
            </h1>
            <p className="text-sm text-teal-100 max-w-xl">
              Carga tus bitácoras, informes y formatos de seguimiento (.pdf, .doc, .docx, .xls,
              .xlsx) y verifica su estado de revisión en tiempo real.
            </p>
          </div>

          {seguimiento && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
              <div className="text-center sm:text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-100 block">
                  Estado General
                </span>
                <span
                  className={`inline-block mt-1 px-3 py-1 text-xs font-extrabold rounded-lg border uppercase tracking-wider ${badgeEstadoSeguimiento(
                    seguimiento.estado
                  )}`}
                >
                  {seguimiento.estado || 'PENDIENTE'}
                </span>
              </div>

              {seguimiento.contrato?.persona && (
                <div className="border-t sm:border-t-0 sm:border-l border-white/20 pt-2 sm:pt-0 sm:pl-4 text-xs">
                  <span className="text-[10px] font-bold uppercase text-teal-200 block">
                    Instructor Asignado
                  </span>
                  <span className="font-bold block">
                    {seguimiento.contrato.persona.nombre1}{' '}
                    {seguimiento.contrato.persona.nombre2 ?? ''}{' '}
                    {seguimiento.contrato.persona.apellido1 ?? ''}
                  </span>
                  {seguimiento.contrato.persona.email && (
                    <span className="text-[11px] text-teal-100 block opacity-90">
                      {seguimiento.contrato.persona.email}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MENSAJES DE ALERTA DE ERROR / EXITO */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 animate-fade-in shadow-sm">
          <AlertCircle className="flex-shrink-0 text-rose-600 dark:text-rose-400" size={20} />
          <p className="text-xs sm:text-sm font-semibold">{error}</p>
        </div>
      )}

      {exito && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 animate-fade-in shadow-sm">
          <CheckCircle2
            className="flex-shrink-0 text-emerald-600 dark:text-emerald-400"
            size={20}
          />
          <p className="text-xs sm:text-sm font-semibold">{exito}</p>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      {loading ? (
        <div className="bg-white dark:bg-coal-500 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center space-y-4 shadow-sm">
          <RefreshCw className="animate-spin text-emerald-600" size={36} />
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            Cargando el estado de tu seguimiento...
          </p>
        </div>
      ) : !seguimiento ? (
        <div className="bg-white dark:bg-coal-500 rounded-2xl p-8 sm:p-12 border border-gray-200 dark:border-gray-700 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
            <Info size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Aún no se ha iniciado tu seguimiento
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Tu seguimiento de etapa productiva debe ser habilitado por tu instructor asignado o por
            la coordinación académica antes de poder cargar documentos.
          </p>
          <button
            onClick={fetchSeguimiento}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
          >
            <RefreshCw size={14} />
            Actualizar estado
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMNA IZQUIERDA: FORMULARIO DE CARGA DE ARCHIVOS */}
          <div className="lg:col-span-5 space-y-6">
            {/* TARJETA DE RESUMEN DE PROGRESO */}
            <div className="bg-white dark:bg-coal-500 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <BarChart3 size={18} className="text-emerald-600" />
                  Progreso de Revisión
                </h2>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {stats.porcentaje}% completado
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden p-0.5 border border-gray-200 dark:border-gray-600">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.porcentaje}%` }}
                />
              </div>

              {/* Counters */}
              <div className="grid grid-cols-4 gap-2 text-center pt-2">
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-coal-400 border border-gray-100 dark:border-gray-700">
                  <span className="text-lg font-black text-gray-800 dark:text-white block">
                    {stats.total}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">
                    Total
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 block">
                    {stats.aprobados}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-500">
                    Aprobados
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
                  <span className="text-lg font-black text-amber-700 dark:text-amber-400 block">
                    {stats.pendientes}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-500">
                    Pendientes
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
                  <span className="text-lg font-black text-rose-700 dark:text-rose-400 block">
                    {stats.rechazados}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-500">
                    Rechazados
                  </span>
                </div>
              </div>
            </div>

            {/* FORMULARIO DE CARGA */}
            <div className="bg-white dark:bg-coal-500 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                <UploadCloud size={20} className="text-emerald-600" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-800 dark:text-white">
                  Cargar Nuevo Documento
                </h2>
              </div>

              <form onSubmit={handleSubirDocumento} className="space-y-4">
                {/* Nombre del documento */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1.5">
                    Nombre o título del documento *
                  </label>
                  <input
                    type="text"
                    value={nombreDocumento}
                    onChange={(e) => setNombreDocumento(e.target.value)}
                    placeholder="Ej. Bitácora 1 o Formato F023"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-coal-400 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                  />
                </div>

                {/* Sugerencias rápidas */}
                <div>
                  <span className="block text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1.5">
                    Sugerencias de títulos habituales:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {DOCUMENTOS_SUGERIDOS.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNombreDocumento(sug)}
                        className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 hover:text-emerald-800 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-300 transition-all border border-gray-200 dark:border-gray-600"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Área Dropzone de Archivo */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 dark:text-gray-300 mb-1.5">
                    Seleccionar Archivo (PDF, Word, Excel) *
                  </label>

                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                      dragActive
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : archivo
                          ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10'
                          : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 bg-gray-50/50 dark:bg-coal-400/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />

                    {archivo ? (
                      <div className="space-y-1">
                        <FileCheck size={32} className="mx-auto text-emerald-600" />
                        <p className="text-xs font-bold text-gray-800 dark:text-white truncate max-w-xs mx-auto">
                          {archivo.name}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {(archivo.size / 1024 / 1024).toFixed(2)} MB · Clic para cambiar
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <UploadCloud
                          size={32}
                          className="mx-auto text-gray-400 dark:text-gray-500"
                        />
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Haz clic aquí
                          </span>{' '}
                          o arrastra tu archivo
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                          Soporta PDF, DOC, DOCX, XLS, XLSX (Máx. 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={subiendo || !archivo || !nombreDocumento.trim()}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {subiendo ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Subiendo archivo...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} />
                      Subir Documento
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* COLUMNA DERECHA: LISTADO DE DOCUMENTOS Y FILTROS */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-coal-500 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              {/* Encabezado y Filtros */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-emerald-600" />
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-800 dark:text-white">
                    Mis Documentos Subidos
                  </h2>
                </div>

                {/* Búsqueda rápida */}
                <div className="relative w-full sm:w-64">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar documento..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-coal-400 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Pestañas de Filtro */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {(['TODOS', 'PENDIENTE', 'APROBADO', 'RECHAZADO'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFiltroEstado(tab)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border whitespace-nowrap ${
                      filtroEstado === tab
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-gray-50 dark:bg-coal-400 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tab === 'TODOS' ? 'Todos los documentos' : tab}
                  </button>
                ))}
              </div>

              {/* Lista de Documentos */}
              {documentosFiltrados.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
                  <FileText size={40} className="mx-auto text-gray-300 dark:text-gray-600" />
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {seguimiento.documentos?.length === 0
                      ? 'Aún no has subido ningún documento de seguimiento'
                      : 'No se encontraron documentos con este filtro'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documentosFiltrados.map((doc) => {
                    const esReemplazando = reemplazandoDocId === doc.id;
                    const fileUrl = getFileUrl(doc);

                    return (
                      <div
                        key={doc.id}
                        className={`p-4 rounded-xl border transition-all space-y-3 ${
                          doc.estado === 'RECHAZADO'
                            ? 'bg-rose-50/40 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50'
                            : doc.estado === 'APROBADO'
                              ? 'bg-emerald-50/20 border-emerald-200/80 dark:bg-emerald-950/10 dark:border-emerald-900/40'
                              : 'bg-white dark:bg-coal-400 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-coal-500 flex-shrink-0">
                              {renderIconoArchivo(doc.documentoUrl)}
                            </div>

                            <div className="min-w-0 space-y-0.5">
                              <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {doc.nombre_documento}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                                <span>Archivo de seguimiento</span>
                                <span>•</span>
                                <span className="uppercase font-mono text-[10px]">
                                  {doc.documentoUrl.split('.').pop()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Badge estado */}
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase border ${badgeEstadoDocumento(
                                doc.estado
                              )}`}
                            >
                              {doc.estado === 'APROBADO' && <CheckCircle2 size={12} />}
                              {doc.estado === 'PENDIENTE' && <Clock size={12} />}
                              {doc.estado === 'RECHAZADO' && <XCircle size={12} />}
                              {doc.estado}
                            </span>
                          </div>
                        </div>

                        {/* Observación en caso de rechazo */}
                        {doc.estado === 'RECHAZADO' && doc.observacion && (
                          <div className="p-3 rounded-lg bg-rose-100/70 border border-rose-300 dark:bg-rose-950/60 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-rose-700 dark:text-rose-400">
                              <AlertTriangle size={14} />
                              Motivo del rechazo por el instructor:
                            </div>
                            <p className="italic pl-5">{doc.observacion}</p>
                          </div>
                        )}

                        {/* FORMULARIO INLINE PARA CORREGIR / REEMPLAZAR */}
                        {esReemplazando ? (
                          <form
                            onSubmit={(e) => handleReemplazarDocumento(e, doc.id)}
                            className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/60 space-y-3"
                          >
                            <span className="text-xs font-bold uppercase text-amber-800 dark:text-amber-300 block">
                              Reemplazar o actualizar archivo
                            </span>

                            <input
                              type="text"
                              value={reemplazandoNombre}
                              onChange={(e) => setReemplazandoNombre(e.target.value)}
                              placeholder="Nombre del documento"
                              className="w-full px-3 py-1.5 rounded-lg text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-coal-400"
                            />

                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                              onChange={(e) => setReemplazandoArchivo(e.target.files?.[0] ?? null)}
                              className="w-full text-xs text-gray-600 dark:text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-emerald-600 file:text-white file:text-[10px] file:font-bold file:uppercase"
                            />

                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setReemplazandoDocId(null);
                                  setReemplazandoArchivo(null);
                                  setReemplazandoNombre('');
                                }}
                                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-[10px] font-bold uppercase"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                disabled={subiendo}
                                className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 shadow-sm"
                              >
                                <UploadCloud size={12} />
                                {subiendo ? 'Guardando...' : 'Confirmar Reemplazo'}
                              </button>
                            </div>
                          </form>
                        ) : (
                          /* BOTONES DE ACCIÓN */
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-gray-700/60">
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60 transition-all"
                            >
                              <Eye size={14} />
                              Ver / Descargar
                            </a>

                            <div className="flex items-center gap-2">
                              {(doc.estado === 'RECHAZADO' || doc.estado === 'PENDIENTE') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReemplazandoDocId(doc.id);
                                    setReemplazandoNombre(doc.nombre_documento);
                                    setReemplazandoArchivo(null);
                                  }}
                                  title="Reemplazar archivo"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-900/60 transition-all border border-amber-200 dark:border-amber-800/50"
                                >
                                  <RefreshCw size={12} />
                                  Reemplazar
                                </button>
                              )}

                              {doc.estado !== 'APROBADO' && (
                                <button
                                  type="button"
                                  onClick={() => handleEliminarDocumento(doc.id)}
                                  title="Eliminar documento"
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeguimientoAprendiz;
