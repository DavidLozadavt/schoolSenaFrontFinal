import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { KeenIcon } from '@/components';
import { Container } from '@/components/container';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import { getAsistenciaDocumentUrl } from '@/utils/asistenciaDocumentUrl';

interface JustificacionPendiente {
  id: number;
  tipo?: 'individual' | 'rango';
  idJustificacion?: number;
  idAsistencia?: number;
  estado?: string;
  observacion?: string | null;
  fechaClase?: string | null;
  fechaInicial?: string | null;
  fechaFinal?: string | null;
  fecha?: string | null;
  estudiante?: {
    nombre?: string;
    identificacion?: string;
    rutaFotoUrl?: string | null;
  };
  nombreEstudiante?: string;
  identificacionEstudiante?: string;
  nombreArea?: string;
  nombreMateria?: string;
  codigoFicha?: string;
  excusa?: {
    tipoExcusa?: string;
    observacion?: string | null;
    urlDocumento?: string | null;
    fechaInicialJustificacion?: string | null;
    fechaFinalJustificacion?: string | null;
  };
}

const extraerLista = (payload: unknown): JustificacionPendiente[] => {
  if (Array.isArray(payload)) return payload as JustificacionPendiente[];
  const data = payload as { data?: unknown };
  if (Array.isArray(data?.data)) return data.data as JustificacionPendiente[];
  const nested = data?.data as { data?: unknown };
  if (Array.isArray(nested?.data)) return nested.data as JustificacionPendiente[];
  return [];
};

const nombreEstudiante = (j: JustificacionPendiente): string =>
  j.estudiante?.nombre || j.nombreEstudiante || 'Estudiante';

const identificacionEstudiante = (j: JustificacionPendiente): string =>
  j.estudiante?.identificacion || j.identificacionEstudiante || '—';

const fechaClase = (j: JustificacionPendiente): string => j.fechaClase || j.fecha || '';

const formatearFecha = (fechaStr: string | null | undefined): string => {
  if (!fechaStr) return '—';
  try {
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return fechaStr;
    return fecha.toLocaleDateString('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return fechaStr;
  }
};

export interface JustificacionesInstructorPageProps {
  embedded?: boolean;
  idFicha?: number;
  idHorarioMateria?: number;
}

const JustificacionesInstructorPage: React.FC<JustificacionesInstructorPageProps> = ({
  embedded = false,
  idFicha,
  idHorarioMateria
}) => {
  const { currentLayout } = useLayout();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<JustificacionPendiente[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<JustificacionPendiente | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

  const fetchPendientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (idFicha) params.id_ficha = String(idFicha);
      if (idHorarioMateria) params.id_horario_materia = String(idHorarioMateria);
      const response = await axios.get('justificaciones-pendientes-instructor', { params });
      setItems(extraerLista(response.data));
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; error?: string } } };
      setError(
        ax?.response?.data?.message ||
          ax?.response?.data?.error ||
          'No se pudieron cargar las justificaciones pendientes.'
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [idFicha, idHorarioMateria]);

  useEffect(() => {
    fetchPendientes();
  }, [fetchPendientes]);

  const responder = async (item: JustificacionPendiente, accion: 'aprobar' | 'denegar') => {
    let observacionInstructor = '';

    if (accion === 'denegar') {
      const result = await Swal.fire({
        title: 'Denegar justificación',
        input: 'textarea',
        inputLabel: 'Motivo del rechazo (opcional)',
        inputPlaceholder: 'Indica por qué se deniega la justificación...',
        showCancelButton: true,
        confirmButtonText: 'Denegar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626'
      });
      if (!result.isConfirmed) return;
      observacionInstructor = result.value?.trim() || '';
    } else {
      const confirm = await Swal.fire({
        title: '¿Aprobar justificación?',
        text: `Se aprobará la falta de ${nombreEstudiante(item)}.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Aprobar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#16a34a'
      });
      if (!confirm.isConfirmed) return;
    }

    setProcesandoId(item.id);
    try {
      await axios.post('responder-justificacion-asistencia', {
        idJustificacion: item.idJustificacion || item.id,
        tipoJustificacion: item.tipo || 'individual',
        accion,
        observacionInstructor
      });

      await Swal.fire({
        icon: 'success',
        title: accion === 'aprobar' ? 'Justificación aprobada' : 'Justificación denegada',
        timer: 2000,
        showConfirmButton: false
      });

      setDetalle(null);
      fetchPendientes();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; error?: string } } };
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          ax?.response?.data?.message ||
          ax?.response?.data?.error ||
          'No se pudo procesar la solicitud.'
      });
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <>
      {!embedded && currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                Revisa y responde las solicitudes de justificación de inasistencia de tus aprendices
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className={embedded ? '' : 'py-4'}>
          {error && (
            <div
              className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200"
              role="alert"
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 p-10 text-center">
              <KeenIcon icon="check-circle" className="text-4xl text-green-500 mb-3" />
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                No hay justificaciones pendientes
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Cuando un aprendiz envíe una justificación, aparecerá aquí y recibirás una notificación.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 p-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {item.tipo === 'rango' ? (
                          <span className="inline-flex items-center gap-1 rounded bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                            <KeenIcon icon="calendar" className="text-[10px]" />
                            Rango de fechas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-gray-100 dark:bg-coal-300 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            <KeenIcon icon="calendar-tick" className="text-[10px]" />
                            Falta individual
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white truncate mt-1">
                        {nombreEstudiante(item)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {identificacionEstudiante(item)}
                        {item.codigoFicha ? ` · Ficha ${item.codigoFicha}` : ''}
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                        {item.tipo === 'rango' ? (
                          <>
                            <span className="font-medium">Periodo de permiso:</span>{' '}
                            {formatearFecha(item.fechaInicial)} al {formatearFecha(item.fechaFinal)}
                          </>
                        ) : (
                          <>
                            <span className="font-medium">{item.nombreArea || item.nombreMateria || 'Clase'}</span>
                            {' · '}
                            {formatearFecha(fechaClase(item))}
                          </>
                        )}
                      </p>
                      {item.excusa?.tipoExcusa && (
                        <span className="inline-flex mt-2 items-center rounded-md bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-300">
                          {item.excusa.tipoExcusa}
                        </span>
                      )}
                      {item.excusa?.observacion && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {item.excusa.observacion}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        className="btn btn-sm btn-light"
                        onClick={() => setDetalle(item)}
                      >
                        Ver detalle
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        disabled={procesandoId === item.id}
                        onClick={() => responder(item, 'aprobar')}
                      >
                        {procesandoId === item.id ? '...' : 'Aprobar'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        disabled={procesandoId === item.id}
                        onClick={() => responder(item, 'denegar')}
                      >
                        Denegar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>

      {detalle && (
        <Modal open={true} onClose={() => setDetalle(null)}>
          <ModalContent className="max-w-[520px] top-[10%] p-4">
            <ModalHeader>
              <ModalTitle>Detalle de justificación</ModalTitle>
              <button
                type="button"
                className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                onClick={() => setDetalle(null)}
              >
                <KeenIcon icon="cross" />
              </button>
            </ModalHeader>
            <ModalBody className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Estudiante</p>
                <p className="text-sm font-medium">{nombreEstudiante(detalle)}</p>
              </div>
              
              {detalle.tipo === 'rango' ? (
                <div>
                  <p className="text-xs text-gray-500">Periodo de permiso</p>
                  <p className="text-sm">
                    Del {formatearFecha(detalle.fechaInicial)} al {formatearFecha(detalle.fechaFinal)}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-500">Fecha de clase</p>
                  <p className="text-sm">{formatearFecha(fechaClase(detalle))}</p>
                </div>
              )}

              {detalle.excusa?.tipoExcusa && (
                <div>
                  <p className="text-xs text-gray-500">Tipo de excusa</p>
                  <p className="text-sm">{detalle.excusa.tipoExcusa}</p>
                </div>
              )}
              {detalle.excusa?.observacion && (
                <div>
                  <p className="text-xs text-gray-500">Observación del aprendiz</p>
                  <p className="text-sm">{detalle.excusa.observacion}</p>
                </div>
              )}
              {detalle.excusa?.urlDocumento && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Documento</p>
                  <a
                    href={getAsistenciaDocumentUrl(detalle.excusa.urlDocumento) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    <KeenIcon icon="file" className="text-sm" />
                    Ver documento de soporte
                  </a>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  disabled={procesandoId === detalle.id}
                  onClick={() => responder(detalle, 'aprobar')}
                >
                  Aprobar
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  disabled={procesandoId === detalle.id}
                  onClick={() => responder(detalle, 'denegar')}
                >
                  Denegar
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default JustificacionesInstructorPage;
