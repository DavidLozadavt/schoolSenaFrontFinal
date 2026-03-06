import { KeenIcon } from '@/components';
import React from 'react';

interface ModalAreaConocimientoProps {
  isOpen: boolean;
  onClose: () => void;
  titulo?: string;
  mensaje?: string;
  programasConArea?: string[];
  programasSinArea?: string[];
  nombreArea?: string;
}

const ModalAreaConocimiento: React.FC<ModalAreaConocimientoProps> = ({
  isOpen,
  onClose,
  titulo = 'Información del Área de Conocimiento',
  mensaje,
  programasConArea = [],
  programasSinArea = [],
  nombreArea
}) => {
  if (!isOpen) return null;

  // Construir el mensaje según los datos disponibles
  let mensajeFinal = mensaje;
  if (!mensajeFinal) {
    if (programasConArea.length > 0 && programasSinArea.length > 0) {
      mensajeFinal = `El área de conocimiento "${nombreArea || 'esta área'}" ya existía en algunos programas pero se asoció correctamente a otros.`;
    } else if (programasConArea.length > 0) {
      mensajeFinal = `El área de conocimiento "${nombreArea || 'esta área'}" ya existe en todos los programas seleccionados.`;
    } else if (programasSinArea.length > 0) {
      mensajeFinal = `El área de conocimiento "${nombreArea || 'esta área'}" se creó y asoció correctamente.`;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-fade-in">
      <div className="bg-white dark:bg-coal-400 dark:border-coal-100 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-scale-in">
        <div className="flex items-center gap-4 mb-4">
          {/* Icono - cambiar color según el tipo de mensaje */}
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
            programasConArea.length > 0 && programasSinArea.length === 0
              ? 'bg-orange-100 dark:bg-orange-900/20'
              : programasConArea.length > 0
              ? 'bg-yellow-100 dark:bg-yellow-900/20'
              : 'bg-green-100 dark:bg-green-900/20'
          }`}>
            <KeenIcon 
              icon={programasConArea.length > 0 && programasSinArea.length === 0 ? "information" : programasConArea.length > 0 ? "information" : "check-circle"} 
              className={`text-2xl ${
                programasConArea.length > 0 && programasSinArea.length === 0
                  ? 'text-orange-600 dark:text-orange-400'
                  : programasConArea.length > 0
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'
              }`} 
            />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
              {titulo}
            </h3>
          </div>
        </div>

        {/* Mensaje principal */}
        {mensajeFinal && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            {mensajeFinal}
          </p>
        )}

        {/* Lista de programas donde ya existía */}
        {programasConArea.length > 0 && (
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-xs font-semibold text-orange-800 dark:text-orange-300 mb-2">
              El área ya existía en:
            </p>
            <ul className="space-y-1">
              {programasConArea.map((programa, index) => (
                <li key={index} className="text-xs text-orange-700 dark:text-orange-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  {programa}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Lista de programas donde se creó */}
        {programasSinArea.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs font-semibold text-green-800 dark:text-green-300 mb-2">
              Se asoció a:
            </p>
            <ul className="space-y-1">
              {programasSinArea.map((programa, index) => (
                <li key={index} className="text-xs text-green-700 dark:text-green-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  {programa}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Botón de cerrar */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-medium transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAreaConocimiento;
