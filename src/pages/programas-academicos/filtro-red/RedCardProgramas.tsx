import { KeenIcon } from '@/components';
import React from 'react';
import { useNavigate } from 'react-router';

interface Red {
  id: number;
  nombre: string;
  descripcion: string | null;
  foto: string;
  fotoUrl: string | null;
}
interface Props {
  red: Red;
  onEdit?: () => void;
  onDelete: () => void;
}

const RedCardProgramas: React.FC<Props> = ({ red, onEdit, onDelete }) => {
  const navigate = useNavigate();
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
      {/* HEADER CON IMAGEN */}
      <div className="relative h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
        {red.fotoUrl ? (
          <img src={red.fotoUrl} alt={red.nombre} className="h-full w-full object-cover" />
        ) : (
          <KeenIcon icon="office-bag" className="text-5xl text-blue-500" />
        )}
      </div>

      {/* BODY */}
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-extrabold uppercase text-gray-800 line-clamp-2">
          {red.nombre}
        </h3>

        {/* Botón principal */}
        <button
          onClick={() => navigate(`/gestion-academica/configuracion/redes/programas/${red.id}`)}
          className="w-full py-2 px-4 text-xs font-bold uppercase bg-primary text-white rounded-lg hover:bg-primary-active transition-colors mb-3"
        >
          Ver programas de la red →
        </button>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {onEdit && (
            <button
              onClick={onEdit}
              title="Editar"
              className="flex items-center justify-center w-full h-8 text-blue-600 border border-transparent rounded-lg bg-blue-100/30 hover:border-blue-500 hover:scale-105 active:scale-95 transition-all"
            >
              <i className="text-sm ki-outline ki-arrows-loop"></i>
            </button>
          )}

          {onDelete && (
            <button
              onClick={onDelete}
              title="Eliminar"
              className="flex items-center justify-center w-full h-8 text-red-600 border border-transparent rounded-lg bg-red-100/30 hover:border-red-500 hover:scale-105 active:scale-95 transition-all"
            >
              <i className="text-sm ki-outline ki-trash"></i>
            </button>
          )}
        </div>
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

export default RedCardProgramas;
