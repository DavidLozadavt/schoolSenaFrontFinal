import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';

import { useConfirm } from '@/hooks';
import { ModalContrato } from './ModalContrato';
import { ModalVacaciones } from './ModalVacaciones';
import { ModalIncapacidades } from './ModalIncapacidades';
import { ModalDeducciones } from './ModalDeducciones';
import { ComisionModal } from './ComisionModal';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Spinner from '@/components/loaders/Spinner';

interface ContentProps {
  reload: boolean;
  onExportReady?: (fn: () => void) => void;
}

const LiquidacionNominaContent = ({ reload, onExportReady }: ContentProps) => {
  const storageFilterId = 'tu-lquidacion-nomina-filter';
  const [nominas, setNominas] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [tarifa, setTarifa] = useState<any | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });
  const navigate = useNavigate();

  const handleLiquidacion = useCallback(
    (id: number, fecha: string, fechaInicialPeriodo: string, fechaFinalPeriodo: string) => {
      navigate(`/nomina/tu-nomina/liquidacion-nomina`, {
        state: { id, fecha, fechaInicialPeriodo, fechaFinalPeriodo }
      });
    },
    [navigate]
  );

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'id',
        header: () => 'Código',
        enableSorting: true,
        cell: ({ row }) => <span className="text-gray-700">{row.original.id}</span>,
        meta: {
          className: 'min-w-[80px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        id: 'fecha',
        header: () => 'Fecha',
        enableSorting: true,
        cell: ({ row }) => {
          const fecha = new Date(row.original.fecha);
          const formato = fecha.toLocaleString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          });
          return <span className="text-gray-700">{formato}</span>;
        },
        meta: {
          className: 'min-w-[160px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        id: 'nombre',
        header: () => 'Nombre del Periodo',
        enableSorting: true,
        cell: ({ row }) => <span className="text-gray-700">{row.original.nombre}</span>,
        meta: {
          className: 'min-w-[80px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        id: 'periodo',
        header: () => 'Periodo',
        enableSorting: true,
        cell: ({ row }) => {
          const { fechaInicialPeriodo, fechaFinalPeriodo } = row.original;

          if (!fechaInicialPeriodo || !fechaFinalPeriodo) {
            return <span className="text-gray-500">Sin periodo</span>;
          }

          const formatoFecha = (fechaStr: string) =>
            new Date(fechaStr).toLocaleDateString('es-CO', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });

          const inicio = formatoFecha(fechaInicialPeriodo);
          const fin = formatoFecha(fechaFinalPeriodo);

          return (
            <span className="text-gray-700">
              {inicio} - {fin}
            </span>
          );
        },
        meta: {
          className: 'min-w-[180px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        id: 'total_devengado',
        header: () => 'Valor Liquidación',
        enableSorting: true,
        cell: ({ row }) => {
          const valor = row.original.total_devengado ?? 0;

          const formatoCOP = new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(valor);

          return <span className="text-gray-700">{formatoCOP}</span>;
        },
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        id: 'acciones',
        header: () => 'Acciones',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-center items-center">
            <button
              title="Ver Detalles"
              onClick={() =>
                handleLiquidacion(
                  row.original.id,
                  row.original.fecha,
                  row.original.fechaInicialPeriodo,
                  row.original.fechaFinalPeriodo
                )
              }
              className="p-1 hover:text-blue-600"
            >
              <KeenIcon icon="eye" className="text-xl" />
            </button>
          </div>
        ),
        meta: {
          className: 'w-[100px] text-center'
        }
      }
    ],
    [handleLiquidacion]
  );

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
  }, [searchTerm]);

  const fetchLiquidacionNomina = async () => {
    setLoading(true);
    try {
      const response = await axios.get('get_liquidacion_nomina');
      setNominas(response.data);
    } catch (error) {
      setError('Error al cargar ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiquidacionNomina();
  }, [reload]);

  const filteredData = useMemo(() => {
    return nominas.filter((dat) => {
      const inicio = dat.fechaInicialPeriodo
        ? new Date(dat.fechaInicialPeriodo).toLocaleDateString('es-CO')
        : '';
      const fin = dat.fechaFinalPeriodo
        ? new Date(dat.fechaFinalPeriodo).toLocaleDateString('es-CO')
        : '';
      const periodo = `${inicio} - ${fin}`;

      const valor = dat.valorLiquidacion ? dat.valorLiquidacion.toString() : '';
      const search = searchTerm.toLowerCase();

      const matchesSearch = search
        ? periodo.toLowerCase().includes(search) || valor.toLowerCase().includes(search)
        : true;

      return matchesSearch;
    });
  }, [nominas, searchTerm]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="min-w-full card card-grid">
      {loading && <Spinner />}
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Liquidaciones</h3>

        <div className="flex items-center gap-4">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-md"
            />
            <input
              type="text"
              placeholder="Buscar liquidaciones..."
              className="pl-8 input input-sm w-64"
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
        />

        {/* <div className="w-1/2 p-2 mt-4">
          <table className="w-full text-left border border-collapse border-gray-300 table-auto">
            <thead></thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 border border-gray-300">Numero de Trabajadores</td>
                <td className="px-4 py-2 border border-gray-300">22</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-gray-300">Total Nomina</td>
                <td className="px-4 py-2 border border-gray-300">$20.000.000</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-gray-300">Parcial</td>
                <td className="px-4 py-2 border border-gray-300">$10.000.000</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-gray-300">Deducciones</td>
                <td className="px-4 py-2 border border-gray-300">$10.000.000</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-gray-300">Parafiscales</td>
                <td className="px-4 py-2 border border-gray-300">$10.000.000</td>
              </tr>
            </tbody>
          </table>
        </div> */}
      </div>
    </div>
  );
};

export { LiquidacionNominaContent };
