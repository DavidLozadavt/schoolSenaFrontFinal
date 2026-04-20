import { AuthContext } from '@/auth/providers/JWTProvider';
import axios from 'axios';
import React, { useContext, useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import ComisionesIndex from '../comisiones/ComisionesIndex';

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
  urlInformeUrl: string | null;
  numeroPlanilla: string | null;
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

const InformeGeneralInstructor = forwardRef<{ validate: () => { isValid: boolean; errors: string[] } }>(
  (_, ref) => {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error('AuthContext debe usarse dentro de AuthProvider');

  const [anioGestion, setAnioGestion] = useState<number>(new Date().getFullYear());
  const [aniosContrato, setAniosContrato] = useState<number[]>([]);
  const [dataRmi, setDataRmi] = useState<ContratoRmi[]>([]);
  const [loadingRmi, setLoadingRmi] = useState(false);
  const [comisionModalParams, setComisionModalParams] = useState<{
    idContrato: number;
    idRmi: number;
    fechaMinima: string;
    fechaMaxima: string;
  } | null>(null);
  const [actividadModalParams, setActividadModalParams] = useState<{ idRmi: number } | null>(null);

  //plazo para el informe:
  const [plazoModalParams, setPlazoModalParams] = useState<{
    idContrato: number;
    idRmi: number;
    idsHorarioMateria: number[];
  } | null>(null);
  const [nPlanillaInput, setnPlanillaInput] = useState('');
  const [uploadingInforme, setUploadingInforme] = useState<number | null>(null);
  const [selectedReportFile, setSelectedReportFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const periodoActual = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Exponer método de validación a través del ref
  useImperativeHandle(ref, () => ({
    validate: () => {
      setValidationError(null);

      // Validar que el período actual esté ACEPTADO
      const periodoActualStr = periodoActual;
      let findCurrentPeriod = false;
      let periodStatus = '';

      for (const contrato of dataRmi) {
        const currentPeriod = contrato.periodos.find((p) => p.periodo === periodoActualStr);
        if (currentPeriod) {
          findCurrentPeriod = true;
          periodStatus = currentPeriod.estadoInforme;
          break;
        }
      }

      if (!findCurrentPeriod) {
        // Si no hay periodo actual, tal vez estamos viendo años anteriores. 
        // En ese caso, la validación depende de si el usuario intenta avanzar.
        // Por ahora, si no hay periodo actual en el año seleccionado, permitimos pasar 
        // o pedimos que seleccione un año con datos.
        return { isValid: true, errors: [] };
      }

      if (periodStatus !== 'ACEPTADO') {
        setValidationError(
          `El informe del período actual (${periodoActualStr}) debe estar en estado "ACEPTADO" para continuar. Estado actual: ${periodStatus}`
        );
        return {
          isValid: false,
          errors: [`El informe del período ${periodoActualStr} debe estar ACEPTADO. Estado actual: ${periodStatus}`]
        };
      }

      return { isValid: true, errors: [] };
    }
  }), [dataRmi, periodoActual]);
  // Carga los años disponibles
  useEffect(() => {
    const loadData = async () => {
      const res = await axios.get('get_years_contract_person', {
        params: { idPerson: authContext.persona.id }
      });
      setAniosContrato(res.data);
    };
    loadData();
  }, [authContext]);


  const dataRmiFiltrada = useMemo(() => {
    return dataRmi.map((contrato) => ({
      ...contrato,
      periodos: contrato.periodos
        .filter((p) => p.periodo <= periodoActual)
        .sort((a, b) => (a.periodo < b.periodo ? 1 : -1))
    }));
  }, [dataRmi, periodoActual]);

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

  const loadRmi = async () => {
    if (!anioGestion) return;
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

  const handleUploadInforme = async (periodo: Periodo, file: File) => {
    setUploadingInforme(periodo.idRmi);
    try {
      const formData = new FormData();
      formData.append('urlInforme', file);
      formData.append('idRmi', String(periodo.idRmi));
      periodo.detalles.forEach((d) => {
        formData.append('idsHorarioMateria[]', String(d.idHorarioMateria));
      });
      await axios.post('detalle_rmi/archivo_informe_instructor', formData);
      await loadRmi();
    } catch (error) {
      console.error('Error al subir el informe:', error);
    } finally {
      setUploadingInforme(null);
    }
  };

  const handleDescargarPdf = async (idContrato: number, idRmi: number, nPlanilla: string) => {
    try {
      const res = await axios.get('get_informe_by_instructor_rmi', {
        params: { idContrato, idRmi, nPlanilla },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RMI_${idContrato}_${idRmi}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {}
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

      {/* Contenido RMI */}
      {loadingRmi ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !anioGestion ? (
        <div className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
          Seleccione un año para ver los informes
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
                        periodo.estadoInforme === 'ACEPTADO'
                          ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                          : periodo.estadoInforme === 'PENDIENTE'
                            ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400'
                      }`}
                    >
                      {periodo.estadoInforme}
                    </span>
                  </div>
                  {/* Horas asignadas */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <i className="ki-outline ki-time text-gray-400 text-xs" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Horas asignadas:
                      <span className="font-semibold text-gray-700 dark:text-gray-200 ml-1">
                        {periodo.horasAsignadas} h
                      </span>
                    </span>
                  </div>

                  {/* Botones agrupados en flex horizontal */}
                  <div className="flex gap-2 flex-wrap mt-3">
                    {periodo.estadoRmi === 'ACEPTADO' && (
                      <>
                        <button
                          onClick={() => {
                            const existingPlanilla = periodo.detalles.find((d) => d.numeroPlanilla)?.numeroPlanilla || '';
                            setnPlanillaInput(existingPlanilla);
                            setPlazoModalParams({
                              idContrato: contrato.idContrato,
                              idRmi: periodo.idRmi,
                              idsHorarioMateria: periodo.detalles.map((d) => d.idHorarioMateria)
                            });
                            setSelectedReportFile(null); // Reset file selection
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 font-medium text-green-700 dark:text-green-400 dark:bg-white/5 rounded-lg transition-all"
                        >
                          <i className="ki-outline ki-document text-sm" /> Informe
                        </button>
                        <button
                          onClick={() => {
                            const [year, month] = periodo.periodo.split('-').map(Number);
                            const fechaMinima = `${year}-${String(month).padStart(2, '0')}-01`;
                            const lastDay = new Date(year, month, 0).getDate(); // último día del mes
                            const fechaMaxima = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

                            setComisionModalParams({
                              idContrato: contrato.idContrato,
                              idRmi: periodo.idRmi,
                              fechaMinima,
                              fechaMaxima
                            });
                          }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 font-medium text-blue-700 dark:text-blue-400 dark:bg-white/5 rounded-lg transition-all"
                    >
                      <i className="ki-outline ki-credit-cart text-sm" /> Comisiones
                    </button>

                        {/* Botón de subir informe */}
                        <div className="flex items-center gap-2">
                          {periodo.detalles.some((d) => d.urlInformeUrl) ? (
                            <a
                              href={periodo.detalles.find((d) => d.urlInformeUrl)?.urlInformeUrl ?? undefined}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium ml-2"
                            >
                              <i className="ki-outline ki-document text-sm" /> Ver Informe Subido
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 ml-2">Sin informe subido</span>
                          )}

                          <label
                            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all ${
                              uploadingInforme === periodo.idRmi
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-white/5 dark:text-blue-400'
                            }`}
                          >
                            <i className="ki-outline ki-cloud-add text-sm" />
                            {uploadingInforme === periodo.idRmi
                              ? 'Subiendo...'
                              : periodo.detalles.some((d) => d.urlInformeUrl)
                                ? 'Cambiar Informe'
                                : 'Subir Informe'}
                            <input
                              type="file"
                              className="hidden"
                              disabled={uploadingInforme === periodo.idRmi}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadInforme(periodo, file);
                              }}
                            />
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal CRUD Comisiones */}
      {comisionModalParams && (
        <Modal
          open={true}
          onClose={() => setComisionModalParams(null)}
          className="mx-4 sm:mx-auto max-w-4xl w-full"
        >
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>Comisiones de Instructor</ModalTitle>
              <button
                type="button"
                onClick={() => setComisionModalParams(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5">
              <ComisionesIndex
                idContrato={comisionModalParams.idContrato}
                idRmi={comisionModalParams.idRmi}
                fechaMinima={comisionModalParams.fechaMinima}
                fechaMaxima={comisionModalParams.fechaMaxima}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Modal input Plazo */}
      {plazoModalParams && (
        <Modal
          open={true}
          onClose={() => setPlazoModalParams(null)}
          className="mx-4 sm:mx-auto max-w-sm w-full"
        >
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>Generar Informe</ModalTitle>
              <button
                type="button"
                onClick={() => setPlazoModalParams(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  No. planilla
                </label>
                <input
                  type="text"
                  value={nPlanillaInput}
                  onChange={(e) => setnPlanillaInput(e.target.value)}
                  placeholder="Ingrese el número de la planilla..."
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Opción de subir informe */}
              <div className="pt-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Subir informe firmado
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-center gap-2 px-3 py-4 border-2 border-dashed border-gray-200 dark:border-coal-300 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-coal-400 transition-all">
                    <i className="ki-outline ki-cloud-add text-2xl text-gray-400" />
                    <div className="text-center">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {selectedReportFile ? selectedReportFile.name : 'Haga clic para seleccionar archivo'}
                      </p>
                      <p className="text-[10px] text-gray-400">PDF</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setSelectedReportFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {selectedReportFile && (
                    <button
                      onClick={() => setSelectedReportFile(null)}
                      className="text-[10px] text-red-500 hover:text-red-600 text-right"
                    >
                      Remover archivo
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setPlazoModalParams(null)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-coal-300 hover:bg-gray-200 rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  disabled={!nPlanillaInput.trim() || loadingRmi}
                  onClick={async () => {
                    try {
                      setLoadingRmi(true);
                      // Guardar el número de planilla masivamente
                      await axios.post('detalle_rmi/numero_planilla', {
                        numeroPlanilla: nPlanillaInput.trim(),
                        idRmi: plazoModalParams.idRmi,
                        idsHorarioMateria: plazoModalParams.idsHorarioMateria
                      });

                      // Descargar el PDF
                      await handleDescargarPdf(
                        plazoModalParams.idContrato,
                        plazoModalParams.idRmi,
                        nPlanillaInput.trim()
                      );

                      // Si hay un archivo seleccionado, subirlo
                      if (selectedReportFile) {
                        const rmiPeriodo = dataRmiFiltrada
                          .flatMap((c) => c.periodos)
                          .find((p) => p.idRmi === plazoModalParams.idRmi);

                        if (rmiPeriodo) {
                          await handleUploadInforme(rmiPeriodo, selectedReportFile);
                        }
                      }

                      // Actualizar estado local para reflejar el cambio sin recargar
                      await loadRmi();

                      setPlazoModalParams(null);
                      setSelectedReportFile(null);
                    } catch (error) {
                      console.error('Error al guardar planilla o descargar PDF:', error);
                    } finally {
                      setLoadingRmi(false);
                    }
                  }}
                  className="px-4 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
                >
                  <i className="ki-outline ki-document text-sm mr-1" />
                  {loadingRmi ? 'Procesando...' : 'Descargar PDF'}
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Modal de validación - Informe no aceptado */}
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
                    Validación del Informe
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

export default InformeGeneralInstructor;
