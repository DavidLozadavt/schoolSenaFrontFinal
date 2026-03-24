import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import type { Actividad } from './ModalCrearActividad';

interface ModalAmpliarActividadProps {
  open: boolean;
  onClose: () => void;
  actividad: Actividad | null;
  idFicha: number;
  onSave: () => void;
  onSuccess?: (message: string) => void;
}

const ModalAmpliarActividad: React.FC<ModalAmpliarActividadProps> = ({
  open,
  onClose,
  actividad,
  idFicha,
  onSave,
  onSuccess
}) => {
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [descripcionExtension, setDescripcionExtension] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setNuevaFecha('');
      setDescripcionExtension('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!actividad?.id || !idFicha) {
      setError('Faltan datos de actividad o ficha');
      return;
    }
    if (!nuevaFecha.trim()) {
      setError('La nueva fecha es obligatoria');
      return;
    }
    setSaving(true);
    try {
      await axios.post('calificacion-actividad/ampliar', {
        idActividad: actividad.id,
        idFicha,
        fechaFinal: nuevaFecha,
        descripcionExtension: descripcionExtension.trim() || undefined
      });
      onSuccess?.('Actividad ampliada correctamente');
      onSave();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.fechaFinal?.[0] || 'Error al ampliar la actividad';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} zIndex={120}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>Ampliar actividad</ModalTitle>
          <button
            type="button"
            className="btn btn-sm btn-icon btn-light btn-clear text-red-600 hover:text-red-700"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nueva fecha
              </label>
              <input
                type="datetime-local"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                className="input w-full text-sm py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg"
                placeholder="dd/mm/aaaa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción de la extensión
              </label>
              <textarea
                value={descripcionExtension}
                onChange={(e) => setDescripcionExtension(e.target.value)}
                rows={3}
                className="input w-full text-sm py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none"
                placeholder="Indique el motivo de la extensión..."
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg flex items-center gap-1"
              >
                {saving ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Guardando...
                  </>
                ) : (
                  <>+ ACEPTAR</>
                )}
              </button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalAmpliarActividad;
