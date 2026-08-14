import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon, Toast } from '@/components';
import axios from 'axios';
import Swal from 'sweetalert2';
import type { Actividad } from './ModalCrearActividad';
import {
  MATERIAL_DOCUMENTO_ACCEPT,
  MATERIAL_DOCUMENTO_FORMATOS_LABEL,
  extensionFromFileName,
  isPdfExtension,
  materialDocumentoActionLabel,
  materialDocumentoBadgeClass,
  materialDocumentoKeenIcon,
  materialDocumentoTypeLabel,
  validateMaterialDocumentoFile,
} from './materialDocumentoSupport';

interface MaterialApoyo {
  id: number;
  titulo: string;
  descripcion?: string;
  urlDocumento?: string;
  urlDocumentoUrl?: string;
  urlAdicional?: string;
  enBiblioteca?: boolean;
}

interface ModalMaterialApoyoProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  actividad: Actividad | null;
  /** Ficha de la clase; necesaria para registrar el material en Biblioteca del Conocimiento. */
  idFicha?: number;
}

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

const swalTheme = () => {
  const theme = JSON.parse(localStorage.getItem('settings-configs') || '{}')?.themeMode;
  const isDarkMode = theme === 'dark';
  return {
    background: isDarkMode ? '#1B1C22' : '#F9F9F9',
    color: isDarkMode ? 'white' : '#4B5675',
  };
};

const ITEMS_PER_PAGE = 10;

const ModalMaterialApoyo: React.FC<ModalMaterialApoyoProps> = ({ open, onClose, onSuccess, actividad, idFicha }) => {
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

  const [materiales, setMateriales] = useState<MaterialApoyo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [agregandoBibliotecaId, setAgregandoBibliotecaId] = useState<number | null>(null);
  const [crearOpen, setCrearOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descripcionRef = useRef<HTMLTextAreaElement>(null);

  const fetchMateriales = useCallback(async () => {
    if (!actividad?.id) return;
    setLoading(true);
    try {
      const params = idFicha && idFicha > 0 ? { idFicha } : undefined;
      const res = await axios.get(`actividades/${actividad.id}/materiales-apoyo`, { params });
      setMateriales(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.warn('Error cargando materiales:', e);
      setMateriales([]);
    } finally {
      setLoading(false);
    }
  }, [actividad?.id, idFicha]);

  useEffect(() => {
    if (open && actividad?.id) {
      fetchMateriales();
      setCrearOpen(false);
      setCurrentPage(1);
    }
  }, [open, actividad?.id, fetchMateriales]);

  useEffect(() => {
    if (documentoFile && isPdfExtension(extensionFromFileName(documentoFile.name))) {
      const url = URL.createObjectURL(documentoFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [documentoFile]);

  const totalPages = Math.max(1, Math.ceil(materiales.length / ITEMS_PER_PAGE));
  const paginatedMateriales = materiales.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const desde = materiales.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const hasta = Math.min(currentPage * ITEMS_PER_PAGE, materiales.length);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
  };

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actividad?.id || !titulo.trim()) return;
    if (!documentoFile && !link.trim()) {
      showToast('Ingrese un documento o un enlace (página web o YouTube).', 'error');
      return;
    }
    if (documentoFile) {
      const docErr = validateMaterialDocumentoFile(documentoFile);
      if (docErr) {
        showToast(docErr, 'error');
        return;
      }
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('titulo', titulo.trim());
      fd.append('descripcion', descripcion.trim().slice(0, 3000));
      if (documentoFile) fd.append('documento', documentoFile);
      if (link.trim()) fd.append('urlAdicional', link.trim());
      await axios.post(`actividades/${actividad.id}/materiales-apoyo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess?.(link.trim() ? 'Link agregado correctamente' : 'Material de la actividad agregado correctamente');
      fetchMateriales();
      setCrearOpen(false);
      setTitulo('');
      setDescripcion('');
      setDocumentoFile(null);
      setLink('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Error agregando material:', err);
      showToast(
        err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join('\n')
          : 'Error al agregar material',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (mat: MaterialApoyo) => {
    if (!actividad?.id || !window.confirm('¿Eliminar este material de la actividad?')) return;
    try {
      await axios.delete(`actividades/${actividad.id}/materiales-apoyo/${mat.id}`);
      fetchMateriales();
    } catch (e) {
      console.warn('Error eliminando material:', e);
    }
  };

  const confirmarAgregarBiblioteca = async (): Promise<boolean> => {
    const { background, color } = swalTheme();
    const result = await Swal.fire({
      title: 'Agregar a Biblioteca del Conocimiento',
      html: `
        <div class="text-left space-y-3.5 mt-1">
          <p class="text-[0.9375rem] leading-7">
            ¿Deseas agregar este material a la Biblioteca del Conocimiento?
          </p>
          <p class="text-sm leading-6 opacity-90">
            El material continuará disponible en esta actividad y también quedará asociado al RAP correspondiente en la biblioteca.
          </p>
        </div>
      `,
      icon: 'question',
      width: 'min(92vw, 34rem)',
      padding: '1.75rem 1.5rem',
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl',
        title: '!text-lg sm:!text-xl !font-semibold !leading-7 !pb-1 !px-2',
        htmlContainer: '!mt-4 !mb-0 !overflow-visible !px-1',
        icon: '!scale-95 !my-4',
        actions: '!gap-3 !mt-6 !flex-wrap',
        confirmButton: 'btn btn-primary !px-5 !py-2.5 !text-sm',
        cancelButton: 'btn btn-light !px-5 !py-2.5 !text-sm',
      },
      background,
      color,
    });
    return result.isConfirmed;
  };

  const handleAgregarBiblioteca = async (mat: MaterialApoyo) => {
    if (!actividad?.id || agregandoBibliotecaId != null) return;
    if (!idFicha || idFicha <= 0) {
      showToast('No hay ficha asociada; no se puede agregar a la Biblioteca del Conocimiento.', 'error');
      return;
    }
    if (mat.enBiblioteca) {
      showToast('Este material ya se encuentra en la Biblioteca del Conocimiento.', 'warning');
      return;
    }

    const confirmed = await confirmarAgregarBiblioteca();
    if (!confirmed) return;

    setAgregandoBibliotecaId(mat.id);
    try {
      const res = await axios.post(
        `actividades/${actividad.id}/materiales-apoyo/${mat.id}/mover-biblioteca`,
        { idFicha }
      );
      const msg =
        res.data?.message || 'Material agregado correctamente a la Biblioteca del Conocimiento.';
      showToast(msg, 'success');
      onSuccess?.(msg);
      setMateriales((prev) =>
        prev.map((m) => (m.id === mat.id ? { ...m, enBiblioteca: true } : m))
      );
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { error?: string; errors?: Record<string, string[]> } } };
      const msg =
        ax.response?.data?.error ||
        (ax.response?.data?.errors
          ? Object.values(ax.response.data.errors).flat().join('\n')
          : 'Error al agregar el material a la biblioteca');
      showToast(msg, ax.response?.status === 409 ? 'warning' : 'error');
      if (ax.response?.status === 409) {
        setMateriales((prev) =>
          prev.map((m) => (m.id === mat.id ? { ...m, enBiblioteca: true } : m))
        );
      }
    } finally {
      setAgregandoBibliotecaId(null);
    }
  };

  const resetForm = () => {
    setTitulo('');
    setDescripcion('');
    setDocumentoFile(null);
    setLink('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setCrearOpen(false);
  };

  if (!actividad) return null;

  const actividadTitulo = actividad.tituloActividad?.trim() || 'Actividad';

  return (
    <Modal open={open} onClose={onClose} zIndex={110}>
      <ModalContent className="!flex w-full !max-w-[min(100vw-2rem,900px)] !flex-col !overflow-hidden !rounded-2xl border border-gray-200/90 bg-white !p-0 shadow-2xl dark:border-gray-600/60 dark:bg-coal-400 top-[5%] max-h-[min(94dvh,920px)]">
        <Toast
          isOpen={toastOpen}
          message={toastMessage}
          type={toastType}
          onClose={() => setToastOpen(false)}
        />
        <ModalHeader className="shrink-0 px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="min-w-0 flex-1 pr-3">
            <ModalTitle className="text-xl font-semibold leading-snug text-gray-900 dark:text-white">
              Material de la actividad
            </ModalTitle>
            <p
              className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 mt-2 truncate"
              title={actividadTitulo}
            >
              {actividadTitulo}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-icon btn-light btn-clear shrink-0 h-9 w-9"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <KeenIcon icon="cross" className="text-base" />
          </button>
        </ModalHeader>
        <ModalBody className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 sm:py-6 [scrollbar-width:thin]">
          {crearOpen ? (
            <form onSubmit={handleAgregar} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                  Título del material
                </label>
                <input
                  type="text"
                  className="input w-full dark:bg-[#111827] dark:text-white dark:border-gray-600"
                  placeholder="Ingrese título del material"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                  Descripción del material
                </label>
                <textarea
                  ref={descripcionRef}
                  className="input w-full min-h-[100px] max-h-[350px] overflow-y-auto resize-y break-words dark:bg-[#111827] dark:text-white dark:border-gray-600"
                  style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}
                  placeholder="Ingrese descripción del material"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value.slice(0, 3000))}
                  maxLength={3000}
                  rows={5}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{descripcion.length}/3000</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Documento</label>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={MATERIAL_DOCUMENTO_ACCEPT}
                    onChange={(e) => setDocumentoFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-primary text-sm shrink-0"
                  >
                    Seleccionar archivo
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-200 truncate min-w-0 flex-1">
                    {documentoFile ? documentoFile.name : 'Sin archivos seleccionados'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{MATERIAL_DOCUMENTO_FORMATOS_LABEL}</p>
                {previewUrl && (
                  <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-coal-400">
                    <iframe src={previewUrl} title="Vista previa PDF" className="w-full h-[300px] border-0" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                  Enlace (página web o YouTube)
                </label>
                <input
                  type="url"
                  className="input w-full dark:bg-[#111827] dark:text-white dark:border-gray-600"
                  placeholder="https://ejemplo.com o https://youtube.com/..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 pt-3">
                <button type="button" className="btn btn-light px-5" onClick={resetForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary px-5" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar material'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-coal-500/25">
                      <th className="text-left py-3.5 px-4 sm:px-5 text-sm font-semibold text-gray-700 dark:text-white min-w-0 w-[40%]">
                        Título
                      </th>
                      <th className="text-left py-3.5 px-4 sm:px-5 text-sm font-semibold text-gray-700 dark:text-white min-w-0">
                        Descripción
                      </th>
                      <th className="text-right py-3.5 px-4 sm:px-5 text-sm font-semibold text-gray-700 dark:text-white w-[156px] shrink-0">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="py-10 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                        </td>
                      </tr>
                    ) : paginatedMateriales.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-sm leading-relaxed text-gray-600 dark:text-gray-200">
                          No hay archivos adjuntos a esta actividad
                        </td>
                      </tr>
                    ) : (
                      paginatedMateriales.map((mat) => {
                        const docUrl = getDocumentUrl(mat.urlDocumentoUrl || mat.urlDocumento);
                        const docExt = extensionFromFileName(
                          mat.urlDocumentoUrl || mat.urlDocumento || mat.titulo
                        );
                        const agregando = agregandoBibliotecaId === mat.id;
                        const verTitulo = docExt ? materialDocumentoActionLabel(docExt) : 'Ver material';
                        return (
                          <tr
                            key={mat.id}
                            className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50/80 dark:hover:bg-coal-500/20"
                          >
                            <td className="py-4 px-4 sm:px-5 text-sm leading-relaxed text-gray-900 dark:text-white align-middle min-w-0">
                              <div className="flex items-start gap-2.5 min-w-0">
                                {docUrl ? (
                                  <KeenIcon
                                    icon={materialDocumentoKeenIcon(docExt)}
                                    className="text-lg shrink-0 mt-0.5 text-gray-500 dark:text-gray-300"
                                  />
                                ) : (
                                  <KeenIcon icon="share" className="text-lg shrink-0 mt-0.5 text-gray-500 dark:text-gray-300" />
                                )}
                                <div className="min-w-0 flex-1 space-y-1.5">
                                  <span className="block truncate font-semibold leading-snug" title={mat.titulo}>
                                    {mat.titulo}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {docUrl && docExt ? (
                                      <span
                                        className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium shrink-0 ${materialDocumentoBadgeClass(docExt)}`}
                                      >
                                        {materialDocumentoTypeLabel(docExt)}
                                      </span>
                                    ) : mat.urlAdicional ? (
                                      <span className="inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium shrink-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                                        Enlace
                                      </span>
                                    ) : null}
                                    {mat.enBiblioteca ? (
                                      <span
                                        className="inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium shrink-0 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                                        title="Ya agregado a Biblioteca del Conocimiento"
                                      >
                                        En biblioteca
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 sm:px-5 text-sm leading-relaxed text-gray-600 dark:text-gray-200 align-middle min-w-0">
                              <span className="block line-clamp-2 break-words" title={mat.descripcion || '-'}>
                                {mat.descripcion || '—'}
                              </span>
                            </td>
                            <td className="py-4 px-4 sm:px-5 align-middle">
                              <div className="flex items-center justify-end gap-2 shrink-0">
                                {docUrl && (
                                  <a
                                    href={docUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      window.open(docUrl, '_blank', 'noopener,noreferrer');
                                    }}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-primary dark:border-gray-600 dark:bg-coal-500 dark:text-gray-200 dark:hover:bg-coal-400"
                                    title={verTitulo}
                                  >
                                    <KeenIcon icon="eye" className="text-base" />
                                  </a>
                                )}
                                {mat.urlAdicional && (
                                  <a
                                    href={mat.urlAdicional}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-primary dark:border-gray-600 dark:bg-coal-500 dark:text-gray-200 dark:hover:bg-coal-400"
                                    title="Abrir enlace"
                                  >
                                    <KeenIcon icon="share" className="text-base" />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleAgregarBiblioteca(mat)}
                                  disabled={agregando || !!mat.enBiblioteca}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-primary/5 hover:text-primary hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-coal-500 dark:text-gray-200 dark:hover:bg-primary/10"
                                  title={
                                    mat.enBiblioteca
                                      ? 'Ya está en Biblioteca del Conocimiento'
                                      : 'Agregar a Biblioteca del Conocimiento'
                                  }
                                >
                                  {agregando ? (
                                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                  ) : (
                                    <KeenIcon icon="book" className="text-base" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEliminar(mat)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:border-gray-600 dark:bg-coal-500 dark:text-gray-200 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                  title="Eliminar material"
                                >
                                  <KeenIcon icon="trash" className="text-base" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-200">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-coal-500"
                    aria-label="Página anterior"
                  >
                    <KeenIcon icon="left" className="text-base" />
                  </button>
                  <span className="min-w-[5.5rem] text-center">
                    {desde}-{hasta} de {materiales.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-coal-500"
                    aria-label="Página siguiente"
                  >
                    <KeenIcon icon="right" className="text-base" />
                  </button>
                </div>
                <button type="button" onClick={() => setCrearOpen(true)} className="btn btn-primary px-5 py-2.5 text-sm shrink-0">
                  + Crear material de apoyo
                </button>
              </div>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalMaterialApoyo;
