import React, { useRef, useState } from 'react';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import {
  MATERIAL_DOCUMENTO_ACCEPT,
  MATERIAL_DOCUMENTO_FORMATOS_LABEL,
  validateMaterialDocumentoFile,
} from '@/pages/ambiente-virtual/actividades/materialDocumentoSupport';
import { TIPO_MATERIAL_OPTIONS } from '@/pages/ambiente-virtual/actividades/tipoMaterialApoyo';
import { materialCompetenciaService } from './materialCompetenciaService';

interface ModalSubirMaterialCompetenciaProps {
  open: boolean;
  idCompetencia: number;
  competenciaNombre?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const ModalSubirMaterialCompetencia: React.FC<ModalSubirMaterialCompetenciaProps> = ({
  open,
  idCompetencia,
  competenciaNombre,
  onClose,
  onSuccess,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoMaterial, setTipoMaterial] = useState('');
  const [link, setLink] = useState('');
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitulo('');
    setDescripcion('');
    setTipoMaterial('');
    setLink('');
    setDocumentoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      onError('El nombre del material es obligatorio.');
      return;
    }
    if (!documentoFile && !link.trim()) {
      onError('Se requiere documento o enlace.');
      return;
    }
    if (documentoFile) {
      const fileError = validateMaterialDocumentoFile(documentoFile);
      if (fileError) {
        onError(fileError);
        return;
      }
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('titulo', titulo.trim());
      fd.append('descripcion', descripcion.trim().slice(0, 3000));
      if (tipoMaterial) fd.append('tipoMaterial', tipoMaterial);
      if (documentoFile) fd.append('documento', documentoFile);
      if (link.trim()) fd.append('urlAdicional', link.trim());
      await materialCompetenciaService.subir(idCompetencia, fd);
      reset();
      onSuccess('Material agregado a la competencia.');
      onClose();
    } catch (err) {
      onError(materialCompetenciaService.errorMessage(err, 'Error al subir el material.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent className="max-w-xl">
        <ModalHeader>
          <ModalTitle>Agregar material</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {competenciaNombre ? (
              <p className="text-xs text-gray-600 dark:text-gray-200">
                Competencia destino:{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{competenciaNombre}</span>
              </p>
            ) : null}

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Nombre del material</label>
              <input
                type="text"
                className="input w-full"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={255}
                data-preserve-case
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Descripción</label>
              <textarea
                className="textarea w-full min-h-[90px]"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value.slice(0, 3000))}
                maxLength={3000}
                data-preserve-case
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Tipo de material</label>
              <select className="select w-full" value={tipoMaterial} onChange={(e) => setTipoMaterial(e.target.value)}>
                <option value="">Sin tipo</option>
                {TIPO_MATERIAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Archivo</label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={MATERIAL_DOCUMENTO_ACCEPT}
                  className="hidden"
                  onChange={(e) => setDocumentoFile(e.target.files?.[0] || null)}
                />
                <button type="button" className="btn btn-primary text-sm" onClick={() => fileInputRef.current?.click()}>
                  <KeenIcon icon="document" className="text-sm mr-1.5" />
                  Subir documento
                </button>
                <span className="text-xs text-gray-600 dark:text-gray-200 truncate">
                  {documentoFile ? documentoFile.name : 'Ningún archivo seleccionado'}
                </span>
              </div>
              <p className="text-[10px] text-gray-600 dark:text-gray-200 mt-1">{MATERIAL_DOCUMENTO_FORMATOS_LABEL}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Enlace adicional</label>
              <input
                type="url"
                className="input w-full"
                placeholder="https://ejemplo.com"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn btn-light" onClick={handleClose} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar material'}
              </button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalSubirMaterialCompetencia;
