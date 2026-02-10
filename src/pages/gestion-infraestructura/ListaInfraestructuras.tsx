import { AuthContext } from '@/auth/providers/JWTProvider';
import { KeenIcon } from '@/components';
import axios from 'axios';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import InfraestructuraCard from './InfraestructuraCard';
import FormularioInfraestructura from './FormularioInfraestructura';
import ModalError from '../gestion-sedes-sena/ModalError';

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
  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleEdit = (infra: Infraestructura) => {
    setIdInfraestructura(String(infra.id));
    setIsModalOpen(true);
  };

  const [infraAEliminar, setInfraAEliminar] = useState<Infraestructura | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = (infra: Infraestructura) => {
    setInfraAEliminar(infra);
  };

  const eliminarInfraestructura = async () => {
    if (!infraAEliminar) return;

    try {
      setDeleting(true);

      await axios.delete(`infraestructuras/${infraAEliminar.id}`);

      setEvento((prev) => !prev);
      setInfraAEliminar(null);
    } catch (error: any) {
      setErrorMessage('No se pudo eliminar la infraestructura porque tiene registros asociados.');
      setIsErrorOpen(true);
    } finally {
      setDeleting(false);
    }
  };

  // Loading state mejorado con skeleton cards
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
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
          <div className="px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
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
      {infraAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-fade-in">
          <div className="bg-white dark:bg-coal-400 dark:border-coal-100 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="flex items-center gap-4 mb-4">
              {/* Icono */}
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <KeenIcon icon="information" className="text-2xl text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Eliminar ambiente</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              ¿Seguro que deseas eliminar
              <span className="font-bold"> {infraAEliminar.nombreInfraestructura}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setInfraAEliminar(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={eliminarInfraestructura}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ModalError
        isOpen={isErrorOpen}
        message={errorMessage}
        onClose={() => setIsErrorOpen(false)}
      />

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
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        ))}
      </div>
      <FormularioInfraestructura
        idInfraestructura={idInfraestructura}
        setIdInfraestructura={setIdInfraestructura}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        setEvento={setEvento}
        mode="edit"
      />
    </>
  );
};

export default ListaInfraestructuras;
