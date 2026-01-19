import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { DataGrid } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import { KeenIcon } from '@/components';
import FormularioUpRegional from './FormularioUpRegional';

interface Props {
  searchTerm: string;
  evento: boolean;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Departamento {
  id: number;
  codigo: string;
  descripcion: string;
}

interface Regional {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
  idDepartamento: number;
  departamento: Departamento;
}

const ListaRegionales: React.FC<Props> = ({ searchTerm, evento, setEvento }) => {
  const [loading, setLoading] = useState(true);
  const [regionales, setRegionales] = useState<Regional[]>([]);

  //Actualización de la regional:
  const [idRegional, setIdRegional] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axios.get<Regional[]>('regional');
        setRegionales(res.data);
      } catch (error) {
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
      (regional) =>
        regional.nombre.toLowerCase().includes(term) ||
        regional.telefono.toLowerCase().includes(term) ||
        regional.direccion.toLowerCase().includes(term) ||
        regional.departamento?.descripcion.toLowerCase().includes(term)
    );
  }, [regionales, searchTerm]);

  const columns = useMemo<ColumnDef<Regional>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: () => 'Regional',
        cell: (info) => (
          <span className="font-medium text-gray-800">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[220px]' }
      },
      {
        accessorKey: 'telefono',
        header: () => 'Teléfono',
        meta: { className: 'min-w-[130px]' }
      },
      {
        accessorKey: 'direccion',
        header: () => 'Dirección',
        meta: { className: 'min-w-[180px]' }
      },
      {
        id: 'departamento',
        header: () => 'Departamento',
        accessorFn: (row) => row.departamento?.descripcion,
        cell: (info) => <span className="text-gray-700">{(info.getValue() as string) || '—'}</span>,
        meta: { className: 'min-w-[160px]' }
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
              setIdRegional(row.original.id);
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
        <div className="text-gray-500 font-medium text-sm">Cargando regionales...</div>
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
          key={JSON.stringify(filteredRegionales)}
          columns={columns}
          data={filteredRegionales}
          pagination={{ size: 10 }}
        />
      </div>
      {isModalOpen && (
        <FormularioUpRegional
          idRegional={idRegional}
          setIdRegional={setIdRegional}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          setEvento={setEvento}
        />
      )}
    </div>
  );
};

export default ListaRegionales;
