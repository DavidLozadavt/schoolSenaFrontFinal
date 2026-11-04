import React, { useState } from 'react';
import FormularioSedesSena from './FormularioSedesSena';
import ListaSedesSena from './ListaSedesSena';
import Toast from '../programas-academicos/components/Toast';

const SedesSena: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  //Para actualizar la Data una vez ocurra un vambio:
  const [evento, setEvento] = useState<boolean>(true);

  const [idSede, setIdSede] = useState<string>('');
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
      <div className="w-full max-w-6xl mx-auto mb-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-800 uppercase dark:text-white">
          Gestión de Sedes
        </h1>
        <p className="mt-1 text-xs font-medium tracking-widest text-gray-500 uppercase">
          Configuración Sena
        </p>
      </div>
      <div className="flex items-center justify-between w-full max-w-5xl gap-4 px-2 mx-auto mb-8">
        <div className="group flex items-center bg-white/80 backdrop-blur-md dark:bg-coal-300/80 border border-gray-400 dark:border-gray-800 rounded-full p-1.5 transition-all duration-500 ease-in-out w-[46px] hover:w-[280px] md:hover:w-[350px] focus-within:w-[280px] md:focus-within:w-[350px] shadow-sm overflow-hidden">
          <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-gray-500 transition-colors group-hover:text-blue-600">
            <i className="text-xl ki-outline ki-magnifier"></i>
          </div>
          <input
            type="text"
            placeholder="Buscar Sede..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 text-sm font-medium transition-opacity bg-transparent border-none outline-none opacity-0 group-hover:opacity-100 focus:opacity-100 dark:text-white"
          />
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
          }}
          className="group relative flex items-center justify-start h-[46px] w-[46px] hover:w-[180px] bg-blue-600 text-white rounded-full transition-all duration-500 shadow-lg active:scale-95"
        >
          <div className="flex items-center justify-center flex-shrink-0 w-[46px] h-[46px]">
            <i className="text-lg ki-filled ki-plus"></i>
          </div>
          <span className="absolute left-[46px] text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pr-6">
            Añadir Sede
          </span>
        </button>
      </div>
      {isModalOpen && (
        <FormularioSedesSena
          idSede={idSede}
          setIdSede={setIdSede}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          setEvento={setEvento}
          showToast={showToast}
        />
      )}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ListaSedesSena searchTerm={searchTerm} evento={evento} setEvento={setEvento} />
      </div>
      <Toast isOpen={toastOpen} message={toastMessage} onClose={() => setToastOpen(false)} />
    </div>
  );
};

export default SedesSena;
