import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import FormularioUpSedesSena from './FormularioUpSedesSena';
import SedeCard from './SedeCard';
import ModalEliminar from './ModalEliminar';
import Toast from '../programas-academicos/components/Toast';

interface Props {
  searchTerm: string;
  evento: boolean;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
}
interface Persona {
  nombre1: string;
  apellido1: string;
  identificacion: string;
}

interface Responsable {
  id: number;
  persona: Persona;
}

interface Ciudades {
  id: number;
  descripcion: string;
}

interface Empresa {
  id: number;
  razonSocial: string;
}
interface Sede {
  id: number;
  nombre: string;
  jefeInmediato: string;
  descripcion: string;
  direccion: string;
  email: string;
  telefono: string;
  celular: string;
  ciudad: Ciudades;
  empresa: Empresa;
}

const ListaSedesSena: React.FC<Props> = ({ searchTerm, evento, setEvento }) => {
  const [loading, setLoading] = useState(true);
  const [sedes, setSedes] = useState<Sede[]>([]);

  //Actualización de la sede:
  const [idSede, setIdSede] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  //Eliminar la sede:
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [sedeAEliminar, setSedeAEliminar] = useState<Sede | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Succes sedes eliminar
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axios.get<Sede[]>('sedesSena');
        setSedes(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [evento]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastOpen(true);
  };

  const filteredSedes = useMemo(() => {
    if (!searchTerm) return sedes;

    const term = searchTerm.toLowerCase();

    return sedes.filter(
      (sede) =>
        sede.nombre.toLowerCase().includes(term) ||
        sede.jefeInmediato.toLowerCase().includes(term) ||
        sede.descripcion.toLowerCase().includes(term) ||
        sede.direccion.toLowerCase().includes(term) ||
        sede.email.toLowerCase().includes(term) ||
        sede.ciudad?.descripcion.toLowerCase().includes(term) ||
        sede.empresa?.razonSocial.toLowerCase().includes(term)
    );
  }, [sedes, searchTerm]);

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

  const eliminarSede = async () => {
    if (!sedeAEliminar) return;

    try {
      setDeleting(true);
      await axios.delete(`sedesSena/${sedeAEliminar.id}`);
      setToastMessage(`La sede "${sedeAEliminar.nombre}" fue eliminada correctamente`);
      setToastOpen(true);
      setEvento((prev) => !prev); // refresca la lista
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
      setSedeAEliminar(null);
    }
  };

  if (!filteredSedes.length) {
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
          <div className="px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
            <span className="text-sm font-medium text-gray-600">
              {filteredSedes.length} {filteredSedes.length === 1 ? 'sede' : 'sedes'}
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
        {filteredSedes.map((sede, index) => (
          <div
            key={sede.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <SedeCard
              sede={sede}
              onEdit={() => {
                setIdSede(String(sede.id));
                setIsModalOpen(true);
              }}
              onDelete={() => {
                setSedeAEliminar(sede); // guardas la sede
                setIsDeleteOpen(true); // abres modal
              }}
            />
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="animate-fade-in">
          <FormularioUpSedesSena
            idSede={idSede}
            setIdSede={setIdSede}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            setEvento={setEvento}
            showToast={showToast}
          />
        </div>
      )}

      <ModalEliminar
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSedeAEliminar(null);
        }}
        onConfirm={eliminarSede}
        entidad="la sede"
        nombre={sedeAEliminar?.nombre}
        loading={deleting}
      />
      <Toast isOpen={toastOpen} message={toastMessage} onClose={() => setToastOpen(false)} />
    </div>
  );
};

export default ListaSedesSena;
