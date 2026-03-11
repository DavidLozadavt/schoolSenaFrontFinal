import React from 'react';
import { KeenIcon } from '@/components';

const ListaActividadesAprendiz: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <KeenIcon icon="check-squared" className="text-5xl text-gray-300 dark:text-gray-600 mb-4" />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Actividades</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">No hay actividades asignadas</p>
    </div>
  );
};

export default ListaActividadesAprendiz;
