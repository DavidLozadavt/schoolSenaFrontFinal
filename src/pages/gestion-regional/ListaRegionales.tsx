import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { KeenIcon } from '@/components';
import FormularioUpRegional from './FormularioUpRegional';
import RegionalCard from './RegionalCard';
import Toast from '../programas-academicos/components/Toast';

interface Props {
  searchTerm: string;
  evento: boolean;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Ciudad {
  id: number;
  codigo: string;
  descripcion: string;
}

interface Regional {
  id: number;
  razonSocial: string;
  nit: string;
  rutaLogo?: string;
  rutaLogoUrl?: string;
  representanteLegal: string;
  direccion: string;
  email: string;
  digitoVerificacion: number;
  idCiudad: number | null;
  ciudad?: Ciudad | null;
}

const ListaRegionales: React.FC<Props> = ({ searchTerm, evento, setEvento }) => {
  const [loading, setLoading] = useState(true);
  const [regionales, setRegionales] = useState<Regional[]>([]);
  const [idRegional, setIdRegional] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  //Eliminar la regional
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const showToast = (message: string) => {
    setToastMessage(message);
    setToastOpen(true);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axios.get<Regional[]>('regional');
        setRegionales(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [evento]);

  const filteredRegionales = useMemo(() => {
    if (!searchTerm) return regionales;
    const term = searchTerm.toLowerCase();
    return regionales.filter(
      (r) =>
        r.razonSocial.toLowerCase().includes(term) ||
        r.nit.toLowerCase().includes(term) ||
        r.representanteLegal.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.ciudad?.descripcion.toLowerCase().includes(term)
    );
  }, [regionales, searchTerm]);

  const handleDelete = async (id: number) => {
    try {
      const response = await axios.delete(`regional/${id}`);

      if (response.data.status === 'success') {
        const nombre = regionales.find((r) => r.id === id)?.razonSocial || '';

        showToast(`La regional "${nombre}" fue eliminada correctamente`);
        setEvento((prev) => !prev);
      }
    } catch (error: any) {
      const mensaje = error.response?.data?.message || 'Error al eliminar la regional';

      showToast(mensaje);
    } finally {
      setDeleteConfirm(null);
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
  if (!filteredRegionales.length) {
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
          {searchTerm ? 'No se encontraron resultados' : 'No hay regionales'}
        </h4>
        <p className="text-sm text-gray-500 mb-6 max-w-md text-center">
          {searchTerm
            ? `No encontramos regionales que coincidan con "${searchTerm}". Intenta con otros términos.`
            : 'Aún no has creado ninguna regional. Comienza agregando tu primera regional.'}
        </p>
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
              {filteredRegionales.length}{' '}
              {filteredRegionales.length === 1 ? 'regional' : 'regionales'}
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
        {filteredRegionales.map((regional, index) => (
          <div
            key={regional.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <RegionalCard
              regional={regional}
              onEdit={() => {
                setIdRegional(String(regional.id));
                setIsModalOpen(true);
              }}
              onInfo={() => {
                console.log('Info regional', regional);
              }}
              onDelete={() => setDeleteConfirm(regional.id)}
            />
          </div>
        ))}
      </div>

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <KeenIcon icon="information" className="text-2xl text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">¿Eliminar regional?</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar la regional{' '}
              <span className="font-bold">
                {regionales.find((r) => r.id === deleteConfirm)?.razonSocial}
              </span>
              ?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición con animación */}
      {isModalOpen && (
        <div className="animate-fade-in">
          <FormularioUpRegional
            idRegional={idRegional}
            setIdRegional={setIdRegional}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            setEvento={setEvento}
            mode="edit"
          />
        </div>
      )}
      <Toast isOpen={toastOpen} message={toastMessage} onClose={() => setToastOpen(false)} />
    </>
  );
};

export default ListaRegionales;
