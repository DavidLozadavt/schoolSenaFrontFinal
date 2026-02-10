import React from 'react';
import { KeenIcon } from '@/components';

interface Infraestructura {
  id: number;
  nombreInfraestructura: string;
  capacidad: number;
  sede: {
    id: number;
    nombre: string;
  };
  tipo_infraestructura: {
    id: number;
    nombre: string;
  };
}

interface Props {
  infraestructura: Infraestructura;
  onEdit?: (infraestructura: Infraestructura) => void;
  onInfo?: (infraestructura: Infraestructura) => void;
  onDelete?: (infraestructura: Infraestructura) => void;
}

const InfraestructuraCard: React.FC<Props> = ({ infraestructura, onEdit, onInfo, onDelete }) => {
  return (
    <div
      className="
        group relative w-full overflow-hidden rounded-2xl
        border border-gray-200 
        shadow-sm hover:shadow-xl hover:shadow-blue-500/10
        transition-all duration-300 ease-out
        hover:-translate-y-1
      "
    >
      {/* HEADER */}
      <div className="relative h-32  flex items-center justify-center">
        <KeenIcon icon="office-bag" className="text-5xl text-blue-500" />

        {/* Tipo */}
        <span className="absolute top-3 right-3 rounded-full  px-3 py-1 text-[10px] font-bold uppercase text-gray-700 shadow">
          {infraestructura.tipo_infraestructura.nombre}
        </span>
      </div>

      {/* BODY */}
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-extrabold uppercase text-gray-800 line-clamp-2">
          {infraestructura.nombreInfraestructura}
        </h3>

        <div className="space-y-2 text-xs">
          <InfoRow
            icon="geolocation"
            label="Sede"
            value={infraestructura.sede.nombre}
            color="blue"
          />
          <InfoRow
            icon="users"
            label="Capacidad"
            value={`${infraestructura.capacidad} personas`}
            color="green"
          />
        </div>

        {(onEdit || onInfo || onDelete) && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {onInfo && (
              <button
                onClick={() => onInfo(infraestructura)}
                className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
              >
                Ver
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(infraestructura)}
                title="Editar"
                className="flex items-center justify-center w-full h-8 text-blue-600 border border-transparent rounded-lg dark:text-blue-300 bg-blue-100/30 dark:bg-blue-500/10 hover:border-blue-500 hover:scale-105 active:scale-95 transition-all"
              >
                <i className="text-sm ki-outline ki-arrows-loop"></i>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(infraestructura)}
                title="Eliminar"
                className="flex items-center justify-center w-full h-8 text-red-600 border border-transparent rounded-lg dark:text-red-300 bg-red-100/30 dark:bg-red-500/10 hover:border-red-500 hover:scale-105 active:scale-95 transition-all"
              >
                <i className="text-sm ki-outline ki-trash"></i>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* Subcomponente reutilizable */
const InfoRow = ({
  icon,
  label,
  value,
  color
}: {
  icon: string;
  label: string;
  value: string;
  color: 'blue' | 'green';
}) => {
  const colors = {
    blue: 'text-blue-600',
    green: 'text-green-600'
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <i className={`ki-outline ki-${icon} text-sm`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase text-gray-400">{label}</p>
        <p className="font-bold text-gray-700 truncate">{value}</p>
      </div>
    </div>
  );
};

export default InfraestructuraCard;
