import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import FormularioRedes from '@/pages/gestion-red/FormularioRedes';
import ListaRedesProgramas from './ListaRedesProgramas';

const RedesProgramas: React.FC = () => {
  const location = useLocation();
  const esProgramas = location.pathname.includes('/programas');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  //Para actualizar la Data una vez ocurra un vambio:
  const [evento, setEvento] = useState<boolean>(true);

  //Toast para el success
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastOpen(true);
  };
  return (
    <div className="relative min-h-screen">
      {/** titulo */}
      <div className="flex items-center justify-between w-full max-w-5xl gap-4 px-2 mx-auto mb-8">
        <div className="group flex items-center bg-white/80 backdrop-blur-md dark:bg-coal-300/80 border border-gray-400 dark:border-gray-800 rounded-full p-1.5 transition-all duration-500 ease-in-out w-[46px] hover:w-[280px] md:hover:w-[350px] focus-within:w-[280px] md:focus-within:w-[350px] shadow-sm overflow-hidden">
          <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-gray-500 transition-colors group-hover:text-blue-600">
            <i className="text-xl ki-outline ki-magnifier"></i>
          </div>
          <input
            type="text"
            placeholder="Buscar Redes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 text-sm font-medium transition-opacity bg-transparent border-none outline-none opacity-0 group-hover:opacity-100 focus:opacity-100 dark:text-white"
          />
        </div>
      </div>
      <FormularioRedes
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        setEvento={setEvento}
      />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ListaRedesProgramas searchTerm={searchTerm} evento={evento} setEvento={setEvento} />
      </div>
    </div>
  );
};

export default RedesProgramas;
