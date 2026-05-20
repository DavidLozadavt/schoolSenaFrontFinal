import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { KeenIcon } from '@/components';
import { Container } from '@/components/container';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import { Toolbar, ToolbarDescription, ToolbarHeading } from '@/partials/toolbar';
import { useLayout } from '@/providers';
import JustificarFaltaModal, { type RegistroParaJustificar } from '@/pages/asistencias/JustificarFaltaModal';
import { getAsistenciaDocumentUrl } from '@/utils/asistenciaDocumentUrl';

interface AreaData {
  idArea: number;
  nombreArea: string;
  asistencias: number;
  inasistencias: number;
  total: number;
  porcentaje: number;
}

interface JustificacionData {
  id: number;
  estado: string; // PENDIENTE | APROBADA | RECHAZADA
  observacion: string | null;
  excusa: {
    id: number;
    tipoExcusa: string;
    observacion: string | null;
    fechaInicialJustificacion: string | null;
    fechaFinalJustificacion: string | null;
    urlDocumento: string | null;
  };
}

interface RegistroDetallado {
  fecha: string;
  idArea: number;
  nombreArea: string;
  asistio: boolean;
  estado: string;
  idAsistencia?: number;
  justificacion?: JustificacionData;
  estadoJustificacion?: string | null;
  puedeJustificar?: boolean;
}

interface ResumenData {
  asistenciaGeneral: number;
  totalAsistencias: number;
  totalInasistencias: number;
  totalRegistros: number;
}

interface ReporteAsistenciasProps {
  onVolver: () => void;
}

const ReporteAsistencias: React.FC<ReporteAsistenciasProps> = ({ onVolver }) => {
  const { currentLayout } = useLayout();
  const [loading, setLoading] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [registros, setRegistros] = useState<RegistroDetallado[]>([]);
  const [resumen, setResumen] = useState<ResumenData>({
    asistenciaGeneral: 0,
    totalAsistencias: 0,
    totalInasistencias: 0,
    totalRegistros: 0
  });
  const [areaSeleccionada, setAreaSeleccionada] = useState<number | null>(null);
  const [justificacionSeleccionada, setJustificacionSeleccionada] = useState<JustificacionData | null>(null);
  const [registroParaJustificar, setRegistroParaJustificar] = useState<RegistroParaJustificar | null>(null);
  const [modalJustificarAbierto, setModalJustificarAbierto] = useState(false);
  const [justificarModo, setJustificarModo] = useState<'individual' | 'rango'>('individual');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const fetchAsistencias = useCallback(async () => {
    try {
      setLoading(true);
      setErrorCarga(null);
      const response = await axios.get('asistencias-por-area');
      const data = response.data?.data || {};

      setAreas(data.areas || []);
      setRegistros(data.registros || []);
      setResumen(
        data.resumen || {
          asistenciaGeneral: 0,
          totalAsistencias: 0,
          totalInasistencias: 0,
          totalRegistros: 0
        }
      );
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; error?: string } } };
      const mensaje =
        ax?.response?.data?.message ||
        ax?.response?.data?.error ||
        'No se pudo cargar el reporte. Verifica tu sesión o intenta más tarde.';
      setErrorCarga(mensaje);
      setAreas([]);
      setRegistros([]);
      setResumen({
        asistenciaGeneral: 0,
        totalAsistencias: 0,
        totalInasistencias: 0,
        totalRegistros: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAsistencias();
  }, [fetchAsistencias]);

  const formatearFecha = (fechaStr: string): string => {
    if (!fechaStr) return '';
    
    try {
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) {
        return fechaStr;
      }
      
      const meses = [
        'ene', 'feb', 'mar', 'abr', 'may', 'jun',
        'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
      ];
      
      const diasSemana = [
        'dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'
      ];
      
      return `${diasSemana[fecha.getDay()]}, ${fecha.getDate()} ${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
    } catch (error) {
      return fechaStr;
    }
  };

  const registrosFiltrados = areaSeleccionada 
    ? registros.filter(r => r.idArea === areaSeleccionada)
    : registros;

  const resumenFiltrado = useMemo<ResumenData>(() => {
    if (areaSeleccionada === null) {
      return resumen;
    }

    const totalAsistencias = registrosFiltrados.filter((registro) => registro.asistio).length;
    // Las justificadas SÍ cuentan como inasistencias
    const totalInasistencias = registrosFiltrados.filter((registro) => !registro.asistio).length;
    const totalRegistros = registrosFiltrados.length;

    return {
      asistenciaGeneral:
        totalRegistros > 0 ? Math.round((totalAsistencias / totalRegistros) * 100) : 0,
      totalAsistencias,
      totalInasistencias,
      totalRegistros
    };
  }, [areaSeleccionada, registrosFiltrados, resumen]);

  const areasUnicas = [
    { id: null, nombre: 'Todas las áreas' },
    ...areas.map(a => ({ id: a.idArea, nombre: a.nombreArea }))
  ];

  const puedeJustificarRegistro = (registro: RegistroDetallado): boolean => {
    if (registro.asistio) return false;
    if (!registro.idAsistencia) return false;
    const estadoJ =
      registro.estadoJustificacion?.toUpperCase() ||
      registro.justificacion?.estado?.toUpperCase();
    if (estadoJ === 'PENDIENTE' || estadoJ === 'APROBADO' || estadoJ === 'APROBADA' || estadoJ === 'ACEPTADO' || estadoJ === 'JUSTIFICADO') {
      return false;
    }
    if (registro.estado === 'Inasistencia Justificada' && estadoJ !== 'RECHAZADO' && estadoJ !== 'RECHAZADA') {
      return false;
    }
    return registro.puedeJustificar !== false;
  };

  const abrirJustificar = (registro?: RegistroDetallado) => {
    if (registro?.idAsistencia) {
      setJustificarModo('individual');
      setRegistroParaJustificar({
        idAsistencia: registro.idAsistencia,
        fecha: registro.fecha,
        nombreArea: registro.nombreArea
      });
    } else {
      setJustificarModo('rango');
      setRegistroParaJustificar(null);
    }
    setModalJustificarAbierto(true);
  };

  const renderEstadoRegistro = (registro: RegistroDetallado) => {
    const estadoJ =
      registro.estadoJustificacion?.toUpperCase() ||
      registro.justificacion?.estado?.toUpperCase();

    if (estadoJ === 'PENDIENTE') {
      return (
        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-600 dark:text-amber-400">
          <KeenIcon icon="time" className="text-[10px]" />
          Pendiente de aprobación
        </span>
      );
    }

    if (estadoJ === 'RECHAZADO' || estadoJ === 'RECHAZADA') {
      return (
        <span className="inline-flex flex-col items-start gap-1">
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-red-600 dark:text-red-400">
            <KeenIcon icon="cross" className="text-[10px]" />
            Justificación rechazada
          </span>
          {puedeJustificarRegistro(registro) && (
            <button
              type="button"
              onClick={() => abrirJustificar(registro)}
              className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Volver a solicitar
            </button>
          )}
        </span>
      );
    }

    if (
      registro.estado === 'Inasistencia Justificada' ||
      estadoJ === 'APROBADO' ||
      estadoJ === 'APROBADA' ||
      estadoJ === 'ACEPTADO' ||
      estadoJ === 'JUSTIFICADO'
    ) {
      return (
        <button
          type="button"
          onClick={() => {
            if (registro.justificacion) setJustificacionSeleccionada(registro.justificacion);
          }}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-yellow-600 dark:text-yellow-400 hover:underline cursor-pointer"
        >
          <KeenIcon icon="check" className="text-[10px]" />
          Inasistencia justificada
        </button>
      );
    }

    if (!registro.asistio) {
      return (
        <span className="inline-flex flex-col items-start gap-1">
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-red-600 dark:text-red-400">
            <KeenIcon icon="cross" className="text-[10px]" />
            Ausente
          </span>
          {puedeJustificarRegistro(registro) && (
            <button
              type="button"
              onClick={() => abrirJustificar(registro)}
              className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Justificar falta
            </button>
          )}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-medium text-blue-600 dark:text-blue-400">
        <KeenIcon icon="check" className="text-[10px]" />
        Presente
      </span>
    );
  };

  return (
    <>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <button 
                className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-transparent hover:bg-gray-100 dark:hover:bg-coal-300 rounded-lg px-2 py-1.5 -ml-2 mb-3"
                onClick={onVolver}
                title="Volver a clases"
              >
                <KeenIcon icon="arrow-left" className="text-sm" />
                <span className="text-sm font-medium">Volver a clases</span>
              </button>
              <div className="flex items-center gap-2">
                <KeenIcon icon="chart-line-up" className="text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Control de Asistencia</h1>
              </div>
              <ToolbarDescription>
                Registro de asistencias por área. En cada inasistencia puedes solicitar justificación para que tu instructor la apruebe.
              </ToolbarDescription>
            </ToolbarHeading>
            <div className="flex gap-2">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => abrirJustificar()}
              >
                <KeenIcon icon="calendar-add" />
                Solicitar permiso por fechas
              </button>
            </div>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className="py-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {mensajeExito && (
                <div
                  className="mb-4 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs text-green-800 dark:border-green-700 dark:bg-green-950/40 dark:text-green-200"
                  role="status"
                >
                  {mensajeExito}
                </div>
              )}
              {errorCarga && (
                <div
                  className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200"
                  role="alert"
                >
                  {errorCarga}
                </div>
              )}
              {/* Tabs de filtro por área */}
              <div className="flex flex-wrap gap-2 mb-5 border-b border-gray-200 dark:border-gray-700 pb-3">
                {areasUnicas.map((area) => {
                  const isSelected = areaSeleccionada === area.id || (areaSeleccionada === null && area.id === null);
                  return (
                    <button
                      key={area.id ?? 'todas'}
                      onClick={() => setAreaSeleccionada(area.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500 dark:border-blue-400'
                          : 'bg-gray-100 dark:bg-coal-300 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-coal-200 border-2 border-transparent'
                      }`}
                    >
                      {area.nombre}
                    </button>
                  );
                })}
              </div>

              {/* Tarjetas de resumen */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
                <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <KeenIcon icon="chart-pie-simple" className="text-blue-600 dark:text-blue-400 text-base" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Asistencia General</p>
                      <p className="text-base font-bold text-blue-600 dark:text-blue-400">{resumenFiltrado.asistenciaGeneral}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <KeenIcon icon="check" className="text-green-700 dark:text-green-500 text-base" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Asistencias</p>
                      <p className="text-base font-bold text-green-700 dark:text-green-500">{resumenFiltrado.totalAsistencias}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <KeenIcon icon="cross" className="text-red-700 dark:text-red-500 text-base" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Inasistencias</p>
                      <p className="text-base font-bold text-red-700 dark:text-red-500">{resumenFiltrado.totalInasistencias}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <KeenIcon icon="calendar" className="text-gray-600 dark:text-gray-400 text-base" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Total Registros</p>
                      <p className="text-base font-bold text-gray-600 dark:text-gray-400">{resumenFiltrado.totalRegistros}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2.5">
                  Registro Detallado
                </h3>
                <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 overflow-hidden">
                  <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-coal-300 sticky top-0 z-10">
                        <tr>
                          <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase">
                            FECHA
                          </th>
                          <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase">
                            ÁREA
                          </th>
                          <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase">
                            ESTADO
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {registrosFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-2.5 py-7 text-center text-xs text-gray-500 dark:text-gray-400">
                              No hay registros disponibles
                            </td>
                          </tr>
                        ) : (
                          registrosFiltrados.map((registro, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-coal-300">
                              <td className="px-2.5 py-2 text-[12px] text-gray-900 dark:text-white whitespace-nowrap">
                                {formatearFecha(registro.fecha)}
                              </td>
                              <td className="px-2.5 py-2 text-[12px] text-gray-700 dark:text-gray-300">
                                {registro.nombreArea}
                              </td>
                              <td className="px-2.5 py-2 whitespace-nowrap">
                                {renderEstadoRegistro(registro)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Container>

      {/* Modal de detalles de justificación */}
      {justificacionSeleccionada && (
        <Modal open={true} onClose={() => setJustificacionSeleccionada(null)}>
          <ModalContent className="max-w-[500px] top-[15%] p-4">
            <ModalHeader>
              <ModalTitle>Detalle de Justificación</ModalTitle>
              <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={() => setJustificacionSeleccionada(null)}>
                <KeenIcon icon="cross" />
              </button>
            </ModalHeader>
            <ModalBody className="py-5 space-y-4">
              {justificacionSeleccionada.excusa?.tipoExcusa && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Tipo de Excusa</p>
                  <p className="text-sm text-gray-900 dark:text-white">{justificacionSeleccionada.excusa.tipoExcusa}</p>
                </div>
              )}

              {justificacionSeleccionada.excusa?.observacion && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Observación</p>
                  <p className="text-sm text-gray-900 dark:text-white">{justificacionSeleccionada.excusa.observacion}</p>
                </div>
              )}

              {justificacionSeleccionada.excusa?.urlDocumento && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Documento de Soporte</p>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const originalUrl = justificacionSeleccionada.excusa.urlDocumento;
                      // Si la URL ya es completa y empieza con /excusas/, convertir a /storage/excusas/
                      let docUrl: string | null = originalUrl;
                      if (originalUrl && originalUrl.startsWith('http://')) {
                        try {
                          const urlObj = new URL(originalUrl);
                          if (urlObj.pathname.startsWith('/excusas/')) {
                            const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
                            docUrl = base + '/storage' + urlObj.pathname;
                          } else if (urlObj.pathname.startsWith('/storage/')) {
                            // Si ya tiene /storage/, solo corregir el puerto si es necesario
                            if (urlObj.hostname === 'localhost' && !urlObj.port) {
                              const base = (axios.defaults.baseURL || window.location.origin).replace(/\/api\/?$/, '');
                              docUrl = base + urlObj.pathname;
                            } else {
                              docUrl = originalUrl;
                            }
                          } else {
                            docUrl = originalUrl;
                          }
                        } catch {
                          docUrl = originalUrl;
                        }
                      } else if (originalUrl && !originalUrl.startsWith('http')) {
                        // Si es una ruta relativa, usar getDocumentUrl
                        docUrl = getAsistenciaDocumentUrl(originalUrl);
                      }
                      return docUrl ? (
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.preventDefault();
                            if (docUrl) {
                              window.open(docUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium cursor-pointer"
                        >
                          <KeenIcon icon="file-pdf" className="w-4 h-4 text-red-500 dark:text-red-400" />
                          Ver PDF
                        </a>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      <JustificarFaltaModal
        open={modalJustificarAbierto}
        registro={registroParaJustificar}
        modo={justificarModo}
        onClose={() => {
          setModalJustificarAbierto(false);
          setRegistroParaJustificar(null);
        }}
        onSuccess={() => {
          setMensajeExito('Solicitud enviada. Tu instructor la revisará pronto.');
          fetchAsistencias();
          setTimeout(() => setMensajeExito(null), 5000);
        }}
      />
    </>
  );
};

export default ReporteAsistencias;
