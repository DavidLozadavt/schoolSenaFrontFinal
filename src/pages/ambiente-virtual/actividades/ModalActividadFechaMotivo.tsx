import React, { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

/** Misma base visual que el modal "Ampliar actividad" (datetime-local + textarea + Cancelar / acción principal). */
export interface ModalActividadFechaMotivoProps {
  open: boolean;
  onClose: () => void;
  zIndex?: number;
  title: React.ReactNode;
  fechaLabel: string;
  descripcionLabel: string;
  descripcionPlaceholder?: string;
  /** Valor `YYYY-MM-DDTHH:mm` para `input[type=datetime-local]` */
  initialFecha?: string;
  submitButtonText: string;
  savingButtonText?: string;
  /**
   * Debe ejecutar el guardado. Si debe mostrarse error en el modal, lanzar Error('mensaje') o rechazar axios.
   * El modal no cierra aquí salvo si el caller lo hace dentro de esta función tras éxito.
   */
  onSubmit: (fecha: string, descripcion: string) => Promise<void>;
}

const ModalActividadFechaMotivo: React.FC<ModalActividadFechaMotivoProps> = ({
  open,
  onClose,
  zIndex = 120,
  title,
  fechaLabel,
  descripcionLabel,
  descripcionPlaceholder = '',
  initialFecha = '',
  submitButtonText,
  savingButtonText = 'Guardando...',
  onSubmit
}) => {
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setNuevaFecha(initialFecha);
      setDescripcion('');
      setError('');
    }
  }, [open, initialFecha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nuevaFecha.trim()) {
      setError('La nueva fecha es obligatoria');
      return;
    }
    setSaving(true);
    try {
      await onSubmit(nuevaFecha.trim(), descripcion);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : String((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al guardar');
      setError(typeof msg === 'string' ? msg : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} zIndex={zIndex}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
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
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {error && (
              <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{fechaLabel}</label>
              <input
                type="datetime-local"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                className="input w-full text-sm py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg"
                placeholder="dd/mm/aaaa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{descripcionLabel}</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                maxLength={2000}
                className="input w-full text-sm py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none"
                placeholder={descripcionPlaceholder}
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
                    {savingButtonText}
                  </>
                ) : (
                  submitButtonText
                )}
              </button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalActividadFechaMotivo;
