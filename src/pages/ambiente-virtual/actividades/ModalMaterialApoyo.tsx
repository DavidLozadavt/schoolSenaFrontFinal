import React, { useEffect, useState, useRef } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import type { Actividad } from './ModalCrearActividad';

interface MaterialApoyo {
  id: number;
  titulo: string;
  descripcion?: string;
  urlDocumento?: string;
  urlDocumentoUrl?: string;
  urlAdicional?: string;
}

interface ModalMaterialApoyoProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  actividad: Actividad | null;
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

const ITEMS_PER_PAGE = 10;

const ModalMaterialApoyo: React.FC<ModalMaterialApoyoProps> = ({ open, onClose, onSuccess, actividad }) => {
  const [materiales, setMateriales] = useState<MaterialApoyo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [crearOpen, setCrearOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descripcionRef = useRef<HTMLTextAreaElement>(null);

  const fetchMateriales = async () => {
    if (!actividad?.id) return;
    setLoading(true);
    try {
      const res = await axios.get(`actividades/${actividad.id}/materiales-apoyo`);
      setMateriales(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.warn('Error cargando materiales:', e);
      setMateriales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && actividad?.id) {
      fetchMateriales();
      setCrearOpen(false);
      setCurrentPage(1);
    }
  }, [open, actividad?.id]);


  useEffect(() => {
    if (documentoFile && documentoFile.type === 'application/pdf') {
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

  const handleAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actividad?.id || !titulo.trim()) return;
    if (!documentoFile && !link.trim()) {
      alert('Ingrese un documento PDF o un enlace (página web o YouTube)');
      return;
    }
    if (documentoFile && !documentoFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Solo se permiten archivos PDF');
      return;
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
      alert(err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join('\n') : 'Error al agregar material');
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

  const resetForm = () => {
    setTitulo('');
    setDescripcion('');
    setDocumentoFile(null);
    setLink('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setCrearOpen(false);
  };

  if (!actividad) return null;

  return (
    <Modal open={open} onClose={onClose} zIndex={110}>
      <ModalContent className="max-w-3xl top-[5%] max-h-[90vh] overflow-y-auto flex flex-col p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:[display:none]">
        <ModalHeader>
          <ModalTitle>Material de la actividad</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0 text-red-600 hover:bg-red-50" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="flex-1 overflow-y-auto px-0 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:[display:none]">
          {crearOpen ? (
            /* Vista Crear Material de Apoyo */
            <form onSubmit={handleAgregar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título del material</label>
                <input
                  type="text"
                  className="input w-full p-2 text-sm"
                  placeholder="Ingrese Título del material"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción del material</label>
                <textarea
                  ref={descripcionRef}
                  className="input w-full p-2 text-sm min-h-[100px] max-h-[350px] overflow-y-auto overflow-x-hidden resize-y break-words"
                  style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}
                  placeholder="Ingrese descripción del material"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value.slice(0, 3000))}
                  maxLength={3000}
                  rows={5}
                />
                <p className="text-[10px] text-gray-500 mt-0.5">{descripcion.length}/3000</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Documento</label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setDocumentoFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-primary text-sm"
                  >
                    Seleccionar archivo
                  </button>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {documentoFile ? documentoFile.name : 'Sin archivos seleccionados'}
                  </span>
                </div>
                {previewUrl && (
                  <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-coal-400">
                    <iframe src={previewUrl} title="Vista previa PDF" className="w-full h-[300px] border-0" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enlace (página web o YouTube)</label>
                <input
                  type="url"
                  className="input w-full p-2 text-sm"
                  placeholder="https://ejemplo.com o https://youtube.com/..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>
              <div className="flex justify-between gap-2 pt-4">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : '+ ACEPTAR'}
                </button>
                <button type="button" className="btn bg-red-600 hover:bg-red-700 text-white" onClick={resetForm}>
                  X CANCELAR
                </button>
              </div>
            </form>
          ) : (
            /* Vista Lista Material de Apoyo */
            <>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 w-[140px] shrink-0">Titulo</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Descripcion</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400 w-[100px] shrink-0">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                        </td>
                      </tr>
                    ) : paginatedMateriales.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                          No hay archivos adjuntos a esta actividad
                        </td>
                      </tr>
                    ) : (
                      paginatedMateriales.map((mat) => {
                        const docUrl = getDocumentUrl(mat.urlDocumentoUrl || mat.urlDocumento);
                        return (
                          <tr key={mat.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-coal-400/50 align-top">
                            <td className="py-3 px-3 text-sm text-gray-900 dark:text-white align-top">{mat.titulo}</td>
                            <td className="py-3 px-3 text-sm text-gray-600 dark:text-gray-400 align-top min-w-0">
                              <div className="whitespace-pre-wrap break-words">
                                {mat.descripcion || '-'}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1">
                                {docUrl && (
                                  <a
                                    href={docUrl ?? '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (docUrl) {
                                        window.open(docUrl, '_blank', 'noopener,noreferrer');
                                      }
                                    }}
                                    className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-600 dark:text-gray-300"
                                    title="Ver documento"
                                  >
                                    <KeenIcon icon="eye" className="text-sm" />
                                  </a>
                                )}
                                {mat.urlAdicional && (
                                  <a
                                    href={mat.urlAdicional ?? '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-600 dark:text-gray-300"
                                    title="Abrir enlace"
                                  >
                                    <KeenIcon icon="share" className="text-sm" />
                                  </a>
                                )}
                                <button
                                  onClick={() => handleEliminar(mat)}
                                  className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-300 hover:text-red-600"
                                  title="Eliminar"
                                >
                                  <KeenIcon icon="trash" className="text-sm" />
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
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1.5 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                  >
                    <KeenIcon icon="left" className="text-sm" />
                  </button>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, materiales.length)} de {materiales.length}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                  >
                    <KeenIcon icon="right" className="text-sm" />
                  </button>
                </div>
                <button
                  onClick={() => setCrearOpen(true)}
                  className="btn btn-primary"
                >
                  + CREAR MATERIAL DE APOYO
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
