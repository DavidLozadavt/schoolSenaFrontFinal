import React from 'react';
import { Ficha } from '../types';

type Props = {
  ficha: Ficha;
  onClick: (f: Ficha) => void;
};

const FichaCard: React.FC<Props> = ({ ficha, onClick }) => {
  return (
    <div
      onClick={() => onClick(ficha)}
      className="group bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 p-6 hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <i className="ki-outline ki-book text-2xl" />
        </div>
        <span className="bg-gray-100 dark:bg-coal-400 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-bold">
          {ficha.codigo}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Programa</p>
          <h3 className="text-sm font-bold text-gray-800 dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {ficha.asignacion?.programa?.nombrePrograma || 'Sin programa asignado'}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600">
              <i className="ki-outline ki-calendar text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Jornada</p>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{ficha.jornada?.nombreJornada || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600">
              <i className="ki-outline ki-geolocation text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Sede</p>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{ficha.sede?.nombreSede || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-coal-300 flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
          <span>Ver aprendices</span>
          <i className="ki-outline ki-right text-sm group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};

export default FichaCard;
