import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import FormularioUpCentrosFormacion from './FormularioUpCentrosFormacion';
import { ColumnDef } from '@tanstack/react-table';
import { KeenIcon } from '@/components';
import CentroFormacionCard from './CentroFormacionCard';

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
}

const ListaCentrosFormacion: React.FC<Props> = ({ searchTerm, evento, setEvento }) => {
  const [loading, setLoading] = useState(true);
  const [centrosFormacion, setCentroFormacion] = useState<CentrosFormacion[]>([]);

  //Actualización centro de Formación:
  const [idCentroFormacion, setIdCentroFormacion] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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
          <div className="px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
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
              onInfo={() => {
                
              }}
            />
          </div>
        ))}
      </div>

      {isModalOpen && (
        <FormularioUpCentrosFormacion
          idCentroFormacion={idCentroFormacion}
          setIdCentroFormacion={setIdCentroFormacion}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          setEvento={setEvento}
        />
      )}
    </div>
  );
};

export default ListaCentrosFormacion;
