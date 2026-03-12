import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import { KeenIcon } from '@/components';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';

type EstadoActividad = 'TODOS' | 'CALIFICADO' | 'POR_EVALUAR' | 'PENDIENTE' | 'SIN_ENTREGAR';

interface ActividadAprendiz {
  idCalificacionActividad: number;
  idActividad: number;
  tituloActividad: string;
  descripcionActividad?: string | null;
  tipoActividad?: string | null;
  estrategia?: string | null;
  entregables?: string | null;
  fechaInicial?: string | null;
  fechaFinal?: string | null;
  fechaCalificacion?: string | null;
  calificacionNumerica?: string | null;
  calificacionEstandart?: string | null;
  comentarioDocente?: string | null;
  comentarioEstudiante?: string | null;
  archivoEntrega?: string | null;
  archivoEntregaUrl?: string | null;
  pathDocumentoActividad?: string | null;
  documentoActividadUrl?: string | null;
  materia?: {
    id?: number;
    codigo?: string | null;
    nombreMateria?: string | null;
  };
  area?: {
    id?: number;
    nombre?: string | null;
  };
  autor?: {
    nombreCompleto?: string | null;
    rutaFotoUrl?: string | null;
  };
  materialesApoyo?: Array<{
    id: number;
    titulo?: string | null;
    descripcion?: string | null;
    urlDocumento?: string | null;
    urlDocumentoUrl?: string | null;
    urlAdicional?: string | null;
  }>;
  estadoVisual: Exclude<EstadoActividad, 'TODOS'>;
  fechaVencida: boolean;
  puedeResponder: boolean;
}

const filtros: Array<{ id: EstadoActividad; label: string }> = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'CALIFICADO', label: 'Calificado' },
  { id: 'POR_EVALUAR', label: 'Por Evaluar' },
  { id: 'PENDIENTE', label: 'Pendiente' },
  { id: 'SIN_ENTREGAR', label: 'Sin Entregar' }
];

const formatearFecha = (value?: string | null) => {
  if (!value) return '-';

  try {
    const fecha = new Date(value);
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(fecha);
  } catch {
    return value;
  }
};


const getFileName = (path?: string | null): string => {
  if (!path) return 'Archivo';
  // Extraer el nombre del archivo de la ruta
  const parts = path.split('/');
  const fileName = parts[parts.length - 1];
  // Si tiene extensión, devolverlo tal cual, sino agregar extensión genérica
  return fileName || 'Archivo entregado';
};

const getDocumentUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
      return base + path;
    } catch {
      const pathMatch = url.match(/\/storage\/.*$/);
      if (pathMatch) {
        const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
        return base + pathMatch[0];
      }
      return url;
    }
  }
  if (url.startsWith('/storage/')) {
    const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
    return base + url;
  }
  if (url.startsWith('storage/')) {
    const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
    return base + '/' + url;
  }
  const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
  return base + '/storage/' + url;
};

const estadoBadgeMap: Record<
  Exclude<EstadoActividad, 'TODOS'>,
  { label: string; chip: string; line: string; score: string }
> = {
  CALIFICADO: {
    label: 'Calificado',
    chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    line: 'border-l-emerald-500',
    score: 'text-emerald-600 dark:text-emerald-400'
  },
  POR_EVALUAR: {
    label: 'Por Evaluar',
    chip: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    line: 'border-l-amber-500',
    score: 'text-amber-600 dark:text-amber-400'
  },
  PENDIENTE: {
    label: 'Pendiente',
    chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    line: 'border-l-slate-300',
    score: 'text-slate-500 dark:text-slate-300'
  },
  SIN_ENTREGAR: {
    label: 'Sin Entregar',
    chip: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
    line: 'border-l-red-400',
    score: 'text-red-500 dark:text-red-400'
  }
};

interface ResponderModalProps {
  actividad: ActividadAprendiz | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const ResponderActividadModal: React.FC<ResponderModalProps> = ({ actividad, open, onClose, onSaved }) => {
  const [comentario, setComentario] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (open && actividad) {
      setComentario(actividad.comentarioEstudiante || '');
      setArchivo(null);
      setError(null);
      setIsDragging(false);
    }
  }, [open, actividad]);

  if (!open) return null;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actividad) return;
    
    setSaving(true);
    setError(null);

    try {
      const data = new FormData();
      data.append('comentarioEstudiante', comentario);
      if (archivo) data.append('archivo', archivo);

      await axios.post(`actividades-aprendiz/${actividad.idCalificacionActividad}/respuesta`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onSaved();
      onClose();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || 'No fue posible enviar la respuesta';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [actividad, comentario, archivo, onSaved, onClose]);

  // Constantes de validación
  const VALID_FILE_TYPES = ['.pdf', '.doc', '.docx', '.zip', '.rar'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const validateFile = useCallback((file: File): string | null => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!VALID_FILE_TYPES.includes(fileExtension)) {
      return 'Tipo de archivo no permitido. Solo se permiten: PDF, DOC, DOCX, ZIP, RAR';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'El archivo excede el tamaño máximo de 10MB';
    }
    return null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setError(error);
      } else {
        setArchivo(file);
        setError(null);
      }
    }
  }, [validateFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setError(error);
      } else {
        setArchivo(file);
        setError(null);
      }
    }
  }, [validateFile]);

  // Extraer información de proyecto y RAP (si está en la descripción o título)
  const projectInfo = useMemo(() => {
    if (!actividad) return { proyecto: 'Sin proyecto', rap: 'Sin RAP' };
    const title = actividad.tituloActividad || '';
    return {
      proyecto: title || 'Sin proyecto',
      rap: actividad.materia?.nombreMateria || actividad.area?.nombre || 'Sin RAP'
    };
  }, [actividad]);
  const maxChars = 500;
  const charsRemaining = maxChars - comentario.length;

  const tieneArchivoActual = !!actividad?.archivoEntregaUrl;
  const tituloModal = tieneArchivoActual ? 'Actualizar Entrega' : 'Responder Actividad';

  if (!actividad) {
    return (
      <Modal open={open} onClose={onClose} zIndex={110}>
        <ModalContent className="max-w-[600px] top-[5%] p-0 overflow-hidden">
          <div className="bg-primary px-5 py-3 flex items-center justify-between">
            <ModalTitle className="text-white text-base font-semibold">Cargando...</ModalTitle>
            <button
              className="text-white hover:text-gray-200 transition-colors"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <KeenIcon icon="cross" className="w-4 h-4" />
            </button>
          </div>
          <ModalBody className="p-5">
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} zIndex={110}>
      <ModalContent className="max-w-[600px] top-[5%] p-0 overflow-hidden">
        {/* Header azul */}
        <div className="bg-primary px-5 py-3 flex items-center justify-between">
          <ModalTitle className="text-white text-base font-semibold">{tituloModal}</ModalTitle>
          <button
            className="text-white hover:text-gray-200 transition-colors"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <KeenIcon icon="cross" className="w-4 h-4" />
          </button>
        </div>

        <ModalBody className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Información de la actividad */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2.5 space-y-0.5">
            <p className="text-xs font-semibold text-gray-900 dark:text-white">
              Proyecto: {projectInfo.proyecto}
            </p>
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              RAP: {projectInfo.rap}
            </p>
          </div>

          {/* Material de Apoyo */}
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Material de Apoyo</p>
            {actividad.materialesApoyo && actividad.materialesApoyo.length > 0 ? (
              <div className="space-y-1.5">
                {actividad.materialesApoyo.map((material) => {
                  const hasDocument = !!material.urlDocumentoUrl;
                  const hasLink = !!material.urlAdicional;
                  
                  return (
                    <div
                      key={material.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white dark:bg-coal-400 dark:border-gray-700 px-2.5 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {hasDocument ? (
                          <KeenIcon
                            icon="file-pdf"
                            className="text-red-500 dark:text-red-400 shrink-0 w-4 h-4"
                          />
                        ) : hasLink ? (
                          <KeenIcon
                            icon="exit-up-right"
                            className="text-gray-500 dark:text-gray-400 shrink-0 w-4 h-4"
                          />
                        ) : (
                          <KeenIcon
                            icon="document"
                            className="text-blue-500 dark:text-blue-400 shrink-0 w-4 h-4"
                          />
                        )}
                        <span className="text-xs text-gray-900 dark:text-white truncate">
                          {material.titulo || 'Material de apoyo'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {hasDocument && (
                          <a
                            href={getDocumentUrl(material.urlDocumentoUrl) ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.preventDefault();
                              const url = getDocumentUrl(material.urlDocumentoUrl);
                              if (url) {
                                window.open(url, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary"
                            title="Descargar"
                          >
                            <KeenIcon icon="download" className="w-4 h-4" />
                          </a>
                        )}
                        {hasLink && (
                          <a
                            href={material.urlAdicional ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary"
                            title="Ver enlace"
                          >
                            <KeenIcon icon="exit-up-right" className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-coal-300 px-3 py-2.5 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">No hay material de apoyo</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Respuesta del Estudiante */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1.5">
                Respuesta del Estudiante <span className="text-gray-500 dark:text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={comentario}
                onChange={(e) => {
                  if (e.target.value.length <= maxChars) {
                    setComentario(e.target.value);
                  }
                }}
                rows={3}
                className="textarea w-full text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-coal-400 resize-none"
                placeholder="Ej: Hago entrega de la actividad correspondiente al taller..."
              />
              <div className="flex justify-end mt-0.5">
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  {comentario.length}/{maxChars}
                </span>
              </div>
            </div>

            {/* Archivo Actual (si existe) */}
            {tieneArchivoActual && !archivo && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1.5">
                  Archivo Actual:
                </p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <KeenIcon icon="file-added" className="text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300 truncate">
                      {getFileName(actividad.archivoEntrega || actividad.archivoEntregaUrl)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={getDocumentUrl(actividad.archivoEntregaUrl) ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        const url = getDocumentUrl(actividad.archivoEntregaUrl);
                        if (url) {
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                      title="Ver archivo actual"
                    >
                      <KeenIcon icon="eye" className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={getDocumentUrl(actividad.archivoEntregaUrl) ?? '#'}
                      download
                      onClick={(e) => {
                        if (!getDocumentUrl(actividad.archivoEntregaUrl)) {
                          e.preventDefault();
                        }
                      }}
                      className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                      title="Descargar archivo actual"
                    >
                      <KeenIcon icon="download" className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5">
                  Selecciona un nuevo archivo para reemplazarlo
                </p>
              </div>
            )}

            {/* Adjuntar Archivo */}
            <div>
              <label className="block text-xs font-semibold text-gray-900 dark:text-white mb-1.5">
                {tieneArchivoActual ? 'Nuevo Archivo' : 'Adjuntar Archivo'}
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={clsx(
                  'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
                  isDragging
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-coal-300 hover:border-primary/50',
                  archivo && 'border-primary bg-primary/5 dark:bg-primary/10'
                )}
                onClick={() => document.getElementById('file-input-responder')?.click()}
              >
                <input
                  id="file-input-responder"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.zip,.rar"
                />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                  {archivo ? (
                    <span className="text-primary">{archivo.name}</span>
                  ) : (
                    <>
                      {tieneArchivoActual ? (
                        <>
                          Arrastra el nuevo archivo aquí o{' '}
                          <span className="text-primary">haz clic para seleccionar</span>
                        </>
                      ) : (
                        <>
                          Arrastra tu archivo aquí o{' '}
                          <span className="text-primary">haz clic para seleccionar</span>
                        </>
                      )}
                    </>
                  )}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  PDF, DOC, ZIP, RAR (máx. 10MB)
                </p>
              </div>
              {archivo && (
                <div className="mt-1.5 flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-2.5 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <KeenIcon icon="file-added" className="text-emerald-600 dark:text-emerald-400 w-3.5 h-3.5" />
                    <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium truncate max-w-[200px]">
                      {archivo.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setArchivo(null);
                      const input = document.getElementById('file-input-responder') as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    <KeenIcon icon="cross" className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-2.5 py-1.5">
                <p className="text-[10px] text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-sm btn-light px-3 text-xs h-8"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-sm btn-primary px-3 text-xs h-8"
              >
                {saving 
                  ? (tieneArchivoActual ? 'Actualizando...' : 'Enviando...') 
                  : (tieneArchivoActual ? 'Actualizar Entrega' : 'Enviar Actividad')}
              </button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const ActividadesAprendiz: React.FC = () => {
  const [actividades, setActividades] = useState<ActividadAprendiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<EstadoActividad>('TODOS');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [actividadResponder, setActividadResponder] = useState<ActividadAprendiz | null>(null);

  const fetchActividades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('actividades-aprendiz');
      const data = response.data?.data || response.data || [];
      setActividades(Array.isArray(data) ? data : []);
      setExpanded(null);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'No fue posible cargar tus actividades';
      setError(errorMessage);
      setActividades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActividades();
  }, [fetchActividades]);

  const actividadesFiltradas = useMemo(() => {
    if (filtro === 'TODOS') return actividades;
    return actividades.filter((actividad) => actividad.estadoVisual === filtro);
  }, [actividades, filtro]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-300">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">ESTADO:</span>
          {filtros.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFiltro(item.id)}
              className={clsx(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                filtro === item.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-coal-400 dark:text-gray-300 dark:border-gray-600'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {actividadesFiltradas.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center dark:bg-coal-400 dark:border-gray-700">
            <KeenIcon icon="check-squared" className="text-4xl text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">No hay actividades para este filtro</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Prueba con otro estado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {actividadesFiltradas.map((actividad) => {
              const status = estadoBadgeMap[actividad.estadoVisual];
              const isExpanded = expanded === actividad.idCalificacionActividad;
              const score = actividad.calificacionNumerica ? Number(actividad.calificacionNumerica) : null;

              return (
                <div
                  key={actividad.idCalificacionActividad}
                  className={clsx(
                    'rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden dark:bg-coal-400 dark:border-gray-700 border-l-4',
                    status.line
                  )}
                >
                  <div className="px-4 py-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {actividad.tituloActividad}
                          </h3>
                          <span className={clsx('inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium', status.chip)}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {actividad.area?.nombre || 'Sin área'}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 lg:gap-6">
                        <div className="text-right">
                          <div
                            className={clsx(
                              'inline-flex items-center gap-1 text-xs',
                              actividad.fechaVencida ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                            )}
                          >
                            <KeenIcon icon="calendar" className="text-xs" />
                            {formatearFecha(actividad.fechaFinal)}
                          </div>
                          {actividad.fechaVencida && actividad.estadoVisual === 'SIN_ENTREGAR' && (
                            <p className="text-[10px] text-red-400 mt-0.5">Fecha vencida</p>
                          )}
                        </div>

                        <div className="min-w-[40px] text-right">
                          <div className={clsx('text-lg leading-none font-semibold', status.score)}>
                            {score !== null ? score.toFixed(1) : '-'}
                          </div>
                          <div className="text-[9px] text-gray-400">/5.0</div>
                        </div>

                        <div className="flex items-center gap-2">
                          {actividad.puedeResponder && (
                            <button
                              type="button"
                              onClick={() => setActividadResponder(actividad)}
                              className="btn btn-sm btn-primary h-7 px-2 text-[10px]"
                            >
                              <KeenIcon icon="notepad-edit" className="text-[10px]" />
                              Responder
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setExpanded((prev) =>
                                prev === actividad.idCalificacionActividad ? null : actividad.idCalificacionActividad
                              )
                            }
                            className="bg-transparent border-0 hover:bg-transparent p-1 h-7 w-7 flex items-center justify-center"
                          >
                            <KeenIcon icon={isExpanded ? 'up' : 'down'} className="text-xs text-gray-500 dark:text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 px-4 py-4 dark:border-gray-700">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div>
                            <p className="mb-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                              Descripción
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {actividad.descripcionActividad || 'Sin descripción'}
                            </p>
                          </div>

                          <div>
                            <p className="mb-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                              Estrategia de Aprendizaje
                            </p>
                            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                              {actividad.estrategia || 'No disponible'}
                            </div>
                          </div>

                          <div>
                            <p className="mb-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                              Observaciones del Instructor
                            </p>
                            {actividad.estadoVisual === 'SIN_ENTREGAR' ? (
                              <div className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 flex items-start gap-2">
                                <KeenIcon icon="information" className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <span>
                                  {actividad.comentarioDocente || 'No se recibió la entrega. Comunicarse con el instructor.'}
                                </span>
                              </div>
                            ) : (
                              <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                                {actividad.comentarioDocente || 'Aún no hay observaciones del instructor.'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="mb-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                              Material de Apoyo
                            </p>
                            <div className="space-y-2">
                              {actividad.materialesApoyo && actividad.materialesApoyo.length > 0 ? (
                                actividad.materialesApoyo.map((material) => (
                                  <div
                                    key={material.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-coal-300"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {material.titulo || 'Material de apoyo'}
                                      </p>
                                      {material.descripcion && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                          {material.descripcion}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {material.urlDocumentoUrl && (
                                        <a
                                          href={getDocumentUrl(material.urlDocumentoUrl) ?? '#'}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            const url = getDocumentUrl(material.urlDocumentoUrl);
                                            if (url) {
                                              window.open(url, '_blank', 'noopener,noreferrer');
                                            }
                                          }}
                                          className="text-gray-500 hover:text-primary"
                                        >
                                          <KeenIcon icon="file-added" className="text-sm" />
                                        </a>
                                      )}
                                      {material.urlAdicional && (
                                        <a
                                          href={material.urlAdicional ?? '#'}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-gray-500 hover:text-primary"
                                        >
                                          <KeenIcon icon="exit-up-right" className="text-sm" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-lg border border-dashed border-gray-200 px-3 py-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                  No hay material de apoyo
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <p className="mb-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                              Mi Entrega
                            </p>
                            <div className="rounded-lg bg-emerald-50 px-3 py-3 dark:bg-emerald-900/10">
                              {actividad.archivoEntregaUrl || actividad.comentarioEstudiante ? (
                                <div className="space-y-2">
                                  {actividad.archivoEntregaUrl && (
                                    <div>
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <KeenIcon icon="file-added" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate">
                                            {getFileName(actividad.archivoEntrega || actividad.archivoEntregaUrl)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <a
                                            href={getDocumentUrl(actividad.archivoEntregaUrl) ?? '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              const url = getDocumentUrl(actividad.archivoEntregaUrl);
                                              if (url) {
                                                window.open(url, '_blank', 'noopener,noreferrer');
                                              }
                                            }}
                                            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                                            title="Ver archivo"
                                          >
                                            <KeenIcon icon="eye" className="w-4 h-4" />
                                          </a>
                                          <a
                                            href={getDocumentUrl(actividad.archivoEntregaUrl) ?? '#'}
                                            download
                                            onClick={(e) => {
                                              if (!getDocumentUrl(actividad.archivoEntregaUrl)) {
                                                e.preventDefault();
                                              }
                                            }}
                                            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                                            title="Descargar archivo"
                                          >
                                            <KeenIcon icon="download" className="w-4 h-4" />
                                          </a>
                                        </div>
                                      </div>
                                      {actividad.comentarioEstudiante && (
                                        <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                                          {actividad.comentarioEstudiante}
                                        </p>
                                      )}
                                      <div className="flex items-center justify-between mt-2">
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                          Entrega de la actividad
                                        </p>
                                        {(actividad.puedeResponder ||
                                          actividad.estadoVisual === 'POR_EVALUAR' ||
                                          actividad.estadoVisual === 'PENDIENTE') && (
                                          <button
                                            type="button"
                                            onClick={() => setActividadResponder(actividad)}
                                            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-500 transition-colors flex items-center gap-1"
                                            title="Cambiar PDF"
                                          >
                                            <KeenIcon icon="refresh" className="w-3 h-3" />
                                            Cambiar
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  {actividad.comentarioEstudiante && !actividad.archivoEntregaUrl && (
                                    <div>
                                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                        {actividad.comentarioEstudiante}
                                      </p>
                                      <div className="flex items-center justify-between mt-2">
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                          Entrega de la actividad
                                        </p>
                                        {(actividad.puedeResponder ||
                                          actividad.estadoVisual === 'POR_EVALUAR' ||
                                          actividad.estadoVisual === 'PENDIENTE') && (
                                          <button
                                            type="button"
                                            onClick={() => setActividadResponder(actividad)}
                                            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-500 transition-colors flex items-center gap-1"
                                            title="Cambiar entrega"
                                          >
                                            <KeenIcon icon="refresh" className="w-3 h-3" />
                                            Cambiar
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                  Aún no has enviado una entrega.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {actividadResponder && (
        <ResponderActividadModal
          open={true}
          actividad={actividadResponder}
          onClose={() => setActividadResponder(null)}
          onSaved={fetchActividades}
        />
      )}
    </>
  );
};

export default ActividadesAprendiz;
