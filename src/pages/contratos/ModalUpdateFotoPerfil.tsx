import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import Toast from '../programas-academicos/components/Toast';
import { ContratoInterface } from './model/ContratoInterface';

interface ModalUpdateFotoPerfilProps {
  open: boolean;
  onClose: () => void;
  contrato: ContratoInterface;
  onSave: () => void;
}

const defaultImage = '/media/images/default/user.svg';

const ModalUpdateFotoPerfil = ({ open, onClose, contrato, onSave }: ModalUpdateFotoPerfilProps) => {
  const [saving, setSaving] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string>(defaultImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { enqueueSnackbar } = useSnackbar();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!open && !showToast) {
      setToastMessage('');
    }
  }, [open, showToast]);

  useEffect(() => {
    if (open && contrato?.persona) {
      // Mostrar la foto actual si existe
      if (contrato.persona.rutaFotoUrl) {
        setPreviewSrc(contrato.persona.rutaFotoUrl);
      } else {
        setPreviewSrc(defaultImage);
      }
      setSelectedFile(null);
    }
  }, [open, contrato]);

  useEffect(() => {
    if (selectedFile instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewSrc(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else if (contrato?.persona?.rutaFotoUrl) {
      setPreviewSrc(contrato.persona.rutaFotoUrl);
    } else {
      setPreviewSrc(defaultImage);
    }
  }, [selectedFile, contrato]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        enqueueSnackbar('Por favor seleccione un archivo de imagen', { variant: 'error' });
        return;
      }
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        enqueueSnackbar('La imagen no debe superar los 5MB', { variant: 'error' });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (contrato?.persona?.rutaFotoUrl) {
      setPreviewSrc(contrato.persona.rutaFotoUrl);
    } else {
      setPreviewSrc(defaultImage);
    }
  };

  const handleSave = async () => {
    if (!contrato?.persona?.id) {
      enqueueSnackbar('No se encontró la persona', { variant: 'error' });
      return;
    }

    if (!selectedFile) {
      enqueueSnackbar('Por favor seleccione una imagen', { variant: 'error' });
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('rutaFotoFile', selectedFile);

      await axios.post(`update_contrato_persona/${contrato.persona.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setToastMessage('Foto de perfil actualizada correctamente');
      setShowToast(true);
      onSave();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al actualizar la foto de perfil';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[500px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>Cambiar Foto de Perfil</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-5 px-0 py-5">
          {/* Vista previa de la imagen */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="flex items-center justify-center rounded-full border-4 border-primary bg-light h-[200px] w-[200px] overflow-hidden">
                <img
                  src={previewSrc}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultImage;
                  }}
                />
              </div>
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                  title="Eliminar imagen seleccionada"
                >
                  <KeenIcon icon="trash" className="text-sm" />
                </button>
              )}
            </div>

            {/* Input de archivo */}
            <div className="w-full">
              <label className="block text-sm font-medium mb-2 text-center">
                {selectedFile ? 'Imagen seleccionada' : 'Seleccionar nueva imagen'}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input w-full"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              className="btn btn-sm btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSave}
              disabled={saving || !selectedFile}
            >
              {saving ? 'Guardando...' : 'Guardar Foto'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>

    <Toast
      message={toastMessage}
      isOpen={showToast}
      onClose={() => setShowToast(false)}
    />
    </>
  );
};

export { ModalUpdateFotoPerfil };
