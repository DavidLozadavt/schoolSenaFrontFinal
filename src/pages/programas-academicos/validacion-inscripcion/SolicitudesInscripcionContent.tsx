import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import Spinner from '@/components/loaders/Spinner';
import { useSnackbar } from 'notistack';
import {
  esSolicitudAprobada,
  EstadoSolicitudInscripcion,
  FiltroEstadoSolicitudInscripcion,
  SolicitudInscripcion
} from './solicitudInscripcionTypes';
import { fetchSolicitudesInscripcion, fetchSolicitudInscripcionDetalle, deleteSolicitudInscripcion } from './validacionInscripcionApi';

const formatearEstadoFactura = (estado?: string) => {
  if (!estado) return '—';
  if (estado === 'PAGADO') return 'PAGADA';
  return estado;
};


const etiquetaEstadoSolicitud: Record<EstadoSolicitudInscripcion, string> = {
  PENDIENTE: 'Pendiente',
  EN_REVISION: 'En revisión',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada'
};

type TabListado = 'pendientes' | 'aprobadas';

const filtroPorTab = (tab: TabListado): FiltroEstadoSolicitudInscripcion =>
  tab === 'aprobadas' ? 'APROBADAS' : 'PENDIENTES';

const SolicitudesInscripcionContent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabDesdeUrl: TabListado =
    searchParams.get('tab') === 'aprobadas' ? 'aprobadas' : 'pendientes';
  const [tabActivo, setTabActivo] = useState<TabListado>(tabDesdeUrl);
  const [searchTerm, setSearchTerm] = useState('');
  const [solicitudes, setSolicitudes] = useState<SolicitudInscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState<'reciente' | 'antigua' | 'az'>('reciente');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ idFactura: number; nombre: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteCount, setDeleteCount] = useState(0);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setTabActivo(tabDesdeUrl);
  }, [tabDesdeUrl]);

  const cambiarTab = (nuevoTab: TabListado) => {
    setTabActivo(nuevoTab);
    setSearchParams(nuevoTab === 'aprobadas' ? { tab: 'aprobadas' } : {}, { replace: true });
  };

  // Modal states for form responses preview
  const [selectedIdFactura, setSelectedIdFactura] = useState<number | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [solicitudDetail, setSolicitudDetail] = useState<any>(null);

  const handleOpenRespuestasModal = async (idFactura: number) => {
    setSelectedIdFactura(idFactura);
    setModalLoading(true);
    setSolicitudDetail(null);
    try {
      const detail = await fetchSolicitudInscripcionDetalle(idFactura);
      setSolicitudDetail(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const cargarSolicitudes = useCallback(async (tab: TabListado = tabActivo) => {
    setLoading(true);
    setError('');
    try {
      const filtro = filtroPorTab(tab);
      const data = await fetchSolicitudesInscripcion(filtro);
      setSolicitudes(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las solicitudes. Verifique su sesión e intente de nuevo.');
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  }, [tabActivo]);

  useEffect(() => {
    cargarSolicitudes(tabActivo);
  }, [tabActivo, cargarSolicitudes]);

  const confirmarEliminar = (idFactura: number, nombre: string) => {
    setConfirmDelete({ idFactura, nombre });
  };

  const ejecutarEliminar = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteSolicitudInscripcion(confirmDelete.idFactura);
      setSolicitudes(prev => prev.filter(s => s.idFactura !== confirmDelete.idFactura));
      setDeleteCount(c => c + 1);
      enqueueSnackbar('Solicitud eliminada correctamente.', { variant: 'success' });
      setConfirmDelete(null);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'No se pudo eliminar la solicitud.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const solicitudesPorTab = solicitudes;

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = term
      ? solicitudesPorTab.filter(
          (s) =>
            s.numeroSolicitud.toLowerCase().includes(term) ||
            (s.numeroFactura ?? '').toLowerCase().includes(term) ||
            s.nombreEstudiante.toLowerCase().includes(term) ||
            s.documento.includes(term) ||
            s.nombrePrograma.toLowerCase().includes(term)
        )
      : solicitudesPorTab;

    return [...base].sort((a, b) => {
      if (sortOrder === 'az') return a.nombreEstudiante.localeCompare(b.nombreEstudiante, 'es');
      const ta = new Date(a.creadoEn ?? a.fechaSolicitud).getTime() || a.idFactura;
      const tb = new Date(b.creadoEn ?? b.fechaSolicitud).getTime() || b.idFactura;
      return sortOrder === 'reciente' ? tb - ta : ta - tb;
    });
  }, [searchTerm, solicitudesPorTab, sortOrder]);

  const columns = useMemo<ColumnDef<SolicitudInscripcion>[]>(
    () => [
      {
        accessorFn: (row) => row.numeroSolicitud,
        id: 'numero',
        header: () => 'Solicitud',
        cell: (info) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-gray-900 dark:text-white text-sm whitespace-nowrap">
                {info.row.original.numeroSolicitud}
              </span>
              {info.row.original.editado && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  title={info.row.original.fechaEditado ? `Editado el ${new Date(info.row.original.fechaEditado).toLocaleString()}` : 'Editado'}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  Editado
                </span>
              )}
            </div>
            {info.row.original.numeroFactura && (
              <span className="text-xs text-gray-500 whitespace-nowrap">
                Factura {info.row.original.numeroFactura}
              </span>
            )}
          </div>
        )
      },
      {
        accessorFn: (row) => row.nombreEstudiante,
        id: 'estudiante',
        header: () => 'Estudiante',
        cell: (info) => {
          const { nombreEstudiante, estadoMatricula } = info.row.original;
          return (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                {nombreEstudiante}
              </span>
              {estadoMatricula && (
                <span className="inline-flex w-fit items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 uppercase tracking-wide">
                  {estadoMatricula}
                </span>
              )}
            </div>
          );
        }
      },
      {
        accessorFn: (row) => row.documento,
        id: 'documento',
        header: () => 'Documento',
        cell: (info) => (
          <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {info.row.original.documento || '—'}
          </span>
        )
      },
      {
        accessorFn: (row) => row.email,
        id: 'email',
        header: () => 'Correo',
        cell: (info) => {
          const email = info.row.original.email;
          if (!email) return <span className="text-sm text-gray-400">—</span>;
          return (
            <span
              className="text-sm text-gray-700 dark:text-gray-300 block"
              style={{ textTransform: 'none', wordBreak: 'break-word' }}
              title={email.toLowerCase()}
            >
              {email.toLowerCase()}
            </span>
          );
        }
      },
      {
        accessorFn: (row) => row.creadoEn ?? row.fechaSolicitud,
        id: 'fecha',
        header: () => 'Fecha envío',
        cell: (info) => {
          const raw = info.row.original.creadoEn ?? info.row.original.fechaSolicitud;
          if (!raw) return <span className="text-sm text-gray-500">—</span>;
          const d = new Date(raw);
          return (
            <div className="flex flex-col gap-0.5 whitespace-nowrap">
              <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                {d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <span className="text-xs text-gray-400">
                {d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        }
      },
      {
        accessorFn: (row) => row.nombrePrograma,
        id: 'programa',
        header: () => 'Proceso / Programa',
        cell: (info) => (
          <span className="text-sm text-gray-700 dark:text-gray-300 block">
            {info.row.original.nombrePrograma}
          </span>
        )
      },
      {
        id: 'factura',
        header: () => 'Factura',
        cell: ({ row }) => {
          const ef = (row.original.estadoFactura ?? '').toUpperCase();
          const pagada =
            (row.original.saldoPendiente ?? 0) <= 0 &&
            ['PAGADO', 'PAGADA', 'APROBADO'].includes(ef);
          if (pagada) {
            return <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">Pagada</span>;
          }
          if (!row.original.numeroFactura) {
            return <span className="text-xs text-gray-400 whitespace-nowrap">Sin cobro</span>;
          }
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                {formatearEstadoFactura(row.original.estadoFactura)}
              </span>
              {(row.original.saldoPendiente ?? 0) > 0 && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(row.original.saldoPendiente ?? 0)}
                </span>
              )}
            </div>
          );
        }
      },
      {
        accessorFn: (row) => row.estado,
        id: 'estado',
        header: () => 'Estado',
        cell: (info) => {
          const row = info.row.original;
          const estado: EstadoSolicitudInscripcion = esSolicitudAprobada(row)
            ? 'APROBADA'
            : row.estado;
          return (
            <span className={`inline-block text-xs font-bold whitespace-nowrap px-2 py-1 rounded-md
              ${estado === 'PENDIENTE' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300' : ''}
              ${estado === 'EN_REVISION' ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300' : ''}
              ${estado === 'APROBADA' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : ''}
              ${estado === 'RECHAZADA' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300' : ''}
            `}>
              {etiquetaEstadoSolicitud[estado] ?? estado}
            </span>
          );
        }
      },
      {
        id: 'accion',
        header: () => 'Acciones',
        cell: ({ row }) => {
          const aprobado = esSolicitudAprobada(row.original);
          return (
            <div className="flex flex-col gap-1.5 w-[108px]">
              <button
                type="button"
                onClick={() => handleOpenRespuestasModal(row.original.idFactura)}
                className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-primary/10 dark:hover:bg-primary/10 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-all duration-150 w-full"
              >
                <KeenIcon icon="eye" className="text-xs shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">Ver respuesta</span>
              </button>

              {aprobado ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 w-full">
                  <KeenIcon icon="check-circle" className="text-xs text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 whitespace-nowrap">Validada</span>
                </div>
              ) : (
                <>
                  <Link
                    to={`/gestion-academica/inscripciones/solicitudes/${row.original.idSolicitud}/validar`}
                    className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary-active text-white transition-all duration-150 w-full"
                  >
                    <KeenIcon icon="check-circle" className="text-xs shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">Validar</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => confirmarEliminar(row.original.idFactura, row.original.nombreEstudiante)}
                    className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 transition-all duration-150 w-full"
                  >
                    <KeenIcon icon="trash" className="text-xs shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">Eliminar</span>
                  </button>
                </>
              )}
            </div>
          );
        }
      }
    ],
    []
  );

  return (
    <div className="card">
      <div className="card-header flex-wrap gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cambiarTab('pendientes')}
            className={`btn btn-sm ${tabActivo === 'pendientes' ? 'btn-primary' : 'btn-light'}`}
          >
            Pendientes de validar
          </button>
          <button
            type="button"
            onClick={() => cambiarTab('aprobadas')}
            className={`btn btn-sm ${tabActivo === 'aprobadas' ? 'btn-primary' : 'btn-light'}`}
          >
            Aprobadas
          </button>
        </div>
        <div className="relative" ref={sortMenuRef}>
          <button
            type="button"
            onClick={() => setShowSortMenu(v => !v)}
            className={`btn btn-sm gap-1.5 ${showSortMenu ? 'btn-primary' : 'btn-light'}`}
            title="Ordenar"
          >
            <KeenIcon icon="filter" className="text-base" />
            <span className="hidden sm:inline text-xs">
              {sortOrder === 'reciente' ? 'Más reciente' : sortOrder === 'antigua' ? 'Más antigua' : 'A–Z'}
            </span>
            <KeenIcon icon="down" className="text-xs opacity-60" />
          </button>
          {showSortMenu && (
            <div className="absolute left-0 top-full mt-1 z-50 min-w-[170px] bg-white dark:bg-coal-600 border border-gray-200 dark:border-white/10 rounded-xl shadow-lg py-1 overflow-hidden">
              {([
                { value: 'reciente', label: 'Más reciente primero', icon: 'arrow-down' },
                { value: 'antigua',  label: 'Más antigua primero',  icon: 'arrow-up' },
                { value: 'az',       label: 'Nombre A–Z',           icon: 'sort' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setSortOrder(opt.value); setShowSortMenu(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors
                    ${sortOrder === opt.value
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                >
                  <KeenIcon icon={opt.icon} className="text-base opacity-70" />
                  {opt.label}
                  {sortOrder === opt.value && <KeenIcon icon="check" className="ml-auto text-primary text-xs" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          type="text"
          placeholder="Buscar solicitud, factura, estudiante o proceso…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input input-sm max-w-xs"
        />
        <button
          type="button"
          onClick={() => cargarSolicitudes(tabActivo)}
          className="btn btn-sm btn-light"
          disabled={loading}
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="px-5 pb-2">
          <p className="p-3 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-16 card-body">
          <Spinner />
          <p className="mt-2 text-sm text-gray-500">Cargando solicitudes desde facturas académicas…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-sm text-center text-gray-500 card-body">
          {tabActivo === 'pendientes'
            ? 'No hay solicitudes pendientes de validar. Las facturas con pago aprobado aparecen en Aprobadas.'
            : 'No hay solicitudes aprobadas. Aparecen aquí cuando la factura/transacción queda en estado aprobado.'}
        </div>
      ) : (
        <div className="card-body p-0 sm:p-0">
          <div className="overflow-x-auto w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div style={{ minWidth: '800px' }}>
              <DataGrid
                key={`solicitudes-inscripcion-${tabActivo}-${sortOrder}-${deleteCount}`}
                columns={columns}
                data={filtered}
                pagination={{ size: 10 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal for form responses details preview */}
      {selectedIdFactura !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden bg-white rounded-2xl shadow-xl dark:bg-coal-600 flex flex-col max-h-[85vh] border border-gray-150 dark:border-white/10">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-base font-black text-gray-900 dark:text-white uppercase flex items-center gap-2">
                <KeenIcon icon="document-text" className="text-primary text-lg" />
                Detalle de Inscripción
              </h3>
              <button
                type="button"
                onClick={() => setSelectedIdFactura(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl font-semibold leading-none"
              >
                &times;
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto min-h-[150px] space-y-4">
              {modalLoading ? (
                <div className="flex flex-col items-center py-10">
                  <Spinner />
                  <p className="mt-3 text-sm text-gray-500">Cargando respuestas del formulario...</p>
                </div>
              ) : solicitudDetail ? (
                <div className="space-y-4">
                  {/* Datos del Aspirante */}
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-coal-500/50 dark:border-white/10 space-y-2">
                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                      Datos del Aspirante
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase block">Nombre Completo</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(() => {
                            let nameVal = solicitudDetail.estudiante?.nombreCompleto || '—';
                            if (solicitudDetail.respuestasFormulario?.respuestas) {
                              const respuestas = solicitudDetail.respuestasFormulario.respuestas;
                              const namePreg = respuestas.find((r: any) => {
                                const titleLower = (r.pregunta || '').toLowerCase();
                                return (titleLower.includes('nombre') || titleLower.includes('nombres') || titleLower.includes('completo')) && 
                                       !titleLower.includes('tutor') && !titleLower.includes('acudiente');
                              });
                              if (namePreg && namePreg.respuesta) {
                                nameVal = String(namePreg.respuesta);
                              }
                            }
                            return nameVal;
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase block">Documento de Identidad</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(() => {
                            let docVal = solicitudDetail.estudiante?.documento || '—';
                            let tipoVal = solicitudDetail.estudiante?.tipoDocumento || 'CC';
                            if (solicitudDetail.respuestasFormulario?.respuestas) {
                              const respuestas = solicitudDetail.respuestasFormulario.respuestas;
                              const docPreg = respuestas.find((r: any) => {
                                const titleLower = (r.pregunta || '').toLowerCase();
                                return (titleLower.includes('documento') || titleLower.includes('identificacion') || titleLower.includes('identificación') || titleLower.includes('número') || titleLower.includes('numero') || titleLower.includes('cc') || titleLower.includes('identidad')) && 
                                       !titleLower.includes('tutor') && !titleLower.includes('acudiente');
                              });
                              if (docPreg && docPreg.respuesta) {
                                docVal = String(docPreg.respuesta);
                              }
                              const tipoPreg = respuestas.find((r: any) => {
                                const titleLower = (r.pregunta || '').toLowerCase();
                                return titleLower.includes('tipo') && titleLower.includes('documento') && 
                                       !titleLower.includes('tutor') && !titleLower.includes('acudiente');
                              });
                              if (tipoPreg && tipoPreg.respuesta) {
                                tipoVal = String(tipoPreg.respuesta);
                              }
                            }
                            return `${tipoVal} - ${docVal}`;
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase block">Correo Electrónico</span>
                        <span className="font-semibold text-gray-900 dark:text-white break-all" style={{ textTransform: 'none' }}>
                          {(() => {
                            let emailVal = solicitudDetail.estudiante?.email || '—';
                            if (solicitudDetail.respuestasFormulario?.respuestas) {
                              const respuestas = solicitudDetail.respuestasFormulario.respuestas;
                              const emailPreg = respuestas.find((r: any) => {
                                const titleLower = (r.pregunta || '').toLowerCase();
                                return (titleLower.includes('correo') || titleLower.includes('email') || titleLower.includes('e-mail')) &&
                                       !titleLower.includes('tutor') && !titleLower.includes('acudiente');
                              });
                              if (emailPreg && emailPreg.respuesta) {
                                emailVal = String(emailPreg.respuesta);
                              }
                            }
                            return emailVal.toLowerCase();
                          })()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase block">Teléfono / Celular</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {(() => {
                            let phoneVal = solicitudDetail.estudiante?.celular || solicitudDetail.estudiante?.telefono || '—';
                            if (solicitudDetail.respuestasFormulario?.respuestas) {
                              const respuestas = solicitudDetail.respuestasFormulario.respuestas;
                              const phonePreg = respuestas.find((r: any) => {
                                const titleLower = (r.pregunta || '').toLowerCase();
                                return (titleLower.includes('teléfono') || titleLower.includes('telefono') || titleLower.includes('celular') || titleLower.includes('móvil') || titleLower.includes('movil')) && 
                                       !titleLower.includes('tutor') && !titleLower.includes('acudiente');
                              });
                              if (phonePreg && phonePreg.respuesta) {
                                phoneVal = String(phonePreg.respuesta);
                              }
                            }
                            return phoneVal;
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {solicitudDetail.respuestasFormulario ? (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2 px-1">
                        <KeenIcon icon="document-text" className="text-primary text-base shrink-0" />
                        <span className="text-xs font-bold text-primary uppercase tracking-wide">
                          {solicitudDetail.respuestasFormulario.formulario}
                        </span>
                      </div>
                      <div className="divide-y divide-gray-100 dark:divide-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-coal-500">
                        {solicitudDetail.respuestasFormulario.respuestas.map((r: any, i: number) => {
                          const respuestaStr = typeof r.respuesta === 'string' ? r.respuesta.trim() : (r.respuesta ? String(r.respuesta).trim() : '');
                          const tieneRespuesta = respuestaStr !== '';
                          const esArchivo = tieneRespuesta && (
                            respuestaStr.startsWith('http://') ||
                            respuestaStr.startsWith('https://') ||
                            respuestaStr.startsWith('/storage') ||
                            respuestaStr.includes('/storage/') ||
                            respuestaStr.includes('formulario_adjuntos')
                          );
                          return (
                            <div key={i} className={`flex items-start gap-3 px-4 py-3 ${!tieneRespuesta ? 'opacity-60' : ''}`}>
                              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${tieneRespuesta ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`} />
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block leading-tight">
                                  {r.pregunta}
                                </span>
                                <div className="mt-0.5">
                                  {esArchivo ? (
                                    <a
                                      href={respuestaStr.startsWith('/') ? `${window.location.origin}${respuestaStr}` : respuestaStr}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-xs"
                                    >
                                      <KeenIcon icon="document" className="text-sm" />
                                      Ver adjunto
                                    </a>
                                  ) : tieneRespuesta ? (
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white break-words">
                                      {respuestaStr}
                                    </span>
                                  ) : (
                                    <span className="text-xs italic text-gray-400 dark:text-gray-500">Sin respuesta</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 gap-2">
                      <KeenIcon icon="document-text" className="text-gray-300 text-3xl" />
                      <p className="text-sm text-gray-400">Sin respuestas de formulario para esta solicitud.</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-center text-gray-500 py-10">
                  No se encontraron respuestas registradas en el formulario para esta solicitud.
                </p>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedIdFactura(null)}
                className="btn btn-sm btn-light"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-coal-600 rounded-2xl shadow-2xl border border-gray-150 dark:border-white/10 overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-gray-200 dark:border-white/10">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                <KeenIcon icon="trash" className="text-red-600 dark:text-red-400 text-xl" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">
                  Eliminar solicitud
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                ¿Estás seguro de que deseas eliminar la solicitud de{' '}
                <span className="font-bold text-gray-900 dark:text-white">{confirmDelete.nombre}</span>?
              </p>
            </div>
            <div className="flex gap-3 p-5 pt-0 justify-end">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="btn btn-sm btn-light"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarEliminar}
                disabled={deleting}
                className="btn btn-sm btn-danger"
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Eliminando…
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <KeenIcon icon="trash" />
                    Sí, eliminar
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolicitudesInscripcionContent;
