import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import FormularioUpFichaSena from './FormularioUpFichaSena';
import FichaCard from './FichaCard';

interface Props {
  searchTerm: string;
  evento: boolean;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Jornada {
  id: number;
  nombreJornada: string;
}

interface Sede {
  id: number;
  nombre: string;
}

interface Regional {
  id: number;
  razonSocial: string;
}

interface Programa {
  id: number;
  nombrePrograma: string;
}

interface Asignacion {
  id: number;
  estado: string;
  programa: Programa;
}

interface Fichas {
  id: number;
  idJornada: number;
  idAsignacion: number;
  codigo: string;
  idInstructorLider: number | null;
  documento: string | null;
  idAprendizVocero: number | null;
  idAprendizSuplente: number | null;
  idInfraestructura: number | null;
  idSede: number;
  idRegional: number;
  porcentajeEjecucion: number;
  jornada: Jornada;
  asignacion: Asignacion | null;
  infraestructura: null;
  sede: Sede;
  regional: Regional;
}

const ListaFichas: React.FC<Props> = ({ searchTerm, evento, setEvento }) => {
  const [loading, setLoading] = useState(true);
  const [fichas, setFichas] = useState<Fichas[]>([]);

  // Estados para el modal de edición
  const [idFicha, setIdFicha] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Estados para el toast/notificación
  const [showToast, setShowToast] = useState<boolean>(false);
  const [messageToast, setMessageToast] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axios.get<any[]>('fichas');
        setFichas(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [evento]);

  const filteredFichas = useMemo(() => {
    if (!searchTerm) return fichas;

    const term = searchTerm.toLowerCase();

    return fichas.filter(
      (ficha) =>
        ficha.codigo.toLowerCase().includes(term) ||
        ficha.sede.nombre.toLowerCase().includes(term) ||
        ficha.regional.razonSocial.toLowerCase().includes(term) ||
        ficha.asignacion?.programa?.nombrePrograma.toLowerCase().includes(term)
    );
  }, [fichas, searchTerm]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm"
          >
            {/* Skeleton image */}
            <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300"></div>

            {/* Skeleton content */}
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="h-8 bg-gray-200 rounded-lg"></div>
                <div className="h-8 bg-gray-200 rounded-lg"></div>
                <div className="h-8 bg-gray-200 rounded-lg"></div>
              </div>

              <div className="h-10 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!filteredFichas.length) {
      return (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-gray-100 rounded-full blur-2xl opacity-50 scale-150"></div>
  
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg">
              <KeenIcon
                icon={searchTerm ? 'magnifier' : 'information-5'}
                className="text-5xl text-gray-400"
              />
            </div>
          </div>
  
          <h4 className="text-2xl font-bold text-gray-800 mb-2">
            {searchTerm ? 'No se encontraron fichas' : 'No hay fichas registradas'}
          </h4>
  
          <p className="text-sm text-gray-500 mb-6 max-w-md text-center">
            {searchTerm
              ? `No encontramos fichas que coincidan con "${searchTerm}".`
              : 'Aún no has creado ninguna ficha. Comienza agregando la primera.'}
          </p>
        </div>
      );
    }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <span className="text-sm font-medium text-gray-600">
                    {filteredFichas.length} {filteredFichas.length === 1 ? 'ficha' : 'fichas'}
                  </span>
                </div>
      
                {searchTerm && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-200">
                    <KeenIcon icon="magnifier" className="text-sm text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      Filtrando por: <span className="font-bold">"{searchTerm}"</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredFichas.map((ficha, index) => (
          <div
            key={ficha.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <FichaCard
              ficha={ficha}
              onEdit={() => {
                setIdFicha(ficha.id);
                setIsModalOpen(true);
              }}
            />
          </div>
        ))}
      </div>

      {/* Modal de edición */}
      <FormularioUpFichaSena
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        setEvento={setEvento}
        setShowToast={setShowToast}
        setMessageToast={setMessageToast}
        fichaId={idFicha}
      />

      {/* Toast de notificación (opcional, si no tienes un componente global) */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <KeenIcon icon="check-circle" className="text-xl" />
            <span>{messageToast}</span>
            <button onClick={() => setShowToast(false)} className="ml-2 hover:text-gray-200">
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ListaFichas;
