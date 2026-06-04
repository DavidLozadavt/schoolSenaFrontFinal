import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import Spinner from '@/components/loaders/Spinner';
import { SolicitudRecibida } from './solicitudInscripcionTypes';
import { fetchSolicitudesRecibidas } from './validacionInscripcionApi';

const SolicitudesRecibidasContent = () => {
  const [items, setItems] = useState<SolicitudRecibida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchSolicitudesRecibidas();
      setItems(data);
    } catch {
      setError('No se pudieron cargar las solicitudes recibidas.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (s) =>
        s.numeroSolicitud.toLowerCase().includes(term) ||
        s.nombreEstudiante.toLowerCase().includes(term) ||
        s.documento.includes(term) ||
        (s.email ?? '').toLowerCase().includes(term) ||
        (s.nombrePrograma ?? '').toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  const columns = useMemo<ColumnDef<SolicitudRecibida>[]>(
    () => [
      {
        accessorFn: (row) => row.numeroSolicitud,
        id: 'numero',
        header: () => 'Solicitud',
        cell: (info) => (
          <span className="font-medium text-gray-900 dark:text-white">
            {info.row.original.numeroSolicitud}
          </span>
        )
      },
      {
        accessorFn: (row) => row.nombreEstudiante,
        id: 'estudiante',
        header: () => 'Estudiante',
        cell: (info) => (
          <div>
            <span className="text-sm font-medium">{info.row.original.nombreEstudiante}</span>
            <span className="block text-xs text-gray-500">{info.row.original.documento}</span>
          </div>
        )
      },
      {
        accessorFn: (row) => row.nombrePrograma,
        id: 'programa',
        header: () => 'Programa',
        cell: (info) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {info.row.original.nombrePrograma ?? '—'}
          </span>
        )
      },
      {
        accessorFn: (row) => row.fechaSolicitud,
        id: 'fecha',
        header: () => 'Fecha',
        cell: (info) => (
          <span className="text-sm text-gray-600">
            {info.row.original.fechaSolicitud
              ? new Date(info.row.original.fechaSolicitud + 'T12:00:00').toLocaleDateString('es-CO')
              : '—'}
          </span>
        )
      },
      {
        accessorFn: (row) => row.estado,
        id: 'estado',
        header: () => 'Estado',
        cell: (info) => (
          <span className="text-xs font-bold uppercase text-sky-700">
            {info.row.original.estadoEtiqueta ?? info.row.original.estado}
          </span>
        )
      },
      {
        id: 'acciones',
        header: () => '',
        cell: ({ row }) => {
          if (row.original.estado === 'RECHAZADA') {
            return <span className="text-xs text-red-600">Rechazada</span>;
          }
          return (
            <Link
              to={`/gestion-academica/inscripciones/recibidas/${row.original.id}/validar`}
              className="btn btn-xs btn-primary"
            >
              Validar solicitud
            </Link>
          );
        }
      }
    ],
    []
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Formularios públicos enviados. Revise, confirme y genere factura académica desde el Paso 1.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar estudiante, documento o programa…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-sm max-w-xs"
          />
          <button type="button" onClick={cargar} className="btn btn-sm btn-light" disabled={loading}>
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="px-5 pb-2">
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-16">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-500">
          No hay solicitudes recibidas pendientes de facturación.
        </div>
      ) : (
        <div className="card-body pt-0">
          <DataGrid columns={columns} data={filtered} pagination={{ size: 10 }} />
        </div>
      )}
    </>
  );
};

export default SolicitudesRecibidasContent;
