import React from 'react';
import { ACTIVIDADES_MINIMAS } from '../constants';

interface ActividadesButtonProps {
  totalActividades: number | null;
  onOpenActividades: () => void;
}

export const ActividadesButton: React.FC<ActividadesButtonProps> = ({
  totalActividades,
  onOpenActividades
}) => {
  return (
    <div className="px-5 py-3 border-b border-gray-100 dark:border-coal-300 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5">
      <button
        onClick={onOpenActividades}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-coal-400 border border-blue-200 dark:border-blue-500/30 rounded-lg hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="ki-outline ki-clipboard text-blue-600 dark:text-blue-400 text-lg" />
            {/* Burbuja con el conteo */}
            {totalActividades !== null && totalActividades > 0 && (
              <span
                className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none ${
                  totalActividades >= ACTIVIDADES_MINIMAS ? 'bg-green-500' : 'bg-orange-500'
                }`}
              >
                {totalActividades > 99 ? '99+' : totalActividades}
              </span>
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              Actividades del Contrato
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalActividades === null
                ? 'Cargando...'
                : totalActividades === 0
                  ? `Mínimo ${ACTIVIDADES_MINIMAS} actividades requeridas`
                  : totalActividades >= ACTIVIDADES_MINIMAS
                    ? `${totalActividades} actividades · ✓ Listo para informe`
                    : `${totalActividades} de ${ACTIVIDADES_MINIMAS} actividades mínimas`}
            </p>
          </div>
        </div>
        <i className="ki-outline ki-right text-gray-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform" />
      </button>
      {totalActividades !== null && (
        <div className="mt-2 px-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              Progreso mínimo para informe
            </span>
            <span
              className={`text-[10px] font-semibold ${
                totalActividades >= ACTIVIDADES_MINIMAS
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-orange-600 dark:text-orange-400'
              }`}
            >
              {Math.min(totalActividades, ACTIVIDADES_MINIMAS)}/{ACTIVIDADES_MINIMAS}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 dark:bg-coal-300 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalActividades >= ACTIVIDADES_MINIMAS ? 'bg-green-500' : 'bg-orange-400'
              }`}
              style={{ width: `${Math.min((totalActividades / ACTIVIDADES_MINIMAS) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
