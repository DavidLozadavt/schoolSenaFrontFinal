import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { AuthContext } from '@/auth/providers/JWTProvider';
import { getAuth } from '@/auth/_helpers';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/modal';

interface DetalleRmi {
  idDetalleRmi: number;
  idHorarioMateria: number;
  estadoInforme: string;
  urlInforme: string | null;
  numeroPlanilla: string | null;
}

interface Periodo {
  periodo: string;
  idRmi: number;
  estadoRmi: string;
  observacion: string | null;
  detalles: DetalleRmi[];
}

interface ContratoRmi {
  idContrato: number;
  fechaContratacion: string;
  fechaFinal: string | null;
  periodos: Periodo[];
}

interface InstructorRmi {
  idInstructor: number;
  instructorNombre: string;
  identificacion: string;
  emailInstructor: string;
  contratos: ContratoRmi[];
}

const getEstadoFromDetalles = (detalles: DetalleRmi[]): string => {
  if (!detalles.length) return 'SIN_DETALLES';
  const estados = detalles.map((d) => d.estadoInforme);
  if (estados.every((e) => e === 'ACEPTADO')) return 'ACEPTADO';
  if (estados.some((e) => e === 'PENDIENTE')) return 'PENDIENTE';
  return 'PENDIENTE';
};

const GCGeneral: React.FC = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error('AuthContext debe usarse dentro de AuthProvider');

  const [instructores, setInstructores] = useState<InstructorRmi[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredPeriodo, setFilteredPeriodo] = useState<string>('');
  const [filteredInstructor, setFilteredInstructor] = useState<string>('');
  const [periodosDisponibles, setPeriodosDisponibles] = useState<string[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<{
    idRmi: number;
    idContrato: number;
    periodo: string;
    detalles: DetalleRmi[];
    instructorNombre: string;
    emailInstructor: string;
  } | null>(null);
  const [modalAccion, setModalAccion] = useState<'view' | 'aceptar' | 'rechazar' | 'revertir'>(
    'view'
  );
  const [procesando, setProcesando] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState<string>('');

  const getCurrentPeriodo = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('get_all_rmi_details_for_admin');
      const instructoresMap = new Map<number, InstructorRmi>();
      const periodosSet = new Set<string>();

      res.data.forEach((item: any) => {
        if (item.periodo) periodosSet.add(item.periodo);

        if (!instructoresMap.has(item.instructorId)) {
          instructoresMap.set(item.instructorId, {
            idInstructor: item.instructorId,
            instructorNombre: item.instructorNombre,
            identificacion: item.identificacion,
            emailInstructor: item.emailInstructor,
            contratos: []
          });
        }

        const instructor = instructoresMap.get(item.instructorId)!;
        let contrato = instructor.contratos.find((c) => c.idContrato === item.idContrato);

        if (!contrato) {
          contrato = {
            idContrato: item.idContrato,
            fechaContratacion: item.fechaContratacion,
            fechaFinal: item.fechaFinal,
            periodos: []
          };
          instructor.contratos.push(contrato);
        }

        contrato.periodos.push({
          periodo: item.periodo,
          idRmi: item.idRmi,
          estadoRmi: item.estadoRmi,
          observacion: null,
          detalles: item.detalles || []
        });
      });

      const periodosOrdenados = Array.from(periodosSet).sort().reverse();
      setPeriodosDisponibles(periodosOrdenados);

      if (!filteredPeriodo) {
        const periodoActual = getCurrentPeriodo();
        setFilteredPeriodo(
          periodosOrdenados.includes(periodoActual) ? periodoActual : (periodosOrdenados[0] ?? '')
        );
      }

      setInstructores(Array.from(instructoresMap.values()));
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setInstructores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const actualizarDetallesLocales = (idRmi: number, nuevoEstado: string) => {
    setInstructores((prev) =>
      prev.map((instructor) => ({
        ...instructor,
        contratos: instructor.contratos.map((contrato) => ({
          ...contrato,
          periodos: contrato.periodos.map((periodo) =>
            periodo.idRmi === idRmi
              ? {
                  ...periodo,
                  detalles: periodo.detalles.map((d) => ({ ...d, estadoInforme: nuevoEstado }))
                }
              : periodo
          )
        }))
      }))
    );
  };

  const handleAceptarInforme = async () => {
    if (!selectedPeriodo) return;
    setProcesando(true);
    try {
      await axios.post('detalle_rmi/aceptar_informe', {
        idRmi: selectedPeriodo.idRmi,
        idsHorarioMateria: selectedPeriodo.detalles.map((d) => d.idHorarioMateria),
        email: selectedPeriodo.emailInstructor
      });
      actualizarDetallesLocales(selectedPeriodo.idRmi, 'ACEPTADO');
      setSelectedPeriodo(null);
    } catch (error) {
      enqueueSnackbar('Error al aceptar el informe', { variant: 'error' });
    } finally {
      setProcesando(false);
    }
  };

  const handleRechazarInforme = async () => {
    if (!selectedPeriodo || !motivoRechazo.trim()) {
      enqueueSnackbar('Debe ingresar un motivo para el rechazo', { variant: 'warning' });
      return;
    }
    setProcesando(true);
    try {
      await axios.post('detalle_rmi/rechazar_informe', {
        idRmi: selectedPeriodo.idRmi,
        idsHorarioMateria: selectedPeriodo.detalles.map((d) => d.idHorarioMateria),
        email: selectedPeriodo.emailInstructor,
        motivo: motivoRechazo
      });
      // Backend pone PENDIENTE al rechazar
      actualizarDetallesLocales(selectedPeriodo.idRmi, 'PENDIENTE');
      setMotivoRechazo('');
      setSelectedPeriodo(null);
    } catch (error) {
      enqueueSnackbar('Error al rechazar el informe', { variant: 'error' });
    } finally {
      setProcesando(false);
    }
  };

  const handleRevertirInforme = async () => {
    if (!selectedPeriodo) return;
    setProcesando(true);
    try {
      await axios.post('detalle_rmi/revertir_informe', {
        idRmi: selectedPeriodo.idRmi,
        idsHorarioMateria: selectedPeriodo.detalles.map((d) => d.idHorarioMateria),
        email: selectedPeriodo.emailInstructor
      });
      actualizarDetallesLocales(selectedPeriodo.idRmi, 'PENDIENTE');
      setSelectedPeriodo(null);
    } catch (error) {
      enqueueSnackbar('Error al revertir el informe', { variant: 'error' });
    } finally {
      setProcesando(false);
    }
  };

  const handleGenerarInformeCoordinador = () => {
    if (!selectedPeriodo) return;
    const { idRmi, idContrato, detalles } = selectedPeriodo;
    const nPlanilla = getNumeroPlanilla(detalles) ?? '';
    const baseUrl = axios.defaults.baseURL ?? '';
    const token = getAuth() ?? '';
    const params = new URLSearchParams({
      idRmi: String(idRmi),
      idContrato: String(idContrato),
      nPlanilla,
      token: String(token)
    });
    window.open(`${baseUrl}get_informe_by_coordinador_rmi?${params.toString()}`, '_blank');
  };

  const handleUploadInforme = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedPeriodo) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('urlInforme', file);
    formData.append('idRmi', String(selectedPeriodo.idRmi));
    selectedPeriodo.detalles.forEach((d) => {
      formData.append('idsHorarioMateria[]', String(d.idHorarioMateria));
    });

    setProcesando(true);
    try {
      await axios.post('detalle_rmi/archivo_informe_instructor', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      enqueueSnackbar('Informe actualizado exitosamente', { variant: 'success' });
      await loadData();
      setSelectedPeriodo(null);
    } catch (error) {
      enqueueSnackbar('Error al subir el informe', { variant: 'error' });
    } finally {
      setProcesando(false);
      e.target.value = '';
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'ACEPTADO':
        return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400';
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400';
    }
  };

  const instructoresFiltrados = instructores
    .filter((i) => filteredInstructor === '' || i.identificacion === filteredInstructor)
    .map((instructor) => ({
      ...instructor,
      contratos: instructor.contratos
        .map((contrato) => ({
          ...contrato,
          periodos: contrato.periodos.filter((p) => p.periodo === filteredPeriodo)
        }))
        .filter((c) => c.periodos.length > 0)
    }))
    .filter((i) => i.contratos.length > 0);

  // El informe es compartido entre todos los detalles del período
  const getUrlInforme = (detalles: DetalleRmi[]): string | null =>
    detalles.find((d) => d.urlInforme)?.urlInforme ?? null;

  const getNumeroPlanilla = (detalles: DetalleRmi[]): string | null =>
    detalles.find((d) => d.numeroPlanilla)?.numeroPlanilla ?? null;

  return (
    <div className="p-5 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Gestión de Informes instructores
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Revisión y aceptación de informes de instructores
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtrar por Instructor
            </label>
            <select
              value={filteredInstructor}
              onChange={(e) => setFilteredInstructor(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-coal-300 rounded-lg bg-white dark:bg-coal-400 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los instructores</option>
              {instructores.map((instructor) => (
                <option key={instructor.identificacion} value={instructor.identificacion}>
                  {instructor.instructorNombre} - {instructor.identificacion}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtrar por Período
            </label>
            <select
              value={filteredPeriodo}
              onChange={(e) => setFilteredPeriodo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-coal-300 rounded-lg bg-white dark:bg-coal-400 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccione un período</option>
              {periodosDisponibles.map((periodo) => (
                <option key={periodo} value={periodo}>
                  {periodo}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-all whitespace-nowrap"
          >
            {loading ? 'Cargando...' : 'Actualizar datos'}
          </button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !filteredPeriodo ? (
        <div className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
          Seleccione un período para ver los instructores
        </div>
      ) : instructoresFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
          No hay instructores disponibles para el período {filteredPeriodo}
        </div>
      ) : (
        <div className="space-y-4">
          {instructoresFiltrados.map((instructor) => (
            <div
              key={instructor.idInstructor}
              className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-100 dark:border-coal-300 bg-gray-50 dark:bg-coal-400">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {instructor.instructorNombre}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Cédula: {instructor.identificacion}
                </p>
              </div>

              <div className="p-4 space-y-3">
                {instructor.contratos.map((contrato) => (
                  <div
                    key={contrato.idContrato}
                    className="bg-gray-50 dark:bg-coal-400 rounded-lg p-4"
                  >
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Contrato #{contrato.idContrato} • {contrato.fechaContratacion} —{' '}
                      {contrato.fechaFinal ?? 'Vigente'}
                    </p>

                    <div className="space-y-2">
                      {contrato.periodos.map((periodo) => {
                        const estadoVisual = getEstadoFromDetalles(periodo.detalles);
                        const tienePendientes = periodo.detalles.some(
                          (d) => d.estadoInforme === 'PENDIENTE'
                        );
                        const urlInforme = getUrlInforme(periodo.detalles);
                        const numeroPlanilla = getNumeroPlanilla(periodo.detalles);

                        return (
                          <div
                            key={periodo.idRmi}
                            className="bg-white dark:bg-coal-500 border border-gray-100 dark:border-coal-300 rounded-lg p-3 flex items-center justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                Período: {periodo.periodo}
                              </p>
                              {/* Planilla e informe como info rápida en la tarjeta */}
                              <div className="flex items-center gap-3 mt-1">
                                {numeroPlanilla && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    Planilla:{' '}
                                    <span className="font-medium text-gray-600 dark:text-gray-300">
                                      {numeroPlanilla}
                                    </span>
                                  </span>
                                )}
                                {urlInforme ? (
                                  <a
                                    href={urlInforme}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <i className="ki-outline ki-document text-xs" /> Ver informe
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                    Sin informe adjunto
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                              <span
                                className={`text-xs font-medium px-2 py-1 rounded-full ${getEstadoBadge(estadoVisual)}`}
                              >
                                {estadoVisual}
                              </span>

                              {/* Mostrar botón de revisión siempre */}
                              <button
                                onClick={() => {
                                  setSelectedPeriodo({
                                    idRmi: periodo.idRmi,
                                    idContrato: contrato.idContrato,
                                    periodo: periodo.periodo,
                                    detalles: periodo.detalles,
                                    instructorNombre: instructor.instructorNombre,
                                    emailInstructor: instructor.emailInstructor
                                  });
                                  setModalAccion('view');
                                }}
                                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 rounded-lg transition-all"
                              >
                                Revisar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de revisión */}
      {selectedPeriodo && (
        <Modal
          open={true}
          onClose={() => setSelectedPeriodo(null)}
          className="mx-4 sm:mx-auto max-w-md w-full"
        >
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>Revisión de Informe</ModalTitle>
              <button
                type="button"
                onClick={() => setSelectedPeriodo(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5 space-y-4">
              {/* Info */}
              <div className="bg-gray-50 dark:bg-coal-400 p-3 rounded-lg space-y-1">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {selectedPeriodo.instructorNombre}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Período: <span className="font-medium">{selectedPeriodo.periodo}</span>
                  {' · '}
                  Contrato: <span className="font-medium">#{selectedPeriodo.idContrato}</span>
                </p>
                {getNumeroPlanilla(selectedPeriodo.detalles) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No. Planilla:{' '}
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {getNumeroPlanilla(selectedPeriodo.detalles)}
                    </span>
                  </p>
                )}
              </div>

              {/* Informe adjunto */}
              {(() => {
                const url = getUrlInforme(selectedPeriodo.detalles);
                return (
                  <div className="space-y-3">
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 rounded-lg transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                          <i className="ki-outline ki-document text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                            Ver informe adjunto
                          </p>
                          <p className="text-xs text-blue-500 dark:text-blue-500 truncate">{url}</p>
                        </div>
                        <i className="ki-outline ki-exit-right-corner text-blue-400 text-sm" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-lg">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-coal-300 flex items-center justify-center flex-shrink-0">
                          <i className="ki-outline ki-document text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                          El instructor aún no ha adjuntado un informe
                        </p>
                      </div>
                    )}

                    {/* Acciones sobre el archivo */}
                    <div className="flex justify-end gap-2">
                      {/* Generar informe con firma del coordinador */}
                      <button
                        onClick={handleGenerarInformeCoordinador}
                        disabled={procesando}
                        title="Genera el PDF del informe con la firma del coordinador"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                          procesando
                            ? 'opacity-50 pointer-events-none'
                            : 'text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/20'
                        }`}
                      >
                        <i className="ki-outline ki-security-user text-base" />
                        Generar informe firmado
                      </button>

                      {/* Cambiar / subir informe */}
                      <label
                        className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 leading-none ${procesando ? 'opacity-50 pointer-events-none' : 'text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20'}`}
                      >
                        <i className="ki-outline ki-cloud-add text-base" />
                        <span className="flex-1 text-center">
                          {procesando ? 'Procesando...' : url ? 'Cambiar informe' : 'Subir informe'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={handleUploadInforme}
                          disabled={procesando}
                        />
                      </label>
                    </div>
                  </div>
                );
              })()}

              {/* Acciones */}
              <div className="pt-1">
                {(() => {
                  const estadoVisual = getEstadoFromDetalles(selectedPeriodo.detalles);
                  return (
                    <>
                      {modalAccion === 'view' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedPeriodo(null)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-coal-300 hover:bg-gray-200 dark:hover:bg-coal-400 rounded-lg transition-all"
                          >
                            Cerrar
                          </button>
                          {estadoVisual === 'PENDIENTE' && (
                            <>
                              <button
                                onClick={() => setModalAccion('rechazar')}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all"
                              >
                                Rechazar
                              </button>
                              <button
                                onClick={() => setModalAccion('aceptar')}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all"
                              >
                                Aceptar
                              </button>
                            </>
                          )}
                          {estadoVisual === 'ACEPTADO' && (
                            <button
                              onClick={() => setModalAccion('revertir')}
                              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-all"
                            >
                              Revertir a Pendiente
                            </button>
                          )}
                        </div>
                      )}

                      {modalAccion === 'aceptar' && (
                        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 p-3 rounded-lg">
                          <p className="text-sm text-green-800 dark:text-green-400 font-medium mb-3">
                            ¿Confirma que desea aceptar este informe?
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setModalAccion('view')}
                              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-coal-300 rounded-lg"
                            >
                              Atrás
                            </button>
                            <button
                              onClick={handleAceptarInforme}
                              disabled={procesando}
                              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-all"
                            >
                              {procesando ? 'Procesando...' : 'Confirmar'}
                            </button>
                          </div>
                        </div>
                      )}

                      {modalAccion === 'rechazar' && (
                        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-3 rounded-lg space-y-3">
                          <p className="text-sm text-red-800 dark:text-red-400 font-medium">
                            Motivo del rechazo
                          </p>
                          <textarea
                            value={motivoRechazo}
                            onChange={(e) => setMotivoRechazo(e.target.value)}
                            placeholder="Ingrese el motivo por el cual se rechaza este informe..."
                            className="w-full px-3 py-2 text-sm border border-red-300 dark:border-red-400 rounded-lg bg-white dark:bg-coal-400 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                            rows={3}
                          />
                          <p className="text-xs text-red-600 dark:text-red-400">
                            El instructor recibirá un correo con el motivo del rechazo
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setModalAccion('view');
                                setMotivoRechazo('');
                              }}
                              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-coal-300 rounded-lg"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleRechazarInforme}
                              disabled={procesando || !motivoRechazo.trim()}
                              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-all"
                            >
                              {procesando ? 'Procesando...' : 'Rechazar'}
                            </button>
                          </div>
                        </div>
                      )}

                      {modalAccion === 'revertir' && (
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-3 rounded-lg">
                          <p className="text-sm text-amber-800 dark:text-amber-400 font-medium mb-3">
                            ¿Confirma que desea revertir este informe a pendiente?
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
                            El estado del informe cambiará de ACEPTADO a PENDIENTE
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setModalAccion('view')}
                              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-coal-300 rounded-lg"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleRevertirInforme}
                              disabled={procesando}
                              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg transition-all"
                            >
                              {procesando ? 'Procesando...' : 'Revertir'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default GCGeneral;
