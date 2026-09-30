import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import { ModalConfiguracionPagos } from './ModalConfiguracionPagos';
import clsx from 'clsx';
import { useConfirm } from '@/hooks';
import { useSnackbar } from 'notistack';
import {
  ConfiguracionPagosVariant,
  getLabelsConfiguracionPagos,
  getNombreProcesoConfiguracion
} from './configuracionPagosShared';

interface ContentProps {
  reload: boolean;
  variant?: ConfiguracionPagosVariant;
}

const formatCop = (valor: number) =>
  new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);

const formatVigenciaActual = (row: Record<string, unknown>) => {
  const vig = row.configuracionPagoVigenciaActual as
    | { fechaInicial?: string; fechaFinal?: string | null }
    | undefined;
  if (!vig?.fechaInicial) return '—';
  const fin = vig.fechaFinal ? vig.fechaFinal : 'vigente';
  return `${vig.fechaInicial} → ${fin}`;
};

const ConfiguracionPagosContent = ({ reload, variant = 'pagos' }: ContentProps) => {
  const labels = getLabelsConfiguracionPagos(variant);
  const storageKey =
    variant === 'economicos'
      ? 'filtered_configuracion_valores_economicos'
      : 'filtered_configuracion_pago';

  const [datos, setDatos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataSelected, setDataSelected] = useState<any | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem(storageKey) || '');
  const { confirmAction } = useConfirm();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    localStorage.setItem(storageKey, searchTerm);
  }, [searchTerm, storageKey]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`configuraciones_pago`);
      setDatos(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(`${labels.fetchError}: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [labels.fetchError]);

  const handleDelete = useCallback(
    async (id: number) => {
      confirmAction(labels.deleteConfirm, async () => {
        try {
          await axios.delete(`delete_configuracion_pago/${id}`);
          enqueueSnackbar(labels.deleteSuccess, { variant: 'success' });
          fetchData();
        } catch (err: any) {
          const errorMessage =
            err.response?.data?.message || err.message || labels.deleteError;
          enqueueSnackbar(errorMessage, { variant: 'error' });
          throw err;
        }
      });
    },
    [confirmAction, enqueueSnackbar, fetchData, labels]
  );

  const handleAfterSave = () => {
    fetchData();
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchData();
  }, [reload, fetchData]);

  const columns = useMemo<ColumnDef<any>[]>(() => {
    const base: ColumnDef<any>[] = [
      {
        accessorFn: (row) => row.id,
        id: 'id',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.id}</span>,
        meta: { className: 'w-[90px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.titulo,
        id: 'titulo',
        header: () => labels.columnConcepto,
        enableSorting: true,
        cell: (info) => (
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {info.row.original.titulo}
            </p>
            {variant === 'economicos' && info.row.original.detalle ? (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[280px]">
                {info.row.original.detalle}
              </p>
            ) : null}
          </div>
        ),
        meta: { className: 'min-w-[220px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) =>
          (row.configuracionPagoVigenciaActual as { valor?: number } | undefined)?.valor ?? row.valor,
        id: 'valor',
        header: () => labels.columnValor,
        enableSorting: true,
        cell: (info) => {
          const valor =
            info.row.original.configuracionPagoVigenciaActual?.valor ??
            info.row.original.valor ??
            0;
          return <span className="text-gray-700">${formatCop(Number(valor) || 0)}</span>;
        },
        meta: { className: 'min-w-[130px]', cellClassName: 'text-gray-700 font-normal' }
      }
    ];

    if (variant === 'economicos') {
      base.push({
        id: 'vigencia',
        header: () => labels.columnVigencia,
        enableSorting: false,
        cell: (info) => (
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {formatVigenciaActual(info.row.original)}
          </span>
        ),
        meta: { className: 'min-w-[160px]' }
      });
    }

    base.push(
      {
        id: 'proceso',
        header: () => labels.columnProceso,
        enableSorting: true,
        accessorFn: (row) => getNombreProcesoConfiguracion(row),
        cell: (info) => (
          <span className="text-sm text-gray-900 dark:text-white">
            {getNombreProcesoConfiguracion(info.row.original)}
          </span>
        ),
        meta: { className: 'min-w-[140px]', cellClassName: 'text-gray-700 font-normal' }
      }
    );

    if (variant === 'economicos') {
      base.push(
        {
          id: 'tipoMovimiento',
          header: () => labels.columnTipoMovimiento,
          enableSorting: true,
          accessorFn: (row) => row.tipoMovimiento,
          cell: (info) => (
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {info.row.original.tipoMovimiento || '—'}
            </span>
          ),
          meta: { className: 'min-w-[150px]' }
        },
        {
          id: 'obligatorio',
          header: () => labels.columnObligatorio,
          enableSorting: true,
          accessorFn: (row) => row.obligatorio,
          cell: (info) => {
            const ob = info.row.original.obligatorio;
            const esSi = ob === 1 || ob === true || ob === '1';
            return (
              <span
                className={clsx('badge badge-outline text-[10px]', {
                  'badge-primary': esSi,
                  'badge-secondary': !esSi
                })}
              >
                {esSi ? 'Sí' : 'No'}
              </span>
            );
          },
          meta: { className: 'w-[100px]' }
        }
      );
    }

    base.push(
      {
        accessorKey: 'estado',
        header: () => labels.columnEstado,
        enableSorting: true,
        cell: (info) => {
          const estado = info.row.original.estado as string;
          return (
            <span
              className={clsx('badge badge-outline', {
                'badge-primary': estado === 'ACTIVO',
                'badge-warning': estado === 'INACTIVO'
              })}
            >
              {estado}
            </span>
          );
        },
        meta: { className: 'min-w-[110px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            type="button"
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              setDataSelected(row.original);
              setIsModalOpen(true);
            }}
            title="Editar"
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
            type="button"
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => handleDelete(row.original.id)}
            title="Eliminar"
          >
            <KeenIcon icon="trash" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      }
    );

    return base;
  }, [handleDelete, labels, variant]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return datos;
    const lowerTerm = searchTerm.toLowerCase();
    return datos.filter((item) => {
      const titulo = String(item.titulo ?? '').toLowerCase();
      const detalle = String(item.detalle ?? '').toLowerCase();
      const proceso = getNombreProcesoConfiguracion(item).toLowerCase();
      const valor = String(
        item.configuracionPagoVigenciaActual?.valor ?? item.valor ?? ''
      ).toLowerCase();
      const tipoMov = String(item.tipoMovimiento ?? '').toLowerCase();
      return (
        titulo.includes(lowerTerm) ||
        detalle.includes(lowerTerm) ||
        proceso.includes(lowerTerm) ||
        valor.includes(lowerTerm) ||
        tipoMov.includes(lowerTerm)
      );
    });
  }, [searchTerm, datos]);

  if (loading) return <div className="p-4 text-sm text-gray-600">Cargando...</div>;
  if (error) return <div className="p-4 text-sm text-red-600">{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header gap-3">
        <h3 className="card-title">{labels.tableTitle}</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
            />
            <input
              type="text"
              placeholder={labels.searchPlaceholder}
              className="pl-8 input input-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card-body">
        <DataGrid
          key={`${variant}-${JSON.stringify(filteredData.length)}`}
          columns={columns}
          data={filteredData}
          pagination={{ size: 10 }}
        />
      </div>

      <ModalConfiguracionPagos
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDataSelected(undefined);
        }}
        data={dataSelected}
        onSave={handleAfterSave}
        variant={variant}
      />
    </div>
  );
};

export { ConfiguracionPagosContent };
