import { AuthContext } from '@/auth/providers/JWTProvider';
import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import ComisionesIndex from '../comisiones/ComisionesIndex';
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

const InformeGeneralInstructor: React.FC = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error('AuthContext debe usarse dentro de AuthProvider');

  const [anioGestion, setAnioGestion] = useState<number>(0);
  const [aniosContrato, setAniosContrato] = useState<number[]>([]);
  const [dataRmi, setDataRmi] = useState<ContratoRmi[]>([]);
  const [loadingRmi, setLoadingRmi] = useState(false);
  const [comisionModalParams, setComisionModalParams] = useState<{ idContrato: number; idRmi: number } | null>(null);
  const [actividadModalParams, setActividadModalParams] = useState<{ idRmi: number } | null>(null);

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

  const handleDescargarPdf = async (idContrato: number, idRmi: number) => {
    try {
      const res = await axios.get('get_informe_by_instructor_rmi', {
        params: { idContrato, idRmi },
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
        dataRmi.map((contrato) => (
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
                          onClick={() => handleDescargarPdf(contrato.idContrato, periodo.idRmi)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 font-medium text-green-700 dark:text-green-400 dark:bg-white/5 rounded-lg transition-all"
                        >
                          <i className="ki-outline ki-document text-sm" /> Informe
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setComisionModalParams({ idContrato: contrato.idContrato, idRmi: periodo.idRmi })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 font-medium text-blue-700 dark:text-blue-400 dark:bg-white/5 rounded-lg transition-all"
                    >
                      <i className="ki-outline ki-credit-cart text-sm" /> Comisiones
                    </button>
                    <button
                      onClick={() => setActividadModalParams({ idRmi: periodo.idRmi })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-orange-50 hover:bg-orange-100 font-medium text-orange-700 dark:text-orange-400  dark:bg-white/5 rounded-lg transition-all"
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

      {/* Modal CRUD Comisiones */}
      {comisionModalParams && (
        <Modal open={true} onClose={() => setComisionModalParams(null)} className="mx-4 sm:mx-auto max-w-4xl w-full">
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
              <ComisionesIndex idContrato={comisionModalParams.idContrato} idRmi={comisionModalParams.idRmi} />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Modal CRUD Actividades */}
      {actividadModalParams && (
        <Modal open={true} onClose={() => setActividadModalParams(null)} className="mx-4 sm:mx-auto max-w-4xl w-full">
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
              <ActividadesIndex idRmi={actividadModalParams.idRmi} />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default InformeGeneralInstructor;
