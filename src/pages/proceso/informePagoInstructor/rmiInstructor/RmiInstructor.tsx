import { AuthContext } from '@/auth/providers/JWTProvider';
import axios from 'axios';
import React, { useContext, useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import RmiModal from '../../../gestion-rmi/RmiModal';
import { Instructor } from '../../../gestion-rmi/interfaceInstructor';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import ActividadesIndex from '../actividades/ActividadesIndex';

interface DetalleRmi {
  idDetalleRmi: number;
  estadoDetalle: string;
  observacion: string | null;
  idHorarioMateria: number;
  horaInicial: string;
  horaFinal: string;
  fechaInicial: string;
  fechaFinal: string | null;
  estadoHorario: string;
}

interface Periodo {
  periodo: string;
  idRmi: number;
  estadoRmi: string;
  estadoInforme: string;
  observacion: string | null;
  horasAsignadas: number;
  detalles: DetalleRmi[];
}

interface ContratoRmi {
  idContrato: number;
  fechaContratacion: string;
  fechaFinal: string | null;
  periodos: Periodo[];
}

const RmiInstructor = forwardRef<{ validate: () => { isValid: boolean; errors: string[] } }>(
  (_, ref) => {
    const authContext = useContext(AuthContext);
    if (!authContext) throw new Error('AuthContext debe usarse dentro de AuthProvider');

    const [anioGestion, setAnioGestion] = useState<number>(new Date().getFullYear());
    const [aniosContrato, setAniosContrato] = useState<number[]>([]);
    const [dataRmi, setDataRmi] = useState<ContratoRmi[]>([]);
    const [loadingRmi, setLoadingRmi] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

  // Estados para el Modal
  const [rmiModalOpen, setRmiModalOpen] = useState(false);
  const [fichas, setFichas] = useState<any[]>([]);
  const [loadingFichas, setLoadingFichas] = useState(false);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string | undefined>();
  const [selectedContratoId, setSelectedContratoId] = useState<number>(0);

  //Agregar las actividades del instructor:
  const [actividadModalParams, setActividadModalParams] = useState<{
    idRmi: number;
    idContrato: number;
    fechaMinima: string;
    fechaMaxima: string;
  } | null>(null);
    // Agregar estado para actividades
    const [actividadesRmi, setActividadesRmi] = useState<any[]>([]);
    const [selectedIdRmi, setSelectedIdRmi] = useState<number>(0);

    const periodoActual = useMemo(() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }, []);

    // Exponer método de validación a través del ref
    useImperativeHandle(ref, () => ({
      validate: () => {
        setValidationError(null);

        if (!anioGestion) {
          setValidationError('Debe seleccionar un año para continuar');
          return { isValid: false, errors: ['Debe seleccionar un año'] };
        }

        if (dataRmi.length === 0) {
          setValidationError('No hay datos de RMI disponibles para el año seleccionado');
          return { isValid: false, errors: ['No hay datos de RMI disponibles'] };
        }

        // Validar que el período actual esté ACEPTADO
        const periodoActualStr = periodoActual;
        let findCurrentPeriod = false;
        let periodStatus = '';

        for (const contrato of dataRmi) {
          const currentPeriod = contrato.periodos.find((p) => p.periodo === periodoActualStr);
          if (currentPeriod) {
            findCurrentPeriod = true;
            periodStatus = currentPeriod.estadoRmi;
            break;
          }
        }

        if (!findCurrentPeriod) {
          setValidationError('No existe un período actual en los datos de RMI');
          return { isValid: false, errors: ['No existe un período actual'] };
        }

        if (periodStatus !== 'ACEPTADO') {
          setValidationError(
            `El período actual (${periodoActualStr}) debe estar en estado "ACEPTADO" para continuar. Estado actual: ${periodStatus}`
          );
          return {
            isValid: false,
            errors: [`El período ${periodoActualStr} debe estar ACEPTADO. Estado actual: ${periodStatus}`]
          };
        }

        return { isValid: true, errors: [] };
      }
    }), [dataRmi, anioGestion, periodoActual]);

  const dataRmiFiltrada = useMemo(() => {
    return dataRmi.map((contrato) => ({
      ...contrato,
      periodos: contrato.periodos
        .filter((p) => p.periodo <= periodoActual) // solo pasados + actual
        .sort((a, b) => (a.periodo < b.periodo ? 1 : -1)) // actual primero
    }));
  }, [dataRmi, periodoActual]);

  // Carga los años disponibles
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axios.get('get_years_contract_person', {
          params: { idPerson: authContext.persona.id }
        });
        setAniosContrato(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, [authContext]);

  // Carga los RMI cuando cambia el año seleccionado
  useEffect(() => {
    if (!anioGestion) return;

    const loadRmi = async () => {
      setLoadingRmi(true);
      try {
        const res = await axios.get('get_data_rmi_configuration_by_year', {
          params: {
            year: anioGestion,
            idPerson: authContext.persona.id
          }
        });
        setDataRmi(res.data);
      } catch {
        setDataRmi([]);
      } finally {
        setLoadingRmi(false);
      }
    };
    loadRmi();
  }, [anioGestion]);

  const handleVerRmi = async (idContrato: number, periodoStr: string, idRmi: number) => {
    setSelectedIdRmi(idRmi);
    setLoadingFichas(true);
    setSelectedPeriodo(periodoStr);
    setSelectedContratoId(idContrato);
    try {
      const [fichasRes, actividadesRes] = await Promise.all([
        axios.get('instructores/fichas', {
          params: { idContrato, periodo: periodoStr }
        }),
        axios.get('actividades-instructores', {
          params: { idRmi, idContrato }
        })
      ]);
      setFichas(fichasRes.data);
      setActividadesRmi(actividadesRes.data);
      setRmiModalOpen(true);
    } catch (e) {
      console.error(e);
      setFichas([]);
      setActividadesRmi([]);
      setRmiModalOpen(true);
    } finally {
      setLoadingFichas(false);
    }
  };

  const fetchFichas = () => {
    if (selectedContratoId && selectedPeriodo && selectedIdRmi) {
      handleVerRmi(selectedContratoId, selectedPeriodo, selectedIdRmi);
    }
  };

  const dummyInstructor: Instructor = {
    idActivation: 0,
    emailUsuario: authContext.persona.email,
    idContrato: selectedContratoId,
    roles: authContext.roles || [],
    totalHoras: 160,
    totalHorasFormato: '0',
    horarios: [],
    persona: authContext.persona as any
  };

    const formatHorasAsignadas = (h: any, periodoObj?: Periodo) => {
      if (h === null || h === undefined || h === '') {
        console.warn('RMI: horasAsignadas missing or empty for periodo', periodoObj?.periodo, periodoObj);
        return '0';
      }
      return h;
    };

  return (
    <div className="p-5 w-full">
      <div className="mb-4">
        <select
          value={anioGestion}
          onChange={(e) => setAnioGestion(Number(e.target.value))}
          className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={0} disabled>
            Seleccione un año
          </option>
          {aniosContrato.map((val) => (
            <option key={val} value={val}>
              {val}
            </option>
          ))}
        </select>
      </div>

      {loadingRmi ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !anioGestion ? (
        <div className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
          Seleccione un año para ver los RMIs
        </div>
      ) : dataRmi.length === 0 ? (
        <div className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
          No hay datos RMI para el año {anioGestion}
        </div>
      ) : (
        dataRmiFiltrada.map((contrato) => (
          <div
            key={contrato.idContrato}
            className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 mb-4 overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-gray-100 dark:border-coal-300">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Contrato #{contrato.idContrato}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {contrato.fechaContratacion} — {contrato.fechaFinal ?? 'Vigente'}
              </p>
            </div>

            <div className="p-4 space-y-3">
              {contrato.periodos.map((periodo) => (
                <div
                  key={periodo.periodo}
                  className="border border-gray-100 dark:border-coal-300 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Periodo: {periodo.periodo}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        periodo.estadoRmi === 'ACEPTADO'
                          ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                          : periodo.estadoRmi === 'RECHAZADO'
                            ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400'
                      }`}
                    >
                      {periodo.estadoRmi}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <i className="ki-outline ki-time text-gray-400 text-xs" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Horas asignadas:
                      <span className="font-semibold text-gray-700 dark:text-gray-200 ml-1">
                        {formatHorasAsignadas(periodo.horasAsignadas, periodo)} h
                      </span>
                    </span>
                  </div>

                  <div className="flex gap-2 flex-wrap mt-3">
                    <button
                      onClick={() =>
                        handleVerRmi(contrato.idContrato, periodo.periodo, periodo.idRmi)
                      }
                      disabled={loadingFichas && selectedPeriodo === periodo.periodo}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 font-medium text-blue-700 dark:text-blue-400 dark:bg-blue-500/10 rounded-lg transition-all disabled:opacity-50"
                    >
                      {loadingFichas && selectedPeriodo === periodo.periodo ? (
                        <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <i className="ki-outline ki-book-square text-sm" />
                      )}
                      Ver y Descargar RMI
                    </button>

                    <button
                      onClick={() => {
                        const [year, month] = periodo.periodo.split('-').map(Number);
                        const fechaMinima = `${year}-${String(month).padStart(2, '0')}-01`;
                        const lastDay = new Date(year, month, 0).getDate(); // último día del mes
                        const fechaMaxima = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

                        setActividadModalParams({
                          idRmi: periodo.idRmi,
                          idContrato: contrato.idContrato,
                          fechaMinima,
                          fechaMaxima
                        });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-50 hover:bg-orange-100 font-medium text-orange-700 dark:text-orange-400 dark:bg-white/5 rounded-lg transition-all"
                    >
                      <i className="ki-outline ki-list text-sm" /> Actividades
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal CRUD Actividades */}
      {actividadModalParams && (
        <Modal
          open={true}
          onClose={() => setActividadModalParams(null)}
          className="mx-4 sm:mx-auto max-w-4xl w-full"
        >
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>Actividades del Instructor</ModalTitle>
              <button
                type="button"
                onClick={() => setActividadModalParams(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5">
              <ActividadesIndex
                idRmi={actividadModalParams.idRmi}
                idContrato={actividadModalParams.idContrato}
                fechaMinima={actividadModalParams.fechaMinima}
                fechaMaxima={actividadModalParams.fechaMaxima}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Modal RMI para el instructor */}
      <RmiModal
        isOpen={rmiModalOpen}
        onClose={() => setRmiModalOpen(false)}
        instructor={dummyInstructor}
        periodo={selectedPeriodo}
        fichas={fichas}
        actividades={actividadesRmi}
        onRefresh={fetchFichas}
        readOnlyAsociacion={true}
      />

      {/* Modal de validación - Período no aceptado */}
      {validationError && (
        <Modal
          open={!!validationError}
          onClose={() => setValidationError(null)}
          className="mx-4 sm:mx-auto max-w-md w-full"
        >
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>No puede continuar</ModalTitle>
              <button
                type="button"
                onClick={() => setValidationError(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <i className="ki-outline ki-information text-red-600 dark:text-red-400 text-lg" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white mb-1">
                    Validación requerida
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {validationError}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setValidationError(null)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Entendido
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
  }
);

export default RmiInstructor;
