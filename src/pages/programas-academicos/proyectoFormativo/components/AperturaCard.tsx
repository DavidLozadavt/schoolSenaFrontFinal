import React from 'react';
import { useNavigate } from 'react-router';

interface AperturaCardProps {
  apertura: any;
  onClick?: (apertura: any) => void;
  onEdit?: (apertura: any) => void;
}

const AperturaCard: React.FC<AperturaCardProps> = ({ apertura, onClick, onEdit }) => {
  const navigate = useNavigate();
  return (
    <div
      className={`bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full`}
      onClick={() => onClick && onClick(apertura)}
    >
      <div className="px-5 py-3 border-b border-gray-100 dark:border-coal-300 flex justify-between items-center bg-gray-50 dark:bg-coal-400/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            {apertura.periodo?.nombrePeriodo || `ID ${apertura.id}`}
          </span>
          {apertura.estado === 'CERRADO' && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-[9px] font-bold text-red-600 dark:text-red-400 rounded-full border border-red-200 dark:border-red-500/30 uppercase tracking-tight">
              <i className="ki-outline ki-lock text-[10px]" />
              Cerrado
            </span>
          )}
          {apertura.estado === 'ABIERTO' && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-[9px] font-bold text-green-600 dark:text-green-400 rounded-full border border-green-200 dark:border-green-500/30 uppercase tracking-tight">
              <i className="ki-outline ki-check-circle text-[10px]" />
              Abierto
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
          ID #{apertura.id}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col space-y-3">
        <div className="flex items-center gap-2">
          <i className="ki-outline ki-information text-gray-400 text-sm" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {apertura.tipoCalificacion}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <i className="ki-outline ki-calendar text-gray-400 text-sm" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Clases: {apertura.fechaInicialClases?.split('T')[0] || 'N/A'} al{' '}
            {apertura.fechaFinalClases?.split('T')[0] || 'N/A'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <i className="ki-outline ki-geolocation text-gray-400 text-sm mt-0.5" />
          <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
            Sede: {apertura.sede?.nombre || 'No especificada'}
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 pt-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(apertura);
              }}
              title="Editar Apertura"
              className="flex items-center justify-center flex-1 py-1.5 transition-all border border-transparent rounded-lg text-blue-600 bg-blue-50/50 dark:bg-blue-500/10 hover:border-blue-500 hover:scale-105"
            >
              <i className="ki-outline ki-notepad-edit" />
            </button>
          )}
          <button
            onClick={() => {
              navigate(`/gestion-academica/configuracion/programas/${apertura.id}/fichas`);
            }}
            title="Ir a grupos"
            className="flex items-center justify-center flex-1 py-1.5 transition-all border border-transparent rounded-lg text-white bg-blue-600 dark:bg-blue-500 hover:border-blue-500 hover:scale-105"
          >
            <i className="ki-outline ki-flag" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AperturaCard;
