import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';

import { useConfirm } from '@/hooks';
import { ModalTarifasRiesgo } from './ModalTarifasRiesgo';

interface ContentProps {
  reload: boolean;
}

const TarifasRiesgoContent = ({ reload }: ContentProps) => {
  const storageFilterId = 'tarfiaR-filter';
  const [tarifas, setTarifas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tarifa, setTarifa] = useState<any | undefined>(undefined);
  const { confirmAction } = useConfirm();
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (row) => row.codigo,
        id: 'codigo',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.id}</span>,
        meta: {
          className: 'w-[100px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        accessorFn: (row) => row.nivel,
        id: 'nivel',
        header: () => 'Nivel',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.nivel}</span>,
        meta: {
          className: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.porcentajeCotizacion,
        id: 'porcentajeCotizacion',
        header: () => 'Cotización',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {info.row.original.porcentajeCotizacion} %
          </span>
        ),
        meta: {
          className: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      

      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              setIsModalOpen(true);
              setTarifa(row.original);
            }}
          >
            <KeenIcon icon="notepad-edit" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      },

      {
        id: 'delete',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              deleteTarifas(row.original.id);
            }}
          >
            <KeenIcon icon="trash" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchTarifas = async () => {
    setLoading(true);
    try {
      const response = await axios.get('tarifas_arls');
      setTarifas(response.data);
    } catch (error) {
      setError('Error al cargar ');
    } finally {
      setLoading(false);
    }
  };

  const deleteTarifas = async (id: number) => {
    confirmAction('Esta acción eliminará esta configuración.', async () => {
      try {
        await axios.delete(`tarifas_arls/${id}`);
        fetchTarifas();
      } catch (err) {
        setError(`Error al eliminar : ${err}`);
      }
    });
  };

  useEffect(() => {
    fetchTarifas();
  }, [reload]);

  const handleAfterSave = () => {
    fetchTarifas();
    setIsModalOpen(false);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return tarifas;
  
    return tarifas.filter((dat) => {
      const porcentajeCotizacion = String(dat.porcentajeCotizacion || '').toLowerCase();
      const nivel = String(dat.nivel || '').toLowerCase();
      const search = searchTerm.toLowerCase();
  
      return porcentajeCotizacion.includes(search) || nivel.includes(search);
    });
  }, [searchTerm, tarifas]);
  
  

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Tarifas de Riesgo Profesional (ARL)</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar Tarifas de Riesgo"
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

      <ModalTarifasRiesgo
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTarifa(undefined);
        }}
        data={tarifa}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { TarifasRiesgoContent };
