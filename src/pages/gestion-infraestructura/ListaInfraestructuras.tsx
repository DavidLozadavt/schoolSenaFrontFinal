import { AuthContext } from '@/auth/providers/JWTProvider';
import { KeenIcon } from '@/components';
import axios from 'axios';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import InfraestructuraCard from './InfraestructuraCard';

interface Props {
  searchTerm: string;
  evento: boolean;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
}

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

const ListaInfraestructuras: React.FC<Props> = ({ searchTerm, evento, setEvento }) => {
  const authContext = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [infraestructuras, setInfraestructuras] = useState<Infraestructura[]>([]);
  const [idInfraestructura, setIdInfraestructura] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axios.get(`regionalInfraestructuras/${authContext?.empresa?.id}`);
        setInfraestructuras(res.data.data);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [authContext?.empresa?.id, evento]);

  const filteredInfraestructuras = useMemo(() => {
    if (!searchTerm) return infraestructuras;
    const term = searchTerm.toLowerCase();
    return infraestructuras.filter(
      (r) =>
        r.nombreInfraestructura.toLowerCase().includes(term) ||
        r.sede.nombre.toLowerCase().includes(term) ||
        r.tipo_infraestructura.nombre.toLowerCase().includes(term)
    );
  }, [infraestructuras, searchTerm]);

  // Loading state mejorado con skeleton cards
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
  // Empty state mejorado
  if (!filteredInfraestructuras.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="relative mb-6">
          {/* Círculo decorativo de fondo */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-gray-100 rounded-full blur-2xl opacity-50 scale-150"></div>

          {/* Icono */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg">
            <KeenIcon
              icon={searchTerm ? 'magnifier' : 'information-5'}
              className="text-5xl text-gray-400"
            />
          </div>
        </div>

        <h4 className="text-2xl font-bold text-gray-800 mb-2">
          {searchTerm ? 'No se encontraron resultados' : 'No hay ambientes'}
        </h4>
        <p className="text-sm text-gray-500 mb-6 max-w-md text-center">
          {searchTerm
            ? `No encontramos ambientes que coincidan con "${searchTerm}". Intenta con otros términos.`
            : 'Aún no has creado ningun ambiente. Comienza agregando tu primer ambiente.'}
        </p>

        {searchTerm && (
          <button
            onClick={() => {
              /* clear search from parent */
            }}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            Limpiar búsqueda
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Contador de resultados */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
            <span className="text-sm font-medium text-gray-600">
              {filteredInfraestructuras.length}{' '}
              {filteredInfraestructuras.length === 1 ? 'ambiente' : 'ambientes'}
            </span>
          </div>

          {searchTerm && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-200">
              <i className="ki-outline ki-magnifier text-sm text-blue-600"></i>
              <span className="text-sm font-medium text-blue-700">
                Filtrando por: <span className="font-bold">"{searchTerm}"</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Grid de cards con animación escalonada */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredInfraestructuras.map((infra, index) => (
          <div
            key={infra.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <InfraestructuraCard
              infraestructura={infra}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default ListaInfraestructuras;
