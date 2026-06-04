import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import Spinner from '@/components/loaders/Spinner';
import {
  esSolicitudAprobada,
  esSolicitudPendienteValidacion,
  EstadoSolicitudInscripcion,
  SolicitudInscripcion
} from './solicitudInscripcionTypes';
import { fetchSolicitudesInscripcion, fetchSolicitudInscripcionDetalle } from './validacionInscripcionApi';

const formatearEstadoFactura = (estado?: string) => {
  if (!estado) return '—';
  if (estado === 'PAGADO') return 'PAGADA';
  return estado;
};

const estilosEstadoSolicitud: Record<EstadoSolicitudInscripcion, string> = {
  PENDIENTE: 'text-amber-700 dark:text-amber-300',
  EN_REVISION: 'text-sky-700 dark:text-sky-300',
  APROBADA: 'text-emerald-700 dark:text-emerald-300',
  RECHAZADA: 'text-red-700 dark:text-red-300'
};

const etiquetaEstadoSolicitud: Record<EstadoSolicitudInscripcion, string> = {
  PENDIENTE: 'Pendiente',
  EN_REVISION: 'En revisión',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada'
};

type TabListado = 'pendientes' | 'aprobadas';

const SolicitudesInscripcionContent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabInicial = searchParams.get('tab') === 'aprobadas' ? 'aprobadas' : 'pendientes';
  const [tab, setTab] = useState<TabListado>(tabInicial);
  const [searchTerm, setSearchTerm] = useState('');
  const [todasLasSolicitudes, setTodasLasSolicitudes] = useState<SolicitudInscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const cargarSolicitudes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchSolicitudesInscripcion('TODOS');
      setTodasLasSolicitudes(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las solicitudes. Verifique su sesión e intente de nuevo.');
      setTodasLasSolicitudes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  useEffect(() => {
    setSearchParams(tab === 'aprobadas' ? { tab: 'aprobadas' } : {}, { replace: true });
  }, [tab, setSearchParams]);

  const solicitudesPorTab = useMemo(() => {
    if (tab === 'aprobadas') {
      return todasLasSolicitudes.filter(esSolicitudAprobada);
    }
    return todasLasSolicitudes.filter(
      (s) => esSolicitudPendienteValidacion(s) && !esSolicitudAprobada(s)
    );
  }, [tab, todasLasSolicitudes]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return solicitudesPorTab;
    return solicitudesPorTab.filter(
      (s) =>
        s.numeroSolicitud.toLowerCase().includes(term) ||
        (s.numeroFactura ?? '').toLowerCase().includes(term) ||
        s.nombreEstudiante.toLowerCase().includes(term) ||
        s.documento.includes(term) ||
        s.nombrePrograma.toLowerCase().includes(term)
    );
  }, [searchTerm, solicitudesPorTab]);

  const columns = useMemo<ColumnDef<SolicitudInscripcion>[]>(
    () => [
      {
        accessorFn: (row) => row.numeroSolicitud,
        id: 'numero',
        header: () => 'Solicitud',
        cell: (info) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {info.row.original.numeroSolicitud}
              </span>
              {info.row.original.editado && (
                <span 
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  title={`Editado el ${info.row.original.fechaEditado}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Editado
                </span>
              )}
            </div>
            {info.row.original.numeroFactura && (
              <span className="block text-xs text-gray-500">
                Factura {info.row.original.numeroFactura}
              </span>
            )}
            {info.row.original.editado && info.row.original.fechaEditado && (
              <span className="text-[10px] text-amber-650 dark:text-amber-450 font-bold uppercase tracking-wider">
                Modificado: {new Date(info.row.original.fechaEditado).toLocaleString()}
              </span>
            )}
          </div>
        )
      },
      {
        accessorFn: (row) => row.nombreEstudiante,
        id: 'estudiante',
        header: () => 'Estudiante',
        cell: (info) => (
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {info.row.original.nombreEstudiante}
          </span>
        )
      },
      {
        accessorFn: (row) => row.documento,
        id: 'documento',
        header: () => 'Documento estudiante',
        cell: (info) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {info.row.original.documento || '—'}
          </span>
        )
      },
      {
        accessorFn: (row) => row.email,
        id: 'email',
        header: () => 'Correo estudiante',
        cell: (info) => (
          <span className="text-sm text-gray-700 dark:text-gray-300 break-all">
            {info.row.original.email || '—'}
          </span>
        )
      },
      {
        accessorFn: (row) => row.nombrePrograma,
        id: 'programa',
        header: () => 'Proceso / programa',
        cell: (info) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {info.row.original.nombrePrograma}
          </span>
        )
      },
      {
        id: 'factura',
        header: () => 'Estado factura',
        cell: ({ row }) => {
          const ef = (row.original.estadoFactura ?? '').toUpperCase();
          const pagada =
            (row.original.saldoPendiente ?? 0) <= 0 &&
            ['PAGADO', 'PAGADA', 'APROBADO'].includes(ef);
          if (pagada) {
            return <span className="text-xs font-medium text-emerald-700">PAGADA</span>;
          }
          if (!row.original.numeroFactura) {
            return <span className="text-xs text-gray-500">Sin cobro</span>;
          }
          return (
            <span className="text-xs font-medium">
              {formatearEstadoFactura(row.original.estadoFactura)}
              {(row.original.saldoPendiente ?? 0) > 0 &&
                ` · ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(row.original.saldoPendiente ?? 0)}`}
            </span>
          );
        }
      },
      {
        accessorFn: (row) => row.estado,
        id: 'estado',
        header: () => 'Estado solicitud',
        cell: (info) => {
          const row = info.row.original;
          const estado: EstadoSolicitudInscripcion = esSolicitudAprobada(row)
            ? 'APROBADA'
            : row.estado;
          return (
            <span className={`text-xs font-bold uppercase ${estilosEstadoSolicitud[estado] ?? ''}`}>
              {etiquetaEstadoSolicitud[estado] ?? estado}
            </span>
          );
        }
      },
      {
        id: 'accion',
        header: () => '',
        cell: ({ row }) => {
          const aprobado = esSolicitudAprobada(row.original);
          return (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenRespuestasModal(row.original.idFactura)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase rounded-lg border border-gray-200 dark:border-white/10 bg-white hover:bg-gray-50 dark:bg-coal-500 hover:text-primary dark:hover:text-primary"
              >
                <KeenIcon icon="document-text" />
                Ver Respuestas
              </button>
              {aprobado ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase text-emerald-700">
                  <KeenIcon icon="check-circle" />
                  Validada
                </span>
              ) : (
                <Link
                  to={`/gestion-academica/inscripciones/solicitudes/${row.original.idSolicitud}/validar`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white uppercase rounded-lg bg-primary hover:bg-primary-active"
                >
                  <KeenIcon icon="check-circle" />
                  Validar solicitud
                </Link>
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
            onClick={() => setTab('pendientes')}
            className={`btn btn-sm ${tab === 'pendientes' ? 'btn-primary' : 'btn-light'}`}
          >
            Pendientes de validar
          </button>
          <button
            type="button"
            onClick={() => setTab('aprobadas')}
            className={`btn btn-sm ${tab === 'aprobadas' ? 'btn-primary' : 'btn-light'}`}
          >
            Aprobadas
          </button>
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
          onClick={cargarSolicitudes}
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
          {tab === 'pendientes'
            ? 'No hay solicitudes pendientes de validar. Las facturas con pago aprobado aparecen en Aprobadas.'
            : 'No hay solicitudes aprobadas. Aparecen aquí cuando la factura/transacción queda en estado aprobado.'}
        </div>
      ) : (
        <div className="card-body">
          <DataGrid columns={columns} data={filtered} pagination={{ size: 10 }} />
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
                        <span className="font-semibold text-gray-900 dark:text-white break-all">
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
                            return emailVal;
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
                    <div className="space-y-4 pt-2">
                      <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-lg text-xs font-bold uppercase">
                        Formulario: {solicitudDetail.respuestasFormulario.formulario}
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {solicitudDetail.respuestasFormulario.respuestas.map((r: any, i: number) => {
                          const respuestaStr = typeof r.respuesta === 'string' ? r.respuesta : (r.respuesta ? String(r.respuesta) : '');
                          const esArchivo = respuestaStr && (
                            respuestaStr.startsWith('http://') ||
                            respuestaStr.startsWith('https://') ||
                            respuestaStr.startsWith('/storage') ||
                            respuestaStr.includes('/storage/') ||
                            respuestaStr.includes('formulario_adjuntos')
                          );
                          return (
                            <div key={i} className="p-3 border border-gray-200 rounded-lg bg-white dark:bg-coal-500 dark:border-white/10">
                              <span className="text-[10px] font-bold text-gray-500 uppercase block">{r.pregunta}</span>
                              <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white break-words">
                                {esArchivo ? (
                                  <a
                                    href={respuestaStr.startsWith('/') ? `${window.location.origin}${respuestaStr}` : respuestaStr}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-primary hover:underline font-bold text-xs uppercase"
                                  >
                                    <KeenIcon icon="document" />
                                    Ver adjunto / Descargar
                                  </a>
                                ) : (
                                  respuestaStr || '—'
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-center text-gray-500 py-6">
                      No se encontraron respuestas registradas en el formulario para esta solicitud.
                    </p>
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
    </div>
  );
};

export default SolicitudesInscripcionContent;
