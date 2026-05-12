import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Acta, AsistenciaItem } from '../types';
import { useSnackbar } from 'notistack';

interface ActaAprobarModalProps {
  isOpen: boolean;
  onClose: () => void;
  acta: Acta | null;
  idContrato: number | undefined;
  onSuccess: () => void;
}

const ActaAprobarModal: React.FC<ActaAprobarModalProps> = ({ isOpen, onClose, acta, idContrato, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [aprueba, setAprueba] = useState<'SI' | 'NO'>('SI');
  const [observacion, setObservacion] = useState('');

  const asistenciaActual = acta?.asistencias?.find((a) => a.idContrato == idContrato) as AsistenciaItem | undefined;

  useEffect(() => {
    if (isOpen && asistenciaActual) {
      setAprueba(asistenciaActual.aprueba || 'SI');
      setObservacion(asistenciaActual.observacion || '');
    }
  }, [isOpen, asistenciaActual]);

  if (!isOpen || !acta || !asistenciaActual) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asistenciaActual.id) return;
    
    setLoading(true);
    try {
      await axios.put(`actas/${acta.id}/asistencias/${asistenciaActual.id}`, {
        aprueba,
        observacion
      });
      enqueueSnackbar('Asistencia actualizada correctamente', { variant: 'success' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al actualizar la asistencia:', error);
      enqueueSnackbar('Error al actualizar la asistencia', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-coal-500 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-coal-300 flex justify-between items-center bg-gray-50/50 dark:bg-coal-400/50">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Aprobar Asistencia
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Acta: {acta.nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white dark:bg-coal-400 rounded-lg shadow-sm border border-gray-200 dark:border-coal-300"
          >
            <i className="ki-outline ki-cross text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              ¿Aprueba el acta? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="aprueba"
                  value="SI"
                  checked={aprueba === 'SI'}
                  onChange={(e) => setAprueba(e.target.value as 'SI' | 'NO')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">SÍ</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="aprueba"
                  value="NO"
                  checked={aprueba === 'NO'}
                  onChange={(e) => setAprueba(e.target.value as 'SI' | 'NO')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">NO</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Observación (Opcional)
            </label>
            <textarea
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
              rows={3}
              placeholder="Ingrese alguna observación sobre su asistencia..."
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-coal-300">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-coal-400 rounded-xl transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <i className="ki-outline ki-loading animate-spin" />}
              Guardar Respuesta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActaAprobarModal;
