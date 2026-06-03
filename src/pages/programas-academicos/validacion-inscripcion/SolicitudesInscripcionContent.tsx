import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import { solicitudesInscripcionMock, SolicitudInscripcionMock } from './mockSolicitudesInscripcion';
import { getFacturaPorSolicitud } from './mockFacturaSolicitud';

const SolicitudesInscripcionContent = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return solicitudesInscripcionMock;
    return solicitudesInscripcionMock.filter(
      (s) =>
        s.numeroSolicitud.toLowerCase().includes(term) ||
        s.nombreEstudiante.toLowerCase().includes(term) ||
        s.documento.includes(term) ||
        s.nombrePrograma.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const columns = useMemo<ColumnDef<SolicitudInscripcionMock>[]>(
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
            {info.row.original.nombrePrograma}
          </span>
        )
      },
      {
        id: 'factura',
        header: () => 'Factura',
        cell: ({ row }) => {
          const f = getFacturaPorSolicitud(row.original.idSolicitud);
          if (!row.original.requierePago || !f) {
            return <span className="text-xs text-gray-500">Sin cobro</span>;
          }
          return (
            <span className="text-xs font-medium">
              {f.numeroFactura} ({f.estadoFactura})
            </span>
          );
        }
      },
      {
        accessorFn: (row) => row.estado,
        id: 'estado',
        header: () => 'Estado',
        cell: (info) => (
          <span className="text-xs font-bold uppercase">{info.row.original.estado}</span>
        )
      },
      {
        id: 'caso',
        header: () => 'Caso prueba',
        cell: ({ row }) => (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {row.original.casoPrueba ?? '—'}
          </span>
        )
      },
      {
        id: 'accion',
        header: () => '',
        cell: ({ row }) => (
          <Link
            to={`/gestion-academica/inscripciones/solicitudes/${row.original.idSolicitud}/validar`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white uppercase rounded-lg bg-primary hover:bg-primary-active"
          >
            <KeenIcon icon="check-circle" />
            Validar solicitud
          </Link>
        )
      }
    ],
    []
  );

  return (
    <div className="card">
      <div className="card-header flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar solicitud, estudiante o programa…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input input-sm max-w-xs"
        />
      </div>
      <div className="card-body">
        <DataGrid columns={columns} data={filtered} pagination={{ size: 10 }} />
      </div>
    </div>
  );
};

export default SolicitudesInscripcionContent;
