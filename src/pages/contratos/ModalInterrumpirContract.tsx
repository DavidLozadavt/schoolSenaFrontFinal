import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { ContratoInterface } from './model/ContratoInterface';
import { useConfirm } from '@/hooks';

interface ModalProps {
  open: boolean;
  contrato?: ContratoInterface;
  onClose: () => void;
  onSave?: () => void;
}

const ModalInterrumpirContract = ({ open, onClose, contrato, onSave }: ModalProps) => {
  const [observacion, setObservacion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [tipoTerminacion, setTipoTerminacion] = useState<string>('');
  const { confirmAction } = useConfirm();
  const [errors, setErrors] = useState<{
    observacion?: string;
    file?: string;
    tipoTerminacion?: string;
  }>({});

  useEffect(() => {
    if (open) {
      setObservacion('');
      setFile(null);
      setTipoTerminacion('');
      setErrors({});
    }
  }, [open]);

  const validateFields = () => {
    const newErrors: { observacion?: string; file?: string; tipoTerminacion?: string } = {};
    let firstErrorField: string | null = null;

    if (!tipoTerminacion) {
      newErrors.tipoTerminacion = 'Debe seleccionar un tipo de terminación.';
      if (!firstErrorField) firstErrorField = 'tipoTerminacion';
    }
    if (!observacion.trim()) {
      newErrors.observacion = 'La observación es requerida.';
      if (!firstErrorField) firstErrorField = 'observacion';
    }
    if (!file) {
      newErrors.file = 'Debe adjuntar un archivo.';
      if (!firstErrorField) firstErrorField = 'file';
    }

    setErrors(newErrors);

    if (firstErrorField) {
      document.getElementById(firstErrorField)?.focus();
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateFields()) {
      return;
    }

    confirmAction(
      'Esta acción terminará el contrato, restringirá el acceso del usuario a la plataforma y detendrá los pagos. ¿Desea continuar?',
      handleInterrumpirContract
    );
  };

  const handleInterrumpirContract = async () => {
    if (!validateFields()) return;

    try {
      const data = new FormData();
      if (contrato?.id) {
        data.append('idContrato', contrato.id + '');
      }
      data.append('idTipoTerminacionContrato', tipoTerminacion);
      if (file) {
        data.append('rutaArchivoContratoFile', file);
      }
      data.append('observacion', observacion);

      await axios.post(`interrumpir_contrato`, data);
      setObservacion('');
      setFile(null);
      setTipoTerminacion('');
      setErrors({});
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error) {
      console.error('Error al archivar:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrors((prev) => ({ ...prev, file: '' }));
    }
  };

  const handleObservacionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setObservacion(e.target.value);
    setErrors((prev) => ({ ...prev, observacion: '' }));
  };

  const handleTipoTerminacionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTipoTerminacion(e.target.value);
    setErrors((prev) => ({ ...prev, tipoTerminacion: '' }));
  };

  const [loading, setLoading] = useState<boolean>(true);
  const [tiposTerminacionContrato, setTiposTerminacionContrato] = useState<any[]>([]);

  const fetchTiposTerminacionContrato = async () => {
    try {
      const response = await axios.get('tipos_terminacion_contrato');
      setTiposTerminacionContrato(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiposTerminacionContrato();
  }, []);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>Termino Contrato</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <div>
            <label className="block text-sm font-medium mb-2">
              Tipo de Terminación de Contrato
            </label>
            <select
              name="idTipoTerminacionContrato"
              className={`select w-full ${errors.tipoTerminacion ? 'border-red-500' : ''}`}
              value={tipoTerminacion}
              onChange={handleTipoTerminacionChange}
            >
              <option value="">Seleccione una Opción</option>
              {Array.isArray(tiposTerminacionContrato) &&
                tiposTerminacionContrato.map((res) => (
                  <option key={res.id} value={res.id}>
                    {res.nombre}
                  </option>
                ))}
            </select>

            {errors.tipoTerminacion && (
              <p className="text-red-500 text-sm mt-1">{errors.tipoTerminacion}</p>
            )}
          </div>

          <div>
            <label htmlFor="observacion" className="block text-sm font-medium mb-2">
              Observación
            </label>
            <textarea
              id="observacion"
              value={observacion}
              onChange={handleObservacionChange}
              className={`textarea ${errors.observacion ? 'border-red-500' : ''}`}
              rows={4}
              placeholder="Escribe una observación..."
            ></textarea>
            {errors.observacion && (
              <p className="text-red-500 text-sm mt-1">{errors.observacion}</p>
            )}
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-2">
              Adjuntar Archivo
            </label>
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
              className={`file-input ${errors.file ? 'border-red-500' : ''}`}
            />
            {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalInterrumpirContract };
