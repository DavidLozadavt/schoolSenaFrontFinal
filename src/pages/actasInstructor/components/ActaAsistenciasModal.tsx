import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import { Acta } from '../types';

interface ActaAsistenciasModalProps {
  isOpen: boolean;
  onClose: () => void;
  acta: Acta | null;
  onSuccess: () => void;
}

const ActaAsistenciasModal: React.FC<ActaAsistenciasModalProps> = ({
  isOpen,
  onClose,
  acta,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contratosFicha, setContratosFicha] = useState<any[]>([]);

  const [periodo, setPeriodo] = useState<string>('');
  const [asistencias, setAsistencias] = useState<
    {
      idContrato: string;
      dependencia: string;
      aprueba: 'SI' | 'NO';
      observacion: string;
    }[]
  >([]);

  useEffect(() => {
    if (isOpen && acta) {
      setAsistencias(
        acta.asistencias && acta.asistencias.length > 0
          ? acta.asistencias.map((a) => ({
              idContrato: a.idContrato.toString(),
              dependencia: a.dependencia || '',
              aprueba: a.aprueba || 'NO',
              observacion: a.observacion || ''
            }))
          : []
      );
      if (acta.idFicha) {
        fetchContratos(acta.idFicha.toString(), periodo);
      }
    } else {
      setAsistencias([]);
      setContratosFicha([]);
    }
  }, [isOpen, acta, periodo]);

  const fetchContratos = async (idFicha: string, currentPeriodo: string) => {
    try {
      const response = await axios.get(`actas/ficha-data`, {
        params: { idFicha, periodo: currentPeriodo }
      });
      setContratosFicha(response.data);
    } catch (error) {
      console.error('Error fetching contratos:', error);
    }
  };

  const addAsistencia = () => {
    setAsistencias((prev) => [
      ...prev,
      { idContrato: '', dependencia: '', aprueba: 'NO', observacion: '' }
    ]);
  };

  const handleAsistenciaChange = (index: number, field: string, value: string) => {
    const newAsistencias = [...asistencias];
    (newAsistencias[index] as any)[field] = value;
    setAsistencias(newAsistencias);
  };

  const removeAsistencia = (index: number) => {
    const newAsistencias = asistencias.filter((_, i) => i !== index);
    setAsistencias(newAsistencias);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acta) return;

    setIsSubmitting(true);
    try {
      const payload = {
        asistencias: asistencias.filter((a) => a.idContrato !== '')
      };

      await axios.put(`actas/${acta.id}`, payload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error al guardar asistencias:', error);
      alert('Error al guardar las asistencias. Por favor, intente de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLocked = acta?.asistencias && acta.asistencias.length > 0 && acta.asistencias.every(a => a.aprueba === 'SI');

  if (!isOpen || !acta) return null;

  return (
    <Modal open={isOpen} onClose={onClose} className="mx-4 sm:mx-auto max-w-2xl w-full">
      <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full overflow-hidden shadow-2xl border-none">
        <ModalHeader className="bg-gray-50 dark:bg-coal-400/50 border-b border-gray-100 dark:border-coal-300 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
              <i className={`ki-outline ${isLocked ? 'ki-lock' : 'ki-users'} text-blue-600 dark:text-blue-400 text-xl`} />
            </div>
            <div>
              <ModalTitle className="text-lg font-bold text-gray-800 dark:text-white">
                {isLocked ? 'Asistencias (Lectura)' : 'Gestionar Asistencias'}
              </ModalTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">Acta: {acta.nombre}</p>
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

        <form onSubmit={handleSubmit}>
          <ModalBody className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {isLocked && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                <i className="ki-outline ki-warning text-amber-600 dark:text-amber-400 text-lg mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Acta Bloqueada</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400/80">
                    No se pueden gestionar asistentes porque el acta ya ha sido aceptada por todos los integrantes.
                  </p>
                </div>
              </div>
            )}

            <fieldset disabled={isLocked} className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-coal-300 pb-2 gap-2 sm:gap-0">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <i className="ki-outline ki-users text-blue-500" />
                      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                        Asistentes (Instructores/Asesores)
                      </h3>
                    </div>
                    <input
                      type="month"
                      className="px-3 py-1.5 bg-gray-50 dark:bg-coal-500 border border-gray-100 dark:border-coal-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={periodo}
                      onChange={(e) => setPeriodo(e.target.value)}
                      title="Filtrar instructores por período"
                    />
                  </div>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={addAsistencia}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <i className="ki-outline ki-plus" />
                      Agregar Asistente
                    </button>
                  )}
                </div>

                {asistencias.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 dark:bg-coal-400/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-coal-300">
                    <p className="text-xs text-gray-400">
                      No hay asistentes registrados para esta acta.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {asistencias.map((asistencia, index) => (
                      <div
                        key={index}
                        className="p-4 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-2xl shadow-sm relative group"
                      >
                        {!isLocked && (
                          <button
                            type="button"
                            onClick={() => removeAsistencia(index)}
                            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                          >
                            <i className="ki-outline ki-cross" />
                          </button>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                              Asistente
                            </label>
                            <select
                              required
                              className="w-full px-3 py-2 bg-gray-50 dark:bg-coal-500 border border-gray-100 dark:border-coal-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                              value={asistencia.idContrato}
                              onChange={(e) =>
                                handleAsistenciaChange(index, 'idContrato', e.target.value)
                              }
                            >
                              <option value="">Seleccione asistente</option>
                              {contratosFicha.map((c) => (
                                <option
                                  key={`${c.idContrato}-${c.fechaInicialHorario}`}
                                  value={c.idContrato}
                                >
                                  {c.nombre1} {c.apellido1} - {c.numeroContrato || 'Sin N° Contrato'}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                              Dependencia / Cargo
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ej: CCYS"
                              className="w-full px-3 py-2 bg-gray-50 dark:bg-coal-500 border border-gray-100 dark:border-coal-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                              value={asistencia.dependencia}
                              onChange={(e) =>
                                handleAsistenciaChange(index, 'dependencia', e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                              ¿Aprueba?
                            </label>
                            <select
                              required
                              className="w-full px-3 py-2 bg-gray-50 dark:bg-coal-500 border border-gray-100 dark:border-coal-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                              value={asistencia.aprueba}
                              onChange={(e) =>
                                handleAsistenciaChange(index, 'aprueba', e.target.value)
                              }
                            >
                              <option value="NO">NO</option>
                              <option value="SI">SÍ</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Observación
                          </label>
                          <textarea
                            rows={2}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-coal-500 border border-gray-100 dark:border-coal-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                            placeholder="Observación opcional..."
                            value={asistencia.observacion}
                            onChange={(e) =>
                              handleAsistenciaChange(index, 'observacion', e.target.value)
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </fieldset>
          </ModalBody>
          <ModalHeader className="border-t border-gray-100 dark:border-coal-300 px-6 py-4 flex justify-end gap-3 bg-gray-50 dark:bg-coal-400/30">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isLocked ? 'Cerrar' : 'Cancelar'}
            </button>
            {!isLocked && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 text-white text-xs font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <i className="ki-outline ki-loading animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="ki-outline ki-check-circle" />
                    Guardar Asistencias
                  </>
                )}
              </button>
            )}
          </ModalHeader>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default ActaAsistenciasModal;
