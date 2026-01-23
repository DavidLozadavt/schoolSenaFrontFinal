import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import FormularioUpSedesSena from './FormularioUpSedesSena';

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

    const columns = useMemo<ColumnDef<Sede>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: () => 'Sede',
        cell: (info) => (
          <span className="font-medium text-gray-800">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[220px]' }
      },
      {
        accessorKey: 'jefeInmediato',
        header: () => 'Jefe',
        meta: { className: 'min-w-[140px]' }
      },
      {
        accessorKey: 'descripcion',
        header: () => 'Descripcion',
        meta: { className: 'min-w-[200px]' }
      },
      {
        accessorKey: 'direccion',
        header: () => 'Dirección',
        meta: { className: 'min-w-[200px]' }
      },
      {
        accessorKey: 'email',
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
              setIdSede(String(row.original.id));
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
        <div className="text-gray-500 font-medium text-sm">Cargando sedes...</div>
      </div>
    );
  }

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header py-5">
        <h3 className="card-title">Regionales</h3>
      </div>

      <div className="card-body m-5">
        <DataGrid
          key={JSON.stringify(filteredSedes)}
          columns={columns}
          data={filteredSedes}
          pagination={{ size: 10 }}
        />
      </div>
      {isModalOpen && (
        <FormularioUpSedesSena
          idSede={idSede}
          setIdSede={setIdSede}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          setEvento={setEvento}
        />
      )}
    </div>
  );
};

export default ListaSedesSena;
