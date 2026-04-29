import React from 'react';
import { Acta } from '../types';

interface ActaCardProps {
  acta: Acta;
  onClick: (acta: Acta) => void;
  onDownloadPDF: (idActa: number) => void;
  onEdit?: (acta: Acta) => void;
}

const ActaCard: React.FC<ActaCardProps> = ({ acta, onClick, onDownloadPDF, onEdit }) => {
  return (
    <div
      className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(acta)}
    >
      <div className="px-5 py-3 border-b border-gray-100 dark:border-coal-300 flex justify-between items-center bg-gray-50 dark:bg-coal-400/50">
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          {acta.tipoActa}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
          ID #{acta.id}
        </span>
      </div>


      <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
          <i className="ki-outline ki-information text-gray-400 text-sm" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {acta.nombre || 'No especificado'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <i className="ki-outline ki-calendar text-gray-400 text-sm" />
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {new Date(acta.fecha).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <i className="ki-outline ki-geolocation text-gray-400 text-sm" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {acta.lugar || 'No especificado'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <i className="ki-outline ki-book text-gray-400 text-sm" />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Ficha:{' '}
            <span className="text-gray-700 dark:text-gray-200">
              {acta.ficha?.codigo || 'N/A'}
            </span>
          </span>
        </div>

        {acta.novedades && acta.novedades.length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-coal-300 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {acta.novedades.length} Novedades
            </span>
            <button className="text-xs text-blue-500 hover:text-blue-600 font-semibold flex items-center gap-1">
              Ver detalles <i className="ki-outline ki-arrow-right text-[10px]" />
            </button>
          </div>
        )}
        
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownloadPDF(acta.id);
            }}
            title='Descargar Acta'
            className="flex items-center justify-center flex-1 py-1.5 text-red-600 transition-all border border-transparent bg-red-50/50 dark:bg-red-500/10 rounded-lg hover:border-red-500 hover:scale-105"
          >
            <i className="ki-outline ki-file-down" />
          </button>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(acta);
              }}
              title='Editar Acta'
              className="flex items-center justify-center flex-1 py-1.5 text-blue-600 transition-all border border-transparent bg-blue-50/50 dark:bg-blue-500/10 rounded-lg hover:border-blue-500 hover:scale-105"
            >
              <i className="ki-outline ki-notepad-edit" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActaCard;
