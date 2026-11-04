import { Fragment, useCallback, useEffect, useState } from 'react';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import clsx from 'clsx';
import {
  solicitudesInscripcionService,
  SolicitudAspirante,
  GetSolicitudesParams,
} from '@/services/solicitudesInscripcionService';
import { ModalDetalleSolicitud } from './ModalDetalleSolicitud';

const ESTADOS: { value: string; label: string; badge: string }[] = [
  { value: 'formulario_iniciado', label: 'Formulario iniciado', badge: 'badge-secondary' },
  { value: 'formulario_enviado', label: 'Formulario enviado', badge: 'badge-info' },
  { value: 'documentacion_completa', label: 'Documentación completa', badge: 'badge-info' },
  { value: 'documentacion_incompleta', label: 'Documentación incompleta', badge: 'badge-warning' },
  { value: 'pendiente_revision', label: 'Pendiente de revisión', badge: 'badge-warning' },
  { value: 'aprobado', label: 'Aprobado', badge: 'badge-success' },
  { value: 'rechazado', label: 'Rechazado', badge: 'badge-danger' },
  { value: 'correccion_solicitada', label: 'Corrección solicitada', badge: 'badge-warning' },
];

const estadoInfo = (estado: string | null) => ESTADOS.find((e) => e.value === estado);

const SolicitudesInscripcionContent = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [solicitudes, setSolicitudes] = useState<SolicitudAspirante[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [programaFilter, setProgramaFilter] = useState('');
  const [fichaFilter, setFichaFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchSolicitudes = useCallback(
    async (page = 1) => {
      setLoading(true);
      const params: GetSolicitudesParams = {
        page,
        per_page: perPage,
        estadoDocumental: estadoFilter || undefined,
        programa: programaFilter || undefined,
        ficha: fichaFilter || undefined,
      };
      try {
        const response = await solicitudesInscripcionService.getSolicitudes(params);
        setSolicitudes(response.data);
        setCurrentPage(response.current_page);
        setTotalPages(response.last_page);
        setTotal(response.total);
      } catch {
        enqueueSnackbar('Error al cargar las solicitudes de inscripción.', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [estadoFilter, programaFilter, fichaFilter, enqueueSnackbar]
  );

  useEffect(() => {
    fetchSolicitudes(1);
  }, [fetchSolicitudes]);

  const openDetalle = (id: number) => {
    setSelectedId(id);
    setModalOpen(true);
  };

  return (
    <Fragment>
      <div className="card">
        <div className="card-header flex-wrap gap-3">
          <div className="flex flex-wrap gap-2">
            <select
              className="select select-sm w-[200px]"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
            <input
              className="input input-sm w-[160px]"
              placeholder="Programa"
              value={programaFilter}
              onChange={(e) => setProgramaFilter(e.target.value)}
            />
            <input
              className="input input-sm w-[120px]"
              placeholder="Ficha"
              value={fichaFilter}
              onChange={(e) => setFichaFilter(e.target.value)}
            />
            <button className="btn btn-sm btn-primary" onClick={() => fetchSolicitudes(1)}>
              <KeenIcon icon="magnifier" /> Buscar
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-auto align-middle text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="p-3 text-left">Nombre</th>
                  <th className="p-3 text-left">Documento</th>
                  <th className="p-3 text-left">Programa</th>
                  <th className="p-3 text-left">Ficha</th>
                  <th className="p-3 text-left">Centro</th>
                  <th className="p-3 text-left">Fecha envío</th>
                  <th className="p-3 text-left">Estado documental</th>
                  <th className="p-3 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="p-6 text-center text-gray-400">Cargando...</td></tr>
                ) : solicitudes.length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-gray-400">No hay solicitudes de inscripción.</td></tr>
                ) : (
                  solicitudes.map((s) => {
                    const info = estadoInfo(s.estadoDocumental);
                    return (
                      <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 font-semibold text-gray-900">{s.nombre} {s.apellido}</td>
                        <td className="p-3 text-gray-700">{s.celular}</td>
                        <td className="p-3 text-gray-700">{s.programa}</td>
                        <td className="p-3 text-gray-700 font-mono">{s.ficha}</td>
                        <td className="p-3 text-gray-700">{s.centro_formacion}</td>
                        <td className="p-3 text-gray-700">{s.fechaFormularioEnviado || '—'}</td>
                        <td className="p-3">
                          <span className={clsx('badge badge-sm badge-outline', info?.badge)}>
                            {info?.label || s.estadoDocumental || '—'}
                          </span>
                        </td>
                        <td className="p-3">
                          <button className="btn btn-sm btn-light" onClick={() => openDetalle(s.id)}>
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        {total > 0 && (
          <div className="card-footer justify-between text-2sm text-gray-600">
            <span>{(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, total)} de {total}</span>
            <div className="flex gap-1.5">
              <button
                className="btn btn-sm btn-icon"
                disabled={currentPage === 1}
                onClick={() => fetchSolicitudes(currentPage - 1)}
              >
                <KeenIcon icon="black-left" />
              </button>
              <button
                className="btn btn-sm btn-icon"
                disabled={currentPage === totalPages}
                onClick={() => fetchSolicitudes(currentPage + 1)}
              >
                <KeenIcon icon="black-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ModalDetalleSolicitud
        open={modalOpen}
        aspiranteId={selectedId}
        onClose={() => setModalOpen(false)}
        onSuccess={() => fetchSolicitudes(currentPage)}
      />
    </Fragment>
  );
};

export { SolicitudesInscripcionContent };
