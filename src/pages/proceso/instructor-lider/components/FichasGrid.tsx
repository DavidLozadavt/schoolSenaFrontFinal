import React from 'react';
import { Ficha } from '../types';
import FichaCard from './FichaCard';

type Props = {
  fichas: Ficha[];
  onSelect: (f: Ficha) => void;
};

const FichasGrid: React.FC<Props> = ({ fichas, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {fichas.map((ficha) => (
        <FichaCard key={ficha.id} ficha={ficha} onClick={onSelect} />
      ))}

      {fichas.length === 0 && (
        <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-coal-500/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-coal-300">
          <div className="bg-white dark:bg-coal-500 w-16 h-16 rounded-full flex items-center justify-center shadow-sm mx-auto mb-4">
            <i className="ki-outline ki-people text-3xl text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">No tienes fichas asignadas</h3>
          <p className="text-sm text-gray-500 mt-1">Contacta con el administrador si crees que esto es un error.</p>
        </div>
      )}
    </div>
  );
};

export default FichasGrid;
