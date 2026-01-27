import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';

interface Props {
  searchTerm: string;
  evento: boolean;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
}
interface Jornada {
  id: number;
  nombreJornada: string;
}
interface Sede {
  id: number;
  nombre: string;
}
interface Regional {
  id: number;
  razonSocial: string;
}
interface Programa {
  id: number;
  nombrePrograma: string;
}

interface Asignacion {
  id: number;
  estado: string;
  programa: Programa;
}

interface Fichas {
  id: number;
  idJornada: number;
  idAsignacion: number;
  codigo: string;
  idInstructorLider: number | null;
  documento: string | null;
  idAprendizVocero: number | null;
  idAprendizSuplente: number | null;
  idInfraestructura: number | null;
  idSede: number;
  idRegional: number;
  porcentajeEjecucion: number;
  jornada: Jornada;
  asignacion: Asignacion | null;
  infraestructura: null;
  sede: Sede;
  regional: Regional;
}

const ListaFichas: React.FC<Props> = ({ searchTerm, evento, setEvento }) => {
  const [loading, setLoading] = useState(true);
  const [fichas, setFichas] = useState<Fichas[]>([]);

  //Actualización de la regional:
  const [idFicha, setIdFicha] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axios.get<any[]>('fichas');
        setFichas(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [evento]);

  const filteredFichas = useMemo(() => {
    if (!searchTerm) return fichas;

    const term = searchTerm.toLowerCase();

    return fichas.filter(
      (ficha) =>
        ficha.codigo.toLowerCase().includes(term) ||
        ficha.sede.nombre.toLowerCase().includes(term) ||
        ficha.regional.razonSocial.toLowerCase().includes(term) ||
        ficha.asignacion?.programa?.nombrePrograma.toLowerCase().includes(term)
    );
  }, [fichas, searchTerm]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'codigo',
        header: () => 'Código',
        cell: (info) => (
          <span className="font-medium text-gray-800">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[220px]' }
      },
      {
        accessorKey: 'asignacion.programa.nombrePrograma',
        header: () => 'Programa',
        meta: { className: 'min-w-[220px]' }
      },

      {
        accessorKey: 'sede.nombre',
        header: () => 'Sede',
        meta: { className: 'min-w-[140px]' }
      },
      {
        accessorKey: 'regional.razonSocial',
        header: () => 'Regional',
        meta: { className: 'min-w-[200px]' }
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
              setIdFicha(String(row.original.id));
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
        <h3 className="card-title">Fichas</h3>
      </div>

      <div className="card-body m-5">
        <DataGrid
          key={JSON.stringify(filteredFichas)}
          columns={columns}
          data={filteredFichas}
          pagination={{ size: 10 }}
        />
      </div>
    </div>
  );
};

export default ListaFichas;
