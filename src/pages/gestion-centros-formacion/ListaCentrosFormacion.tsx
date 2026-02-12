import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import { KeenIcon } from '@/components';
import CentroFormacionCard from './CentroFormacionCard';
import FormularioCentrosFormacion from './FormularioCentrosFormacion';
import Toast from '../programas-academicos/components/Toast';

interface Props {
  searchTerm: string;
  evento: boolean;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
  showToast: (message: string) => void;
}

interface Ciudad {
  id: number;
  codigo: string;
  descripcion: string;
}

interface Empresa {
  id: number;
  razonSocial: string;
  rutaLogoUrl?: string;
}

interface CentrosFormacion {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  correo: string;
  subdirector: string;
  correosubdirector: string;
  idCiudad: number | null;
  ciudad?: Ciudad | null;
  idEmpresa: number | null;
  empresa?: Empresa | null;
  foto: string;
  rutaFotoUrl:string;
}

const ListaCentrosFormacion: React.FC<Props> = ({ searchTerm, evento, setEvento, showToast }) => {
  const [loading, setLoading] = useState(true);
  const [centrosFormacion, setCentroFormacion] = useState<CentrosFormacion[]>([]);

  //Actualización centro de Formación:
  const [idCentroFormacion, setIdCentroFormacion] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  //Eliminacion:
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToastLocal = (message: string) => {
    setToastMessage(message);
    setToastOpen(true);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axios.get<CentrosFormacion[]>('centrosFormacion');
        setCentroFormacion(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [evento]);

  const filteredCentrosFormacion = useMemo(() => {
    if (!searchTerm) return centrosFormacion;

    const term = searchTerm.toLowerCase();

    return centrosFormacion.filter(
      (centrosFormacion) =>
        centrosFormacion.nombre.toLowerCase().includes(term) ||
        centrosFormacion.direccion.toLowerCase().includes(term) ||
        centrosFormacion.telefono.toLowerCase().includes(term) ||
        centrosFormacion.correo.toLowerCase().includes(term) ||
        centrosFormacion.subdirector.toLowerCase().includes(term) ||
        centrosFormacion.ciudad?.descripcion.toLowerCase().includes(term) ||
        centrosFormacion.empresa?.razonSocial.toLowerCase().includes(term)
    );
  }, [centrosFormacion, searchTerm]);

  const eliminarCentro = async (id: number) => {
    try {
      await axios.delete(`centrosFormacion/${id}`);
      const nombre = centrosFormacion.find((c) => c.id === id)?.nombre || '';
      showToastLocal(`El centro de formación "${nombre}" fue eliminado correctamente`);
      setEvento((prev) => !prev);
    } catch (error: any) {
      const mensaje =
        error?.response?.data?.message ?? 'No se pudo eliminar el centro de formación';
      showToastLocal(mensaje);
    } finally {
      setDeleteConfirm(null);
    }
  };

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

  if (!filteredCentrosFormacion.length) {
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
          {searchTerm ? 'No se encontraron sedes' : 'No hay sedes registradas'}
        </h4>

        <p className="text-sm text-gray-500 mb-6 max-w-md text-center">
          {searchTerm
            ? `No encontramos sedes que coincidan con "${searchTerm}".`
            : 'Aún no has creado ninguna sede. Comienza agregando la primera.'}
        </p>
      </div>
    );
  }
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
            <span className="text-sm font-medium text-gray-600">
              {filteredCentrosFormacion.length}{' '}
              {filteredCentrosFormacion.length === 1
                ? 'Centro de formación'
                : 'Centros de Formación'}
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
        {filteredCentrosFormacion.map((centro, index) => (
          <div
            key={centro.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CentroFormacionCard
              key={centro.id}
              centro={centro}
              onEdit={() => {
                setIdCentroFormacion(String(centro.id));
                setIsModalOpen(true);
              }}
              onInfo={() => {}}
              onDelete={() => setDeleteConfirm(centro.id)}
            />
          </div>
        ))}
      </div>
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-fade-in">
          <div className="bg-white dark:bg-coal-400 dark:border-coal-100 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <KeenIcon icon="information" className="text-2xl text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  ¿Eliminar centro de formación?
                </h3>
                <p className="text-sm text-gray-500">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar el centro{' '}
              <span className="font-bold">
                {centrosFormacion.find((c) => c.id === deleteConfirm)?.nombre}
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
                onClick={() => eliminarCentro(deleteConfirm!)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <FormularioCentrosFormacion
          idCentroFormacion={idCentroFormacion}
          setIdCentroFormacion={setIdCentroFormacion}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          setEvento={setEvento}
          showToast={showToast}
          mode="edit"
        />
      )}
      <Toast isOpen={toastOpen} message={toastMessage} onClose={() => setToastOpen(false)} />
    </div>
  );
};

export default ListaCentrosFormacion;
