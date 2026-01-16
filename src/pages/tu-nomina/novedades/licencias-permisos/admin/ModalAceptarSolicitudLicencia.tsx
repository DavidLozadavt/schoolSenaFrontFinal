import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalAceptarSolicitudLicencia = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setComentario('');
    }
  }, [open]);

  const handleSave = async (estado: string) => {
    if (!comentario.trim()) {
      setError('El comentario es obligatorio.');
      return;
    }

    const payload = {
      estado: estado,
      comentario: comentario
    };

    try {
      if (data?.id) {
        await axios.put(`update_status_by_supervisor/${data?.id}`, payload);
        enqueueSnackbar('Solicitud actualizada con éxito.', { variant: 'success' });
      }

      if (onSave) onSave();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al guardar los datos.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleRechazar = () => {
    handleSave('RECHAZADO');
  };

  const handleAceptar = () => {
    handleSave('ACEPTADO');
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Confirmar o Rechazar Solicitud</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="comentario" className="block mb-1 text-sm font-medium"></label>
            <textarea
              id="comentario"
              className={`textarea p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Escribe un comentario"
              rows={4}
              value={comentario}
              onChange={(e) => {
                setComentario(e.target.value);
                if (error) setError('');
              }}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-sm btn-danger" onClick={handleRechazar}>
              Rechazar
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleAceptar}>
              Aceptar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalAceptarSolicitudLicencia };
