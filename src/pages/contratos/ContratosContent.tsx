import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { ContratoInterface } from './model/ContratoInterface';
import clsx from 'clsx';

interface ContratosContentProps {
  reload: boolean;
}

const ContratoContent = ({ reload }: ContratosContentProps) => {
  const storageFilterId = 'contratos-filter';
  const [contratos, setContratos] = useState<ContratoInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });

  const handleContrato = useCallback((id: number) => {
    navigate(`/gestion-contratos/contratos/contrato`,  {state: id });
  }, [navigate]);

  const columns = useMemo<ColumnDef<ContratoInterface>[]>(
    () => [
      {
        accessorFn: (row) => row.id,
        id: 'id',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.id}</span>,
        meta: {
          className: 'w-[80px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.fechaContratacion,
        id: 'fechaInicio',
        header: () => 'Incio de Contrato',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.fechaContratacion}
          </Link>
        ),
        meta: {
          className: 'min-w-[160px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.fechaFinalContrato,
        id: 'fechaFin',
        header: () => 'Fin de Contrato',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.fechaFinalContrato}
          </Link>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        accessorFn: (row) => row?.persona?.nombre1,
        id: 'nombre',
        header: () => 'Nombre',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.persona?.nombre1} {info.row.original.persona?.apellido1}
          </Link>
        ),
        meta: {
          className: 'min-w-[200px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.persona?.identificacion,
        id: 'identificacion',
        header: () => 'Identificación',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.persona?.identificacion}
          </Link>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        accessorFn: (row) => row.salario?.rol.name,
        id: 'rol',
        header: () => 'Cargo',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.salario?.rol.name}
          </Link>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },{
        accessorFn: (row) => row.area?.nombre,
        id: 'rol',
        header: () => 'Area',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.area?.nombre}
          </Link>
        ),
        meta: {
          className: 'min-w-[140px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        accessorFn: (row) => row.estado?.estado,
        id: 'estado',
        header: () => 'Estado',
        enableSorting: true,
        cell: (info) => {
          const estado = info.row.original?.estado?.estado;
      
          return (
            <Link
              className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
              to="#"
            >
              <span
                className={clsx('badge badge-outline', {
                  'badge-danger': estado === 'INTERRUMPIDO',
                  'badge-primary': estado === 'ACTIVO',
                  'badge-warning': estado === 'ADICION DE CONTRATO',
                
                })}
              >
                {estado}
              </span>
            </Link>
          );
        },
        meta: {
          className: 'min-w-[110px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },  


      {
        id: 'see',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => handleContrato(row.original.id)}
          >
            <KeenIcon icon="eye" />
          </button>
        ),
        meta: {
          className: 'w-[55px]'
        }
      }
     
    ],
    [handleContrato]
  );

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchContratos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('contratos');
      setContratos(response.data);
    } catch (error) {
      setError('Error al cargar los contratos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContratos();
  }, [reload]);

  const handleAfterSave = () => {
    fetchContratos();
    setIsModalOpen(false);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return contratos;

    return contratos.filter(
      (contrato) =>
        contrato.fechaContratacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contrato?.fechaFinalContrato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contrato.persona?.nombre1.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contrato.persona?.apellido1.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contrato.persona?.identificacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contrato.estado?.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contrato.salario?.rol.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, contratos]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Contratos</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar Contratos"
              className="input input-sm pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
            />
          </div>
        </div>
      </div>

      <div className="card-body">
        <DataGrid
          key={JSON.stringify(filteredData)}
          columns={columns}
          data={filteredData}
          pagination={{ size: 10 }}
        />
      </div>
    </div>
  );
};

export { ContratoContent };
