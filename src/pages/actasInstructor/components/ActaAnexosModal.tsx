import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import { Acta, AnexoItem } from '../types';

interface ActaAnexosModalProps {
  isOpen: boolean;
  onClose: () => void;
  acta: Acta | null;
  onSuccess: () => void;
}

const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:8003';

const ActaAnexosModal: React.FC<ActaAnexosModalProps> = ({
  isOpen,
  onClose,
  acta,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [anexos, setAnexos] = useState<AnexoItem[]>([]);

  useEffect(() => {
    if (isOpen && acta) {
      setAnexos(acta.anexos || []);
    } else {
      resetForm();
    }
  }, [isOpen, acta]);

  const resetForm = () => {
    setFile(null);
    setErrorMessage('');
    setNombre('');
    setDescripcion('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Validate that the selected file is an image
      if (!selectedFile.type.startsWith('image/')) {
        setErrorMessage('Solo se permiten imágenes (png, jpg, jpeg, gif).');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setErrorMessage('');
      if (!nombre) {
        setNombre(selectedFile.name);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acta || !file) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('idacta', acta.id.toString());
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);

    try {
      // Ensure file is an image before uploading
      if (!file?.type.startsWith('image/')) {
        alert('El archivo seleccionado no es una imagen válida.');
        setIsSubmitting(false);
        return;
      }

      const response = await axios.post('actas/anexos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const newAnexo = response.data.data;
      setAnexos((prev) => [...prev, newAnexo]);
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error('Error al subir anexo:', error);
      alert(error.response?.data?.message || 'Error al subir el anexo. Por favor, intente de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este anexo?')) return;

    try {
      await axios.delete(`actas/anexos/${id}`);
      setAnexos((prev) => prev.filter((a) => a.id !== id));
      onSuccess();
    } catch (error) {
      console.error('Error al eliminar anexo:', error);
      alert('Error al eliminar el anexo.');
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'ki-file-pdf text-red-500';
      case 'doc':
      case 'docx': return 'ki-file-doc text-blue-500';
      case 'xls':
      case 'xlsx': return 'ki-file-sheet text-green-500';
      case 'png':
      case 'jpg':
      case 'jpeg': return 'ki-file-img text-purple-500';
      default: return 'ki-file text-gray-500';
    }
  };

  const getFullFileUrl = (anexo: AnexoItem) => {
    const url = anexo.rutaArchivoUrl || anexo.archivo;
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  if (!isOpen || !acta) return null;

  return (
    <Modal open={isOpen} onClose={onClose} className="mx-4 sm:mx-auto max-w-2xl w-full">
      <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full overflow-hidden shadow-2xl border-none">
        <ModalHeader className="bg-gray-50 dark:bg-coal-400/50 border-b border-gray-100 dark:border-coal-300 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
              <i className="ki-outline ki-file-up text-amber-600 dark:text-amber-400 text-xl" />
            </div>
            <div>
              <ModalTitle className="text-lg font-bold text-gray-800 dark:text-white">
                Anexos del Acta
              </ModalTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">Gestionar archivos adjuntos</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-coal-300 transition-colors"
          >
            <i className="ki-outline ki-cross text-lg" />
          </button>
        </ModalHeader>

        <ModalBody className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Formulario de Carga */}
          <form onSubmit={handleUpload} className="bg-gray-50 dark:bg-coal-600/30 border border-dashed border-gray-200 dark:border-coal-300 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <i className="ki-outline ki-plus-circle text-blue-500" />
              Subir Nuevo Anexo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Archivo</label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="anexo-file-input"
                    accept="image/*"
                  />
                  <label
                    htmlFor="anexo-file-input"
                    className="flex items-center gap-2 w-full px-4 py-2 bg-white dark:bg-coal-500 border border-gray-200 dark:border-coal-300 rounded-lg text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-coal-400 transition-colors truncate"
                  >
                    <i className="ki-outline ki-file-up text-blue-500" />
                    {file ? file.name : 'Seleccionar archivo...'}
                  </label>
                  {errorMessage && (
                    <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre del anexo"
                  className="w-full px-4 py-2 bg-white dark:bg-coal-500 border border-gray-200 dark:border-coal-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Descripción (Opcional)</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Breve descripción del contenido..."
                rows={2}
                className="w-full px-4 py-2 bg-white dark:bg-coal-500 border border-gray-200 dark:border-coal-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !file}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <i className="ki-outline ki-loading animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <i className="ki-outline ki-cloud-change" />
                    Subir Archivo
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Lista de Anexos */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <i className="ki-outline ki-file-long text-amber-500" />
              Archivos Adjuntos ({anexos.length})
            </h3>

            {anexos.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 dark:bg-coal-600/20 rounded-xl border border-dashed border-gray-200 dark:border-coal-300">
                <i className="ki-outline ki-file-remove text-gray-300 text-4xl mb-2 block" />
                <p className="text-xs text-gray-400">No hay anexos registrados para esta acta.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {anexos.map((anexo) => (
                  <div
                    key={anexo.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-coal-500 border border-gray-100 dark:border-coal-300 rounded-xl hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-coal-400/50 flex items-center justify-center shrink-0">
                        <i className={`ki-outline ${getFileIcon(anexo.archivo)} text-xl`} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate" title={anexo.nombre}>
                          {anexo.nombre}
                        </span>
                        {anexo.descripcion && (
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            {anexo.descripcion}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={getFullFileUrl(anexo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        title="Ver / Descargar"
                      >
                        <i className="ki-outline ki-eye" />
                      </a>
                      <button
                        onClick={() => anexo.id && handleDelete(anexo.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="Eliminar"
                      >
                        <i className="ki-outline ki-trash" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalBody>

        <ModalHeader className="border-t border-gray-100 dark:border-coal-300 px-6 py-4 flex items-center justify-end bg-gray-50 dark:bg-coal-400/30">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </ModalHeader>
      </ModalContent>
    </Modal>
  );
};

export default ActaAnexosModal;
