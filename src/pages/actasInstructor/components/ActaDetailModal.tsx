import React from 'react';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import { Acta } from '../types';

interface ActaDetailModalProps {
  acta: Acta | null;
  onClose: () => void;
}

const ActaDetailModal: React.FC<ActaDetailModalProps> = ({ acta, onClose }) => {
  if (!acta) return null;

  return (
    <Modal
      open={true}
      onClose={onClose}
      className="mx-4 sm:mx-auto max-w-2xl w-full"
    >
      <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full overflow-hidden shadow-2xl border-none">
        <ModalHeader className="bg-gray-50 dark:bg-coal-400/50 border-b border-gray-100 dark:border-coal-300 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
              <i className="ki-outline ki-document text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <div>
              <ModalTitle className="text-lg font-bold text-gray-800 dark:text-white">
                Detalles del Acta
              </ModalTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {acta.tipoActa} - #{acta.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-coal-300 transition-colors"
          >
            <i className="ki-outline ki-cross text-lg" />
          </button>
        </ModalHeader>
        <ModalBody className="p-0 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8">
            {/* Cabecera de Detalles */}
            <div className="bg-gray-50 dark:bg-coal-400/30 p-5 rounded-2xl border border-gray-100 dark:border-coal-300">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <i className="ki-outline ki-document text-blue-500" />
                {acta.nombre || 'Acta sin nombre'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha</label>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{new Date(acta.fecha).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Horario</label>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{acta.horaInicio} - {acta.horaFin}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ficha</label>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{acta.ficha?.codigo || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lugar</label>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{acta.lugar || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ciudad</label>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{acta.ciudad?.descripcion || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dirección</label>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{acta.direccion || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Agenda */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <i className="ki-outline ki-list text-blue-500" />
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Agenda del Día</h3>
              </div>
              {acta.agenda && acta.agenda.length > 0 ? (
                <div className="space-y-2 pl-4 border-l-2 border-blue-500/20">
                  {acta.agenda.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="flex-none w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{item.punto}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No se registraron puntos de agenda.</p>
              )}
            </div>

            {/* Objetivos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <i className="ki-outline ki-target text-blue-500" />
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Objetivos de la Reunión</h3>
              </div>
              {acta.objetivos && acta.objetivos.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {acta.objetivos.map((obj, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 dark:bg-coal-400/30 p-3 rounded-xl border border-gray-100 dark:border-coal-300">
                      <i className="ki-outline ki-check-circle text-green-500 text-sm" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">{obj.objetivo}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No se registraron objetivos específicos.</p>
              )}
            </div>

            {/* Conclusiones */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <i className="ki-outline ki-check-square text-blue-500" />
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Conclusiones</h3>
              </div>
              {acta.conclusiones && acta.conclusiones.length > 0 ? (
                <div className="space-y-3">
                  {acta.conclusiones.map((concl, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-coal-400/30 p-4 rounded-xl border border-gray-100 dark:border-coal-300">
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                        "{concl.conclusion}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No se registraron conclusiones.</p>
              )}
            </div>

            {/* Compromisos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <i className="ki-outline ki-calendar-tick text-blue-500" />
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Compromisos</h3>
              </div>
              {acta.compromisos && acta.compromisos.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {acta.compromisos.map((comp, idx) => (
                    <div key={idx} className="bg-white dark:bg-coal-400 border border-gray-100 dark:border-coal-300 rounded-2xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                            <i className="ki-outline ki-flag text-orange-500" />
                          </div>
                          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200">Actividad: {comp.actividad}</h4>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-md">
                          Fecha: {new Date(comp.fecha).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50 dark:border-coal-300">
                        <i className="ki-outline ki-profile-circle text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Responsable: <span className="font-semibold text-gray-700 dark:text-gray-200">{comp.responsable}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No se registraron compromisos.</p>
              )}
            </div>

            {/* Observación General */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <i className="ki-outline ki-message-text-2 text-blue-500" />
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Observaciones Generales</h3>
              </div>
              <div className="bg-gray-50 dark:bg-coal-400/30 rounded-2xl p-5 border border-gray-100 dark:border-coal-300">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {acta.observacion || 'Sin observaciones adicionales registradas.'}
                </p>
              </div>
            </div>


            {/* Asistencias */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <i className="ki-outline ki-users text-blue-500" />
                <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Asistentes Registrados</h3>
              </div>

              {acta.asistencias && acta.asistencias.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {acta.asistencias.map((asistencia, idx) => (
                    <div
                      key={asistencia.id || idx}
                      className="bg-white dark:bg-coal-400 border border-gray-100 dark:border-coal-300 rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-50 dark:border-coal-300">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                            <i className="ki-outline ki-user text-lg" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 block">
                              {asistencia.contrato?.persona?.nombre1}{' '}
                              {asistencia.contrato?.persona?.apellido1}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">{asistencia.dependencia}</span>
                          </div>
                        </div>
                        <div>
                           <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${asistencia.aprueba === 'SI' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'}`}>
                             Aprueba: {asistencia.aprueba}
                           </span>
                        </div>
                      </div>
                      {asistencia.observacion && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic mt-2">
                          "{asistencia.observacion}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No hay asistentes registrados para este acta.</p>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalHeader className="border-t border-gray-100 dark:border-coal-300 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            Cerrar Detalles
          </button>
        </ModalHeader>
      </ModalContent>
    </Modal>
  );
};

export default ActaDetailModal;
