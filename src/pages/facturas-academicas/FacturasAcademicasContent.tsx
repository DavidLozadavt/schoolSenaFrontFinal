import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import clsx from 'clsx';
import { ModalDetalleFacturaAcademica } from './ModalDetalleFacturaAcademica';

interface ContentProps {
  reload: boolean;
}

const formatCop = (valor: number) =>
  new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
    valor
  );

const FacturasAcademicasContent = ({ reload }: ContentProps) => {
  const [datos, setDatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('facturas_academicas');
      const payload = response.data;
      const facturas = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
      setDatos(facturas);
    } catch (err) {
      setError(`Error al cargar facturas: ${err}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [reload, fetchData]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return datos;
    return datos.filter((row) => {
      const num = String(row.numeroFactura ?? '').toLowerCase();
      const proc = String(row.proceso?.nombreProceso ?? '').toLowerCase();
      const est = String(row.estado ?? '').toLowerCase();
      return num.includes(q) || proc.includes(q) || est.includes(q);
    });
  }, [datos, searchTerm]);

  const openDetalle = (id: number) => {
    setDetalleId(id);
    setModalDetalleOpen(true);
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (row) => row.numeroFactura,
        id: 'numeroFactura',
        header: () => 'Nº factura',
        cell: (info) => (
          <span className="font-medium text-gray-900 dark:text-white">
            {info.row.original.numeroFactura}
          </span>
        )
      },
      {
        accessorFn: (row) => row.fecha,
        id: 'fecha',
        header: () => 'Fecha',
        cell: (info) => (
          <span className="text-gray-700">{String(info.row.original.fecha).slice(0, 10)}</span>
        )
      },
      {
        id: 'proceso',
        header: () => 'Proceso',
        accessorFn: (row) => row.proceso?.nombreProceso,
        cell: (info) => (
          <span className="text-gray-700">{info.row.original.proceso?.nombreProceso ?? '—'}</span>
        )
      },
      {
        accessorFn: (row) => row.valor,
        id: 'valor',
        header: () => 'Total',
        cell: (info) => (
          <span className="text-gray-700">${formatCop(Number(info.row.original.valor) || 0)}</span>
        )
      },
      {
        accessorFn: (row) => row.estado,
        id: 'estado',
        header: () => 'Estado',
        cell: (info) => {
          const est = String(info.row.original.estado ?? 'PENDIENTE');
          const pagado = est.toUpperCase() === 'PAGADO';
          return (
            <span
              className={clsx('badge badge-outline text-[10px]', {
                'badge-success': pagado,
                'badge-warning': !pagado
              })}
            >
              {est}
            </span>
          );
        }
      },
      {
        id: 'acciones',
        header: () => 'Acciones',
        enableSorting: false,
        cell: (info) => (
          <button
            type="button"
            className="btn btn-xs btn-light"
            onClick={() => openDetalle(info.row.original.id)}
          >
            <KeenIcon icon="eye" className="text-sm" />
            Ver detalle
          </button>
        )
      }
    ],
    []
  );

  if (loading) return <div className="p-4 text-sm text-gray-600">Cargando facturas...</div>;
  if (error) return <div className="p-4 text-sm text-red-600">{error}</div>;

  return (
    <>
      <ModalDetalleFacturaAcademica
        open={modalDetalleOpen}
        facturaId={detalleId}
        onClose={() => {
          setModalDetalleOpen(false);
          setDetalleId(null);
        }}
      />
      <div className="min-w-full card card-grid">
        <div className="flex-wrap py-5 card-header gap-3">
          <h3 className="card-title">Facturas generadas</h3>
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
            />
            <input
              type="text"
              placeholder="Buscar por número, proceso o estado"
              className="pl-8 input input-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="card-body">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">
              No hay facturas registradas. Genere una desde valores económicos.
            </p>
          ) : (
            <DataGrid
              key={`facturas-academicas-${filtered.length}`}
              columns={columns}
              data={filtered}
              pagination={{ size: 10 }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export { FacturasAcademicasContent };
