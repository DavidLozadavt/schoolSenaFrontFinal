import React, { useEffect, useRef, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle, ModalFooter } from '@/components/modal';
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
  initialFecha?: string;
  fechaInputType?: 'date' | 'datetime-local';
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
  fechaInputType = 'datetime-local',
  submitButtonText,
  savingButtonText = 'Guardando...',
  onSubmit
}) => {
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(false);
  const fechaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setNuevaFecha(initialFecha);
      setDescripcion('');
      setError('');
    }
  }, [open, initialFecha]);

  useEffect(() => {
    if (!open) return;
    const syncDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    syncDark();
    const obs = new MutationObserver(syncDark);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, [open]);

  /** Abre el selector nativo con clic en cualquier zona del campo (no solo el icono). */
  const abrirSelectorFecha = () => {
    const el = fechaInputRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === 'function') {
        el.showPicker();
      }
    } catch {
      // showPicker puede fallar si el navegador lo bloquea; el input sigue usable.
    }
  };

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
      <ModalContent className="w-[95vw] max-w-[720px] top-[8%] max-h-[90vh] flex flex-col overflow-hidden p-0">
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col min-h-0 max-h-[90vh] flex-1">
          <ModalHeader className="shrink-0 px-5 sm:px-6 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
            <ModalTitle className="text-gray-900 dark:text-white">{title}</ModalTitle>
            <button
              type="button"
              className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <KeenIcon icon="cross" />
            </button>
          </ModalHeader>

          <ModalBody className="flex flex-col gap-5 sm:gap-6 px-5 sm:px-6 py-5 sm:py-6 flex-1 min-h-0 overflow-y-auto">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50/90 p-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-white">
                {fechaLabel} <span className="text-red-500">*</span>
              </label>
              <input
                ref={fechaInputRef}
                type={fechaInputType}
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                onClick={abrirSelectorFecha}
                style={{ colorScheme: isDark ? 'dark' : 'light' }}
                className="input datetime-ampliar-actividad w-full text-sm py-2.5 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-500 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/60 cursor-pointer"
                placeholder="dd/mm/aaaa"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-white">
                {descripcionLabel}
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={6}
                maxLength={2000}
                className="input w-full text-sm py-2.5 px-3 min-h-[140px] border border-gray-300 dark:border-gray-600 rounded-lg resize-y bg-white dark:bg-coal-500 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/60"
                placeholder={descripcionPlaceholder}
              />
            </div>
          </ModalBody>

          <ModalFooter className="shrink-0 flex justify-between gap-3 px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-coal-500">
            <button
              type="button"
              onClick={onClose}
              className="btn bg-red-600 hover:bg-red-700 text-white"
              disabled={saving}
            >
              X CANCELAR
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary min-w-[140px]">
              {saving ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  {savingButtonText}
                </span>
              ) : (
                submitButtonText
              )}
            </button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default ModalActividadFechaMotivo;
