import { KeenIcon } from '@/components';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import SedeCard from './SedeCard';
import ModalEliminar from './ModalEliminar';
import Toast from '../programas-academicos/components/Toast';
import FormularioSedesSena from './FormularioSedesSena';

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
  urlImagen: string;
  rutaFotoUrl: string;
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

  // Informaciòn adicional de la sede
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [sedeInfo, setSedeInfo] = useState<Sede | null>(null);

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

  const eliminarSede = async () => {
    if (!sedeAEliminar) return;

    try {
      setDeleting(true);
      await axios.delete(`sedesSena/${sedeAEliminar.id}`);
      setToastMessage(`La sede "${sedeAEliminar.nombre}" fue eliminada correctamente`);
      setToastOpen(true);
      setEvento((prev) => !prev);
    } catch (error: any) {
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
          <div className="px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
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
              onInfo={() => {
                setSedeInfo(sede);
                setIsInfoOpen(true);
              }}
            />
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="animate-fade-in">
          <FormularioSedesSena
            idSede={idSede}
            setIdSede={setIdSede}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            setEvento={setEvento}
            showToast={showToast}
            mode="edit"
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

      {isInfoOpen && sedeInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => {
            setIsInfoOpen(false);
            setSedeInfo(null);
          }}
        >
          <div
            className="bg-white dark:bg-coal-400 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER con imagen */}
            <div className="relative h-36">
              <img
                src={sedeInfo.rutaFotoUrl}
                alt={sedeInfo.nombre}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              <button
                onClick={() => {
                  setIsInfoOpen(false);
                  setSedeInfo(null);
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-red-500 text-white flex items-center justify-center transition-all"
              >
                <i className="ki-outline ki-cross text-xs"></i>
              </button>

              <div className="absolute bottom-3 left-4 right-12">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-white/80 mb-1">
                  <i className="ki-outline ki-geolocation text-xs" />
                  {sedeInfo.ciudad?.descripcion || 'Sin ciudad'}
                </span>
                <h3 className="text-lg font-extrabold uppercase text-white leading-snug line-clamp-1">
                  {sedeInfo.nombre}
                </h3>
                <p className="text-xs text-white/80">
                  {sedeInfo.empresa?.razonSocial || 'Sin empresa'}
                </p>
              </div>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-3">
              <ModalInfoRow
                icon="user-square"
                color="blue"
                label="Jefe inmediato"
                value={sedeInfo.jefeInmediato}
              />
              <ModalInfoRow
                icon="phone"
                color="purple"
                label="Teléfono"
                value={sedeInfo.telefono}
              />
              <ModalInfoRow icon="phone" color="purple" label="Celular" value={sedeInfo.celular} />
              <ModalInfoRow icon="sms" color="green" label="Email" value={sedeInfo.email} />
              <ModalInfoRow
                icon="map"
                color="orange"
                label="Dirección"
                value={sedeInfo.direccion}
              />
            </div>

            {/* FOOTER */}
            <div className="px-6 pb-6">
              <button
                onClick={() => {
                  setIsInfoOpen(false);
                  setSedeInfo(null);
                }}
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast isOpen={toastOpen} message={toastMessage} onClose={() => setToastOpen(false)} />
    </div>
  );
};

const ModalInfoRow = ({
  icon, label, value, color
}: {
  icon: string;
  label: string;
  value?: string | null;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red';
}) => {
  const colors = {
    blue:   'bg-blue-50 text-blue-600 dark:bg-blue-500/10',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10',
    green:  'bg-green-50 text-green-600 dark:bg-green-500/10',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10',
    red:    'bg-red-50 text-red-600 dark:bg-red-500/10',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-coal-300 hover:bg-gray-100 transition-colors">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <i className={`ki-outline ki-${icon} text-sm`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p className={`text-sm font-semibold truncate ${!value ? 'text-gray-400 italic' : 'text-gray-700 dark:text-gray-200'}`}>
          {value || 'No asignado'}
        </p>
      </div>
      {/* Chip si tiene valor */}
      {value && (
        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-400" />
      )}
    </div>
  );
};

export default ListaSedesSena;
