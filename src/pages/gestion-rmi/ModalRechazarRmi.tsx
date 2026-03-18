import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSnackbar } from 'notistack';
import axios from 'axios';

interface ModalRechazarRmiProps {
  isOpen: boolean;
  onClose: () => void;
  instructor: {
    idActivation: number;
    persona: {
      nombre1: string;
      nombre2?: string;
      apellido1: string;
      apellido2?: string;
    };
  };
  correoInstructor:string;
  periodo?: string;
  onSave?: (motivoRechazo?: string) => void;
}

const ModalRechazarRmi: React.FC<ModalRechazarRmiProps> = ({
  isOpen,
  onClose,
  instructor,
  correoInstructor,
  periodo,
  onSave
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fullName = `${instructor.persona.nombre1} ${instructor.persona.nombre2 ?? ''} ${instructor.persona.apellido1} ${instructor.persona.apellido2 ?? ''}`.trim();

  useEffect(() => {
    if (isOpen) {
      setMotivo('');
      setError('');
    }
  }, [isOpen]);

  const handleRechazar = async () => {
    if (!motivo.trim()) {
      setError('El motivo es obligatorio.');
      return;
    }

    if (motivo.length > 500) {
      setError('El motivo no puede exceder 500 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`instructores/${instructor.idActivation}/rechazar-rmi`, {
        motivo: motivo.trim(),
        periodo: periodo,
        email:correoInstructor
      });
      enqueueSnackbar('RMI rechazado con éxito.', { variant: 'success' });
      if (onSave) onSave(motivo.trim());
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al rechazar el RMI.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-coal-500 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-coal-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-coal-300">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Rechazar RMI</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 text-gray-400 border border-gray-200 dark:border-coal-300 rounded-full hover:bg-red-500 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Ingresa el motivo por el cual se rechaza el RMI de <span className="font-semibold">{fullName}</span>:
          </p>

          <div>
            <textarea
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                if (error) setError('');
              }}
              placeholder="Escriba aquí las observaciones..."
              rows={6}
              maxLength={500}
              className={`w-full px-3 py-2 text-sm border rounded-md bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300 dark:border-coal-200'
              }`}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-red-500">{error}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {motivo.length}/500 caracteres
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-coal-300 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs bg-white hover:bg-gray-50 font-semibold text-gray-700 dark:text-gray-300 dark:bg-coal-600 dark:hover:bg-coal-500 rounded-lg transition-all border border-gray-200 dark:border-coal-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleRechazar}
            disabled={loading}
            className="px-4 py-2 text-xs bg-red-50 hover:bg-red-100 font-semibold text-red-700 dark:text-red-400 dark:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Rechazando...' : 'Rechazar RMI'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalRechazarRmi;
