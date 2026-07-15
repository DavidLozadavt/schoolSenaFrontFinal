import { KeenIcon, Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import Select from 'react-select';
import { Calendario } from '../programas-academicos/components/malla-curricular/Calendario';

interface SolicitudInstructorAceptarProps {
  modalAccept: boolean;
  setModalAccept: (open: boolean) => void;
  acceptFormik: any;
  selectedSolicitud: any;
}

const ESTADOS_COMPETENCIA_COMPLETADA = new Set([
  'COMPLETADO',
  'COMPLETADA',
  'FINALIZADO',
  'FINALIZADA',
  'CERRADO',
  'CERRADA'
]);

const competenciaEstaCompletada = (mat: any): boolean => {
  if (mat?.isCompleta === true) return true;
  const estado = String(mat?.estado ?? '')
    .trim()
    .toUpperCase();
  return ESTADOS_COMPETENCIA_COMPLETADA.has(estado);
};

const resolverIdPrograma = (solicitud: any): number | undefined => {
  const raw =
    solicitud?.ficha?.asignacion?.idPrograma ??
    solicitud?.ficha?.aperturarPrograma?.idPrograma ??
    solicitud?.ficha?.asignacion?.programa?.id ??
    solicitud?.ficha?.aperturarPrograma?.programa?.id ??
    solicitud?.idPrograma;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const SolicitudInstructorAceptar = ({
  modalAccept,
  setModalAccept,
  acceptFormik,
  selectedSolicitud
}: SolicitudInstructorAceptarProps) => {
  const [materias, setMaterias] = useState<any[]>([]);
  const [instructores, setInstructores] = useState<any[]>([]);
  const [loadingMaterias, setLoadingMaterias] = useState(false);
  const [loadingInstructores, setLoadingInstructores] = useState(false);
  const [loadingHorario, setLoadingHorario] = useState(false);
  const [showCalendario, setShowCalendario] = useState(false);
  const [instructorHorario, setInstructorHorario] = useState<any[]>([]);
  const [instructorCalendario, setInstructorCalendario] = useState<any>(null);

  useEffect(() => {
    if (!modalAccept || !selectedSolicitud) return;

    setMaterias([]);
    setInstructores([]);
    setInstructorHorario([]);
    setInstructorCalendario(null);
    setShowCalendario(false);
    fetchMateriasByFicha(selectedSolicitud.idFicha, resolverIdPrograma(selectedSolicitud));
  }, [modalAccept, selectedSolicitud]);

  const fetchInstructores = async (idMateria: number) => {
    setLoadingInstructores(true);
    try {
      const res = await axios.get('materias/instructores', { params: { idMateria } });
      setInstructores(res.data.data || []);
    } catch (error: any) {
      setInstructores([]);
      enqueueSnackbar(error.response?.data?.message || 'Error al cargar los instructores', {
        variant: 'error'
      });
    } finally {
      setLoadingInstructores(false);
    }
  };

  const fetchMateriasByFicha = async (idFicha: number, idPrograma?: number) => {
    if (!idFicha) {
      setMaterias([]);
      enqueueSnackbar('La solicitud no tiene ficha asociada', { variant: 'error' });
      return;
    }
    if (!idPrograma) {
      setMaterias([]);
      enqueueSnackbar('No se pudo determinar el programa de la ficha', { variant: 'error' });
      return;
    }

    setLoadingMaterias(true);
    try {
      const res = await axios.get('materias-programa', { params: { idFicha, idPrograma } });
      const data = Array.isArray(res.data) ? res.data : [];
      if (!Array.isArray(res.data) && res.data?.message) {
        setMaterias([]);
        enqueueSnackbar(res.data.message || 'Error al cargar las competencias', {
          variant: 'error'
        });
        return;
      }
      setMaterias(data);
    } catch (error: any) {
      setMaterias([]);
      enqueueSnackbar(error.response?.data?.message || 'Error al cargar las competencias', {
        variant: 'error'
      });
    } finally {
      setLoadingMaterias(false);
    }
  };

  const opcionesCompetencias = materias
    .filter((mat) => !competenciaEstaCompletada(mat))
    .map((mat) => ({
      value: mat.id,
      label: mat.nombreMateria
    }));

  const fetchHorariosInstructor = async (idInstructor: number) => {
    const instructor = instructores.find(
      (inst) => inst.id === Number(idInstructor) || inst.id === idInstructor
    );

    setShowCalendario(true);
    setInstructorHorario([]);
    setInstructorCalendario(instructor || null);
    setLoadingHorario(true);

    try {
      const res = await axios.get(`fichas/instructor/${idInstructor}/clases-asignadas`);
      const horarios = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setInstructorHorario(
        horarios.map((horario: any) => ({
          ...horario,
          id: horario.id || horario.idHorarioMateria,
          estado: horario.estado || 'ASIGNADO',
          fechaInicial: horario.fechaInicial || horario.fechaInicio || horario.fecha_inicial,
          fechaFinal:
            horario.fechaFinal ||
            horario.fechaFin ||
            horario.fecha_final ||
            selectedSolicitud?.fechaFin ||
            '2999-12-31',
          instructor:
            horario.instructor ||
            horario.contrato?.persona ||
            instructor?.persona ||
            (horario.instructor_nombre
              ? {
                  nombre1: horario.instructor_nombre,
                  apellido1: '',
                  rutaFotoUrl: instructor?.persona?.rutaFotoUrl
                }
              : undefined),
          gradoMateria: horario.gradoMateria || {
            materia: {
              nombreMateria:
                horario.rap_nombre ||
                horario.rapNombre ||
                horario.competencia_nombre ||
                horario.competenciaNombre ||
                horario.materia_nombre ||
                horario.materiaNombre ||
                'Horario asignado'
            }
          }
        }))
      );
    } catch (error: any) {
      setInstructorHorario([]);
      enqueueSnackbar(error.response?.data?.message || 'Error al cargar el horario del instructor', {
        variant: 'error'
      });
    } finally {
      setLoadingHorario(false);
    }
  };

  return (
    <Modal open={modalAccept} onClose={() => setModalAccept(false)}>
      <ModalContent className="w-full max-w-xl p-4">
        <ModalHeader>
          <ModalTitle>Aceptar Solicitud</ModalTitle>
          <button
            type="button"
            onClick={() => setModalAccept(false)}
            className="flex items-center justify-center w-8 h-8 transition-all border border-gray-300 dark:border-gray-600 rounded-full hover:bg-danger hover:text-white hover:scale-105"
          >
            <i className="ki-outline ki-cross"></i>
          </button>
        </ModalHeader>
        <ModalBody className="overflow-y-auto max-h-[90vh]">
          <form onSubmit={acceptFormik.handleSubmit} className="space-y-6">
            {selectedSolicitud?.solicitante?.persona && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-coal-500 border border-gray-100 dark:border-gray-600">
                <div className="flex-shrink-0">
                  {selectedSolicitud.solicitante.persona.rutaFotoUrl ? (
                    <img
                      src={selectedSolicitud.solicitante.persona.rutaFotoUrl}
                      alt="Solicitante"
                      className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white font-bold text-lg">
                      {selectedSolicitud.solicitante.persona.nombre1[0]}
                      {selectedSolicitud.solicitante.persona.apellido1[0]}
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Solicitante
                  </span>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                    {selectedSolicitud.solicitante.persona.nombre1}{' '}
                    {selectedSolicitud.solicitante.persona.apellido1}
                  </span>
                  <div className="flex flex-col sm:flex-row sm:gap-4 mt-0.5">
                    <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <KeenIcon icon="sms" className="text-xs" />{' '}
                      {selectedSolicitud.solicitante.persona.email}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <KeenIcon icon="phone" className="text-xs" />{' '}
                      {selectedSolicitud.solicitante.persona.celular}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider">
                  Fecha Inicio <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  name="fechaInicio"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-coal-400 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  onChange={acceptFormik.handleChange}
                  value={acceptFormik.values.fechaInicio}
                />
                {acceptFormik.touched.fechaInicio && acceptFormik.errors.fechaInicio && (
                  <p className="text-danger text-xs mt-1 font-semibold">
                    {acceptFormik.errors.fechaInicio}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider">
                  Fecha Fin (Opcional)
                </label>
                <input
                  type="date"
                  name="fechaFin"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-coal-400 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  onChange={acceptFormik.handleChange}
                  value={acceptFormik.values.fechaFin}
                />
                {acceptFormik.touched.fechaFin && acceptFormik.errors.fechaFin && (
                  <p className="text-danger text-xs mt-1 font-semibold">
                    {acceptFormik.errors.fechaFin}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider">
                Seleccionar Competencia <span className="text-danger">*</span>
              </label>
              <Select
                options={opcionesCompetencias}
                isClearable
                isLoading={loadingMaterias}
                placeholder="Seleccione una competencia..."
                noOptionsMessage={() =>
                  loadingMaterias
                    ? 'Cargando competencias...'
                    : 'No existen competencias disponibles.'
                }
                value={
                  acceptFormik.values.idMateria
                    ? (() => {
                        const mat = materias.find(
                          (m) =>
                            m.id === Number(acceptFormik.values.idMateria) ||
                            m.id === acceptFormik.values.idMateria
                        );
                        if (!mat || competenciaEstaCompletada(mat)) return null;
                        return {
                          value: mat.id,
                          label: mat.nombreMateria
                        };
                      })()
                    : null
                }
                onChange={(opt) => {
                  acceptFormik.setFieldValue('idMateria', opt ? opt.value : '');
                  acceptFormik.setFieldValue('idContrato', '');
                  setInstructorHorario([]);
                  setInstructorCalendario(null);
                  setShowCalendario(false);
                  if (opt) {
                    fetchInstructores(opt.value);
                  } else {
                    setInstructores([]);
                  }
                }}
                className="react-select-container"
                classNamePrefix="react-select"
              />
              {acceptFormik.touched.idMateria && acceptFormik.errors.idMateria && (
                <p className="text-danger text-xs mt-1 font-semibold">
                  {acceptFormik.errors.idMateria}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider">
                Asignar Instructor <span className="text-danger">*</span>
              </label>
              <Select
                isClearable
                options={instructores.map((inst) => ({
                    value: inst.id,
                    label: (
                      <div className="flex flex-row justify-between items-center text-gray-900 dark:text-gray-100">
                        <div className="flex gap-2">
                          {inst.persona?.rutaFotoUrl ? (
                            <img
                              src={inst.persona.rutaFotoUrl}
                              alt={inst.persona.nombre1}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              <i className="ki-duotone ki-profile text-primary w-8 h-8"></i>
                            </div>
                          )}
                          <span className="font-medium">
                            {inst.persona?.nombre1 || ''} {inst.persona?.apellido1 || ''}
                          </span>
                        </div>
                        <button 
                          type="button"
                          title="Horario Instructor"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-primary/10"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            fetchHorariosInstructor(inst.id);
                          }}
                        >
                          <i className="ki-outline ki-calendar text-base hover:opacity-75"></i>
                        </button>
                      </div>
                    )
                  }))}
                isLoading={loadingInstructores && instructores.length === 0}
                placeholder={
                  acceptFormik.values.idMateria
                    ? 'Seleccione un instructor...'
                    : 'Debe seleccionar una competencia primero'
                }
                isDisabled={!acceptFormik.values.idMateria}
                value={
                  acceptFormik.values.idContrato
                    ? (() => {
                        const inst = instructores.find(
                          (i) =>
                            i.id === Number(acceptFormik.values.idContrato) ||
                            i.id === acceptFormik.values.idContrato
                        );
                        if (!inst) return null;
                        return {
                          value: inst.id,
                          label: (
                            <div className="flex flex-row items-center gap-2 text-gray-900 dark:text-gray-100">
                              {inst.persona?.rutaFotoUrl ? (
                                <img
                                  src={inst.persona.rutaFotoUrl}
                                  alt={inst.persona.nombre1}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                  <i className="ki-duotone ki-profile text-primary w-8 h-8"></i>
                                </div>
                              )}
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {inst.persona?.nombre1 || ''} {inst.persona?.apellido1 || ''}
                              </span>
                            </div>
                          )
                        };
                      })()
                    : null
                }
                onChange={(opt) => {
                  acceptFormik.setFieldValue('idContrato', opt ? opt.value : '');
                  setInstructorHorario([]);
                  setInstructorCalendario(
                    opt
                      ? instructores.find(
                          (inst) => inst.id === Number(opt.value) || inst.id === opt.value
                        ) || null
                      : null
                  );
                  setShowCalendario(false);
                }}
                className="react-select-container"
                classNamePrefix="react-select"
              />
              {acceptFormik.values.idContrato && (
                <button
                  type="button"
                  className="btn btn-light btn-sm w-fit mt-2"
                  disabled={loadingHorario}
                  onClick={() => fetchHorariosInstructor(Number(acceptFormik.values.idContrato))}
                >
                  <KeenIcon icon="calendar" className="text-sm" />
                  {loadingHorario ? 'Cargando horario...' : 'Ver horario del instructor seleccionado'}
                </button>
              )}
              {acceptFormik.touched.idContrato && acceptFormik.errors.idContrato && (
                <p className="text-danger text-xs mt-1 font-semibold">
                  {acceptFormik.errors.idContrato}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider">
                Observación (Opcional)
              </label>
              <textarea
                name="observacion"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-coal-400 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                onChange={acceptFormik.handleChange}
                value={acceptFormik.values.observacion}
                placeholder="Añada una nota sobre la aceptación..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button type="button" className="btn btn-light" onClick={() => setModalAccept(false)}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-success"
                disabled={acceptFormik.isSubmitting}
              >
                {acceptFormik.isSubmitting ? 'Procesando...' : 'Aceptar Solicitud'}
              </button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>

      <Calendario
        isOpen={showCalendario}
        onClose={() => setShowCalendario(false)}
        materia={{
          nombre: instructorCalendario?.persona
            ? `Horario de ${instructorCalendario.persona.nombre1 || ''} ${instructorCalendario.persona.apellido1 || ''}`
            : 'Horario del instructor',
          horarios: {
            asignados: instructorHorario,
            sinAsignar: []
          }
        }}
        idFicha={selectedSolicitud?.idFicha || 0}
        onAddSchedule={() => {}}
        modoRmi={true}
      />

    </Modal>
  );
};

export default SolicitudInstructorAceptar;
