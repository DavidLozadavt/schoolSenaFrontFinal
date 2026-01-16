import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import clsx from 'clsx';

interface ContentProps {
  reload: boolean;
}

const AhorroTerceroContent = ({ reload }: ContentProps) => {
  const StorageFilteredId = 'filtered_ahorro_tercero';
  const [ahorrosTerceros, setAhorrosTerceros] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(StorageFilteredId) || '';
  });

  useEffect(() => {
    localStorage.setItem(StorageFilteredId, searchTerm);
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      const response = await axios.get('get_ahorros_terceros');
      setAhorrosTerceros(response.data);
    } catch (err) {
      setError(`Error fetching ahorros tercero: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [reload]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (row) => row.id,
        id: 'id',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.id}</span>,
        meta: { className: 'w-[100px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.tercero?.nombre,
        id: 'nombreTercero',
        header: () => 'Nombre Tercero',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="text-sm font-medium leading-none text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.tercero?.nombre || 'N/A'}
          </Link>
        ),
        meta: { className: 'min-w-[250px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.valor,
        id: 'valor',
        header: () => 'Valor',
        enableSorting: true,
        cell: (info) => {
          const valor = parseFloat(info.row.original.valor || 0);
          return (
            <span className="text-gray-700">
              {new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
              }).format(valor)}
            </span>
          );
        },
        meta: { className: 'min-w-[150px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.fecha,
        id: 'fecha',
        header: () => 'Fecha',
        enableSorting: true,
        cell: (info) => {
          const fecha = info.row.original.fecha;
          return <span className="text-gray-700">{fecha || 'N/A'}</span>;
        },
        meta: { className: 'min-w-[120px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.estado,
        id: 'estado',
        header: () => 'Estado',
        enableSorting: true,
        cell: (info) => {
          const estado = info.row.original?.estado;

          return (
            <Link
              className="leading-none font-medium text-sm text-gray-900 hover:text-primary"
              to="#"
            >
              <span
                className={clsx('badge badge-outline', {
                  'badge-success': estado === 'EJECUTADO',
                  'badge-warning': estado === 'PENDIENTE',
                  'badge-danger': estado === 'CANCELADO',
                  'badge-primary': estado === 'ACTIVO'
                })}
              >
                {estado || 'N/A'}
              </span>
            </Link>
          );
        },
        meta: {
          className: 'min-w-[110px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      }
    ],
    []
  );

  const filteredData = useMemo(() => {
    if (!searchTerm) return ahorrosTerceros;
    return ahorrosTerceros.filter((ahorroTercero) => {
      const nombreTercero = ahorroTercero.tercero?.nombre?.toLowerCase() || '';
      const id = ahorroTercero.id?.toString() || '';
      const estado = ahorroTercero.estado?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();

      return (
        nombreTercero.includes(searchLower) ||
        id.includes(searchLower) ||
        estado.includes(searchLower)
      );
    });
  }, [searchTerm, ahorrosTerceros]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Ahorros de Terceros</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
            />
            <input
              type="text"
              placeholder="Buscar por nombre, código o estado"
              className="pl-8 input input-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
          sorting={[{ id: 'nombreTercero', desc: false }]}
        />
      </div>
    </div>
  );
};

export { AhorroTerceroContent };
