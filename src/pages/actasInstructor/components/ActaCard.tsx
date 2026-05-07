import React from 'react';
import { Acta } from '../types';

interface ActaCardProps {
  acta: Acta;
  onClick: (acta: Acta) => void;
  onDownloadPDF: (idActa: number) => void;
  onEdit?: (acta: Acta) => void;
  onAsistencias?: (acta: Acta) => void;
  onAprobar?: (acta: Acta) => void;
}

const ActaCard: React.FC<ActaCardProps> = ({ acta, onClick, onDownloadPDF, onEdit, onAsistencias, onAprobar }) => {
  const isLocked = acta.asistencias && acta.asistencias.length > 0 && acta.asistencias.every(a => a.aprueba === 'SI');

  return (
    <div
      className={`bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full ${isLocked ? 'opacity-90' : ''}`}
      onClick={() => onClick(acta)}
    >
      <div className="px-5 py-3 border-b border-gray-100 dark:border-coal-300 flex justify-between items-center bg-gray-50 dark:bg-coal-400/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            {acta.tipoActa}
          </span>
          {isLocked && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-[9px] font-bold text-green-600 dark:text-green-400 rounded-full border border-green-200 dark:border-green-500/30 uppercase tracking-tight">
              <i className="ki-outline ki-lock text-[10px]" />
              Finalizada
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
          ID #{acta.id}
        </span>
      </div>


      <div className="p-4 flex-1 flex flex-col space-y-3">
        <div className="flex items-start gap-2">
          <i className="ki-outline ki-information text-gray-400 text-sm mt-0.5" />
          <span className="text-sm text-gray-700 dark:text-gray-200 font-semibold line-clamp-2 leading-snug" title={acta.nombre}>
            {acta.nombre || 'No especificado'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <i className="ki-outline ki-calendar text-gray-400 text-sm" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(acta.fecha).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-start gap-2">
          <i className="ki-outline ki-geolocation text-gray-400 text-sm mt-0.5" />
          <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1" title={acta.lugar}>
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

        <div className="flex-1" />
        
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
              disabled={isLocked}
              title={isLocked ? 'Acta finalizada - No se puede editar' : 'Editar Acta'}
              className={`flex items-center justify-center flex-1 py-1.5 transition-all border border-transparent rounded-lg ${isLocked ? 'text-gray-400 bg-gray-100 dark:bg-coal-300 cursor-not-allowed opacity-50' : 'text-blue-600 bg-blue-50/50 dark:bg-blue-500/10 hover:border-blue-500 hover:scale-105'}`}
            >
              <i className="ki-outline ki-notepad-edit" />
            </button>
          )}
          {onAsistencias && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAsistencias(acta);
              }}
              disabled={isLocked}
              title={isLocked ? 'Acta finalizada - No se puede gestionar asistencias' : 'Gestionar Asistencias'}
              className={`flex items-center justify-center flex-1 py-1.5 transition-all border border-transparent rounded-lg ${isLocked ? 'text-gray-400 bg-gray-100 dark:bg-coal-300 cursor-not-allowed opacity-50' : 'text-purple-600 bg-purple-50/50 dark:bg-purple-500/10 hover:border-purple-500 hover:scale-105'}`}
            >
              <i className="ki-outline ki-users" />
            </button>
          )}
          {onAprobar && !isLocked && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAprobar(acta);
              }}
              title='Aprobar Asistencia'
              className="flex items-center justify-center flex-1 py-1.5 text-green-600 transition-all border border-transparent bg-green-50/50 dark:bg-green-500/10 rounded-lg hover:border-green-500 hover:scale-105"
            >
              <i className="ki-outline ki-check-circle" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActaCard;
