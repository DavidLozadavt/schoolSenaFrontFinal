import React from 'react';
import { Aprendiz } from '../types';

type Props = {
  aprendiz: Aprendiz;
};

const AprendizCard: React.FC<Props> = ({ aprendiz }) => {
  return (
    <div className="group bg-white dark:bg-coal-600 rounded-xl p-5 border border-gray-100 dark:border-coal-300 hover:border-blue-500/30 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        <div className="relative">
          {aprendiz.rutaFoto ? (
            <img
              src={aprendiz.rutaFoto}
              alt={aprendiz.nombreCompleto}
              className="w-14 h-14 rounded-xl object-cover ring-2 ring-gray-50 dark:ring-coal-400"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-coal-400 flex items-center justify-center text-gray-400">
              <i className="ki-outline ki-user text-3xl" />
            </div>
          )}
          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-coal-600 ${
              aprendiz.estadoMatricula === 'ACTIVO' ? 'bg-green-500' : 'bg-amber-500'
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-800 dark:text-white truncate group-hover:text-blue-600 transition-colors text-sm">
            {aprendiz.nombreCompleto}
          </h3>
          <div className="space-y-1.5 mt-2">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <i className="ki-outline ki-badge text-sm" />
              <span>{aprendiz.identificacion}</span>
            </div>
            {aprendiz.email && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <i className="ki-outline ki-sms text-sm" />
                <span className="truncate">{aprendiz.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-50 dark:border-coal-300 flex justify-between items-center">
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${
            aprendiz.estadoMatricula === 'ACTIVO'
              ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
          }`}
        >
          {aprendiz.estadoMatricula}
        </span>
        <button className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-bold flex items-center gap-1 uppercase tracking-wider">
          Perfil <i className="ki-outline ki-right text-xs" />
        </button>
      </div>
    </div>
  );
};

export default AprendizCard;
