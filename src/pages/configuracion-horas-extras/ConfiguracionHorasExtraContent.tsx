import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';

import { useConfirm } from '@/hooks';
import { ModalConfiguracionHorasExtra } from './ModalConfiguracionHorasExtra';

interface ContentProps {
  reload: boolean;
}

const ConfiguracionHorasExtraContent = ({ reload }: ContentProps) => {
  const storageFilterId = 'configHE-filter';
  const [configuraciones, setConfiguraciones] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [configuracion, setConfiguracion] = useState<any | undefined>(undefined);
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
        accessorFn: (row) => row.detalle,
        id: 'detalle',
        header: () => 'Detalle',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.detalle}</span>,
        meta: {
          className: 'min-w-[250px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        accessorFn: (row) => row.porcentaje,
        id: 'porcentaje',
        header: () => 'Porcentaje',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.porcentaje} %</span>,
        meta: {
          className: 'min-w-[100px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        accessorFn: (row) => row.horaInicial,
        id: 'horaInicial',
        header: () => 'Hora Inicial',
        enableSorting: true,
        cell: (info) => {
          const horaInicialStr = info.row.original.horaInicial;
          const [hora, minutos, segundos] = horaInicialStr.split(':');
          const horaInicial = new Date();
          horaInicial.setHours(parseInt(hora), parseInt(minutos), parseInt(segundos));
          const horas = horaInicial.getHours();
          const minutosFormateados = horaInicial.getMinutes();
          const ampm = horas >= 12 ? 'PM' : 'AM';
          const horas12 = horas % 12 || 12;
          const minutosFormateadosStr =
            minutosFormateados < 10 ? `0${minutosFormateados}` : minutosFormateados;

          return (
            <span className="text-gray-700">{`${horas12}:${minutosFormateadosStr} ${ampm}`}</span>
          );
        },
        meta: {
          className: 'min-w-[120px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        accessorFn: (row) => row.horaFinal,
        id: 'horaFinal',
        header: () => 'Hora Final',
        enableSorting: true,
        cell: (info) => {
          const horaFinalStr = info.row.original.horaFinal;
          const [hora, minutos, segundos] = horaFinalStr.split(':');
          const horaFinal = new Date();
          horaFinal.setHours(parseInt(hora), parseInt(minutos), parseInt(segundos));

          const horas = horaFinal.getHours();
          const minutosFormateados = horaFinal.getMinutes();
          const ampm = horas >= 12 ? 'PM' : 'AM';
          const horas12 = horas % 12 || 12;
          const minutosFormateadosStr =
            minutosFormateados < 10 ? `0${minutosFormateados}` : minutosFormateados;

          return (
            <span className="text-gray-700">{`${horas12}:${minutosFormateadosStr} ${ampm}`}</span>
          );
        },
        meta: {
          className: 'min-w-[120px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },

      {
        accessorFn: (row) => row.dias,
        id: 'dias',
        header: () => 'Días',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.dias}</span>,
        meta: {
          className: 'min-w-[150px]',
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
              setConfiguracion(row.original);
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
              deleteConfiguracionHE(row.original.id);
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

  const fetchConfiguracionHE = async () => {
    setLoading(true);
    try {
      const response = await axios.get('configuracion_horas_extra');
      setConfiguraciones(response.data);
    } catch (error) {
      setError('Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  const deleteConfiguracionHE = async (id: number) => {
    confirmAction('Esta acción eliminará esta configuración.', async () => {
      try {
        await axios.delete(`configuracion_horas_extra/${id}`);
        fetchConfiguracionHE();
      } catch (err) {
        setError(`Error al eliminar: ${err}`);
      }
    });
  };

  useEffect(() => {
    fetchConfiguracionHE();
  }, [reload]);

  const handleAfterSave = () => {
    fetchConfiguracionHE();
    setIsModalOpen(false);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return configuraciones;

    const lowercasedSearchTerm = searchTerm.toLowerCase();

    return configuraciones.filter((dat) => {
      const codigo = String(dat.codigo || '').toLowerCase();
      const detalle = String(dat.detalle || '').toLowerCase();
      const porcentaje = String(dat.porcentaje || '').toLowerCase();
      const horaInicial = String(dat.horaInicial || '').toLowerCase();
      const horaFinal = String(dat.horaFinal || '').toLowerCase();
      const dias = String(dat.dias || '').toLowerCase();

      return (
        codigo.includes(lowercasedSearchTerm) ||
        detalle.includes(lowercasedSearchTerm) ||
        porcentaje.includes(lowercasedSearchTerm) ||
        horaInicial.includes(lowercasedSearchTerm) ||
        horaFinal.includes(lowercasedSearchTerm) ||
        dias.includes(lowercasedSearchTerm)
      );
    });
  }, [searchTerm, configuraciones]);



  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Configuración de Horas Extra</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar Configuración de Horas Extra"
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

      <ModalConfiguracionHorasExtra
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setConfiguracion(undefined);
        }}
        data={configuracion}
        onSave={handleAfterSave}
      />
    </div>
  );
};
export { ConfiguracionHorasExtraContent };
