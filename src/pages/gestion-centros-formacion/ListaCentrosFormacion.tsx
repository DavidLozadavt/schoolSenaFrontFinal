import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import FormularioUpCentrosFormacion from './FormularioUpCentrosFormacion';
import { ColumnDef } from '@tanstack/react-table';
import { DataGrid, KeenIcon } from '@/components';

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

  const columns = useMemo<ColumnDef<CentrosFormacion>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: () => 'Nombre',
        cell: (info) => (
          <span className="font-medium text-gray-800">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[220px]' }
      },
      {
        accessorKey: 'direccion',
        header: () => 'Dirección',
        meta: { className: 'min-w-[140px]' }
      },
      {
        accessorKey: 'telefono',
        header: () => 'telefono',
        meta: { className: 'min-w-[200px]' }
      },
      {
        accessorKey: 'correo',
        header: () => 'Correo',
        meta: { className: 'min-w-[200px]' }
      },
      {
        accessorKey: 'subdirector',
        header: () => 'Email',
        meta: { className: 'min-w-[220px]' }
      },
      {
        accessorKey: 'ciudad.descripcion',
        header: () => 'Ciudad',
        cell: ({ row }) => (
          <span className="text-gray-700">{row.original.ciudad?.descripcion ?? '—'}</span>
        ),
        meta: { className: 'min-w-[150px]' }
      },
      {
        accessorKey: 'empresa.razonSocial',
        header: () => 'Regional',
        cell: ({ row }) => (
          <span className="text-gray-700">{row.original.empresa?.razonSocial ?? '—'}</span>
        ),
        meta: { className: 'min-w-[150px]' }
      },

      {
        id: 'edit',
        header: () => 'Editar',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            title="Editar regional"
            className="btn btn-sm btn-icon btn-clear text-blue-600 hover:text-blue-500"
            onClick={() => {
              setIdCentroFormacion(String(row.original.id));
              setIsModalOpen(true);
            }}
          >
            <KeenIcon icon="notepad-edit" />
          </button>
        ),
        meta: { className: 'w-[80px]' }
      }
    ],
    []
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-3 justify-center items-center animate-pulse">
        <img src="https://admin.virtualt.org/default/logoweb.png" alt="Logo" className="h-14" />
        <div className="text-gray-500 font-medium text-sm">Cargando Centros de Formación...</div>
      </div>
    );
  }
  return (
    <div className="card card-grid min-w-full">
      <div className="card-header py-5">
        <h3 className="card-title">Centros de Formación</h3>
      </div>

      <div className="card-body m-5">
        <DataGrid
          key={JSON.stringify(filteredCentrosFormacion)}
          columns={columns}
          data={filteredCentrosFormacion}
          pagination={{ size: 10 }}
        />
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
