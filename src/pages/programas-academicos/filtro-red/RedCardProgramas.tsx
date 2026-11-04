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

        
      </div>
    </div>
  );
};

export default RedCardProgramas;
