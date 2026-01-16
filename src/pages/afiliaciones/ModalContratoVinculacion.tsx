import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

interface ModalProps {
  open: boolean;
  vinculacion: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalContratoVinculacion = ({ open, onClose, vinculacion, onSave }: ModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [observacion, setObservacion] = useState<string>('');
  const [fechaInicial, setFechaInicial] = useState<string>('');
  const [fechaFinal, setFechaFinal] = useState<string>('');
  const [numeroContrato, setNumeroContrato] = useState<string>('');
  const [errors, setErrors] = useState<{
    file?: string;
    observacion?: string;
    fechaInicial?: string;
    fechaFinal?: string;
    numeroContrato?: string;
  }>({});

  useEffect(() => {
    if (open) {
      setFile(null);
      setObservacion('');
      setFechaInicial('');
      setFechaFinal('');
      setNumeroContrato('');
      setErrors({});
    }
  }, [open]);

  const validateFields = () => {
    const newErrors: {
      file?: string;
      observacion?: string;
      fechaInicial?: string;
      fechaFinal?: string;
      numeroContrato?: string;
    } = {};

    if (!file) newErrors.file = 'Debe adjuntar un archivo.';
    if (!observacion) newErrors.observacion = 'La observación es obligatoria.';
    if (!fechaInicial) newErrors.fechaInicial = 'Debe seleccionar la fecha inicial.';
    if (!fechaFinal) newErrors.fechaFinal = 'Debe seleccionar la fecha final.';
    if (!numeroContrato) newErrors.numeroContrato = 'El número de contrato es obligatorio.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) return;

    try {
      const data = new FormData();
      data.append('idVinculacion', vinculacion.id.toString());
      data.append('observacion', observacion);
      data.append('fechaInicial', fechaInicial);
      data.append('fechaFinal', fechaFinal);
      data.append('numeroContrato', numeroContrato);
      if (file) {
        data.append('rutaFile', file);
      }

      await axios.post(`store_contrato_vinculacion`, data);

      setFile(null);
      setObservacion('');
      setFechaInicial('');
      setFechaFinal('');
      setNumeroContrato('');
      setErrors({});
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error('Error al guardar contrato de vinculación:', error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[500px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Nuevo Contrato de Vinculación</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <div>
            <label htmlFor="numeroContrato" className="block text-sm font-medium mb-2">
              Número de Contrato
            </label>
            <input
              type="text"
              id="numeroContrato"
              value={numeroContrato}
              onChange={(e) => setNumeroContrato(e.target.value)}
              className={`input w-full ${errors.numeroContrato ? 'border-red-500' : ''}`}
            />
            {errors.numeroContrato && (
              <p className="text-red-500 text-sm mt-1">{errors.numeroContrato}</p>
            )}
          </div>

          <div>
            <label htmlFor="observacion" className="block text-sm font-medium mb-2">
              Observación
            </label>
            <textarea
              id="observacion"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className={`textarea w-full p-2 border ${errors.observacion ? 'border-red-500' : 'border-gray-300'} rounded-md`}
            />
            {errors.observacion && (
              <p className="text-red-500 text-sm mt-1">{errors.observacion}</p>
            )}
          </div>

          <div>
            <label htmlFor="fechaInicial" className="block text-sm font-medium mb-2">
              Fecha Inicial
            </label>
            <input
              type="date"
              id="fechaInicial"
              value={fechaInicial}
              onChange={(e) => setFechaInicial(e.target.value)}
              className={`input w-full ${errors.fechaInicial ? 'border-red-500' : ''}`}
            />
            {errors.fechaInicial && (
              <p className="text-red-500 text-sm mt-1">{errors.fechaInicial}</p>
            )}
          </div>

          <div>
            <label htmlFor="fechaFinal" className="block text-sm font-medium mb-2">
              Fecha Final
            </label>
            <input
              type="date"
              id="fechaFinal"
              value={fechaFinal}
              onChange={(e) => setFechaFinal(e.target.value)}
              className={`input w-full ${errors.fechaFinal ? 'border-red-500' : ''}`}
            />
            {errors.fechaFinal && <p className="text-red-500 text-sm mt-1">{errors.fechaFinal}</p>}
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-2">
              Documento del Contrato
            </label>
            <input
              type="file"
              id="file"
              onChange={(e) => e.target.files?.length && setFile(e.target.files[0])}
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

export { ModalContratoVinculacion };
