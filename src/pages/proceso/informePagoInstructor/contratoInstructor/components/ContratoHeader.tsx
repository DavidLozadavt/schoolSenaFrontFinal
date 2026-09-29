import React from 'react';
import { Contrato } from '../types';

interface ContratoHeaderProps {
  contrato: Contrato;
}

export const ContratoHeader: React.FC<ContratoHeaderProps> = ({ contrato }) => {
  return (
    <div className="px-5 py-4 border-b border-gray-100 dark:border-coal-300 flex items-center gap-4">
      <img
        src={contrato.centroFormacion.rutaFotoUrl}
        alt={contrato.centroFormacion.nombre}
        className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 dark:border-coal-300 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="font-semibold text-gray-800 dark:text-white text-sm uppercase tracking-wide">
            {contrato.centroFormacion.nombre}
          </p>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
            Contrato {contrato.numeroContrato}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <i className="ki-outline ki-sms text-xs" />
            {contrato.centroFormacion.correo}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <i className="ki-outline ki-geolocation text-xs" />
            {contrato.centroFormacion.direccion}
          </p>
        </div>
      </div>
    </div>
  );
};
