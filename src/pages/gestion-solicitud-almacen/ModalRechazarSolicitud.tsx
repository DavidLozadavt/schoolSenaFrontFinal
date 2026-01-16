import React, { useState } from 'react';
import axios from 'axios';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
  solicitudId: number | null;
}

const ModalRechazarSolicitud = ({ open, onClose, onSave, solicitudId }: Props) => {
  const { enqueueSnackbar } = useSnackbar();
  const [observacion, setObservacion] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!observacion.trim()) {
      setError(true);
      return;
    }

    try {
      setLoading(true);

      await axios.post(`rechazar_producto_almacen`, {
        observacion,
        idDistribucionProducto: solicitudId
      });

      enqueueSnackbar('Solicitud rechazada correctamente', { variant: 'success' });

      setObservacion('');
      onSave && onSave();
      onClose();
    } catch (e) {
      enqueueSnackbar('Error al rechazar la solicitud', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setObservacion('');
    setError(false);
    onClose();
  };

  return (
    <Modal open={open}>
      <ModalContent className="max-w-[600px] top-[10%] p-4 relative">
        <ModalHeader>
          <ModalTitle>Rechazar Solicitud</ModalTitle>
          <button
            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-3 px-0 py-5">
          {/* Contenido */}
          <div className="px-6 py-6 space-y-4 text-gray-900 dark:text-gray-100">
            <div className="grid grid-cols-12 gap-4 items-start">
              <label
                className="
          col-span-3 pt-2 text-base font-medium
          text-gray-700
        "
              >
                Observación
              </label>

              <div className="col-span-9">
                <textarea
                  className={`
            w-full rounded-md border px-3 py-2 min-h-[100px]
            bg-transparent
            text-gray-800
            placeholder-gray-500 dark:placeholder-gray-400
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          `}
                  placeholder="Ingrese una observación o motivo"
                  value={observacion}
                  onChange={(e) => {
                    setObservacion(e.target.value);
                    setError(false);
                  }}
                />

                {error && (
                  <p className="text-red-500 text-sm mt-1">
                    Por favor ingrese un valor válido para la observación.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer con botones (mismo estilo que ModalAlmacen) */}
          <div className="flex justify-end gap-3 px-4 mt-4">
            <button className="btn btn-secondary" onClick={handleClose} disabled={loading}>
              Cancelar
            </button>

            <button
              className={`btn btn-primary ${loading ? 'opacity-60' : ''}`}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Aceptar'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalRechazarSolicitud;
