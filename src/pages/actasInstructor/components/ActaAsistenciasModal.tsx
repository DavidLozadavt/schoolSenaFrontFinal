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

const SeleccionAsistenteSwitch: React.FC<{
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation();
      if (!disabled) onChange();
    }}
    className={`
      relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200
      focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
      ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      ${
        checked
          ? 'border-blue-500 bg-blue-500 dark:border-blue-500 dark:bg-blue-600'
          : 'border-gray-300 bg-gray-200 dark:border-gray-500 dark:bg-gray-600'
      }
    `}
  >
    <span
      className={`
        pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-out
        ${checked ? 'translate-x-6' : 'translate-x-0.5'}
      `}
    />
  </button>
);

const getAvatarUrl = (path: string | undefined): string => {
  if (!path) return '/media/avatars/blank.png';
  if (path.startsWith('http')) return path;
  const base = (axios.defaults.baseURL || '').replace(/\/api\/?$/, '') || window.location.origin;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const storagePath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`;
  return `${base.replace(/\/$/, '')}/${storagePath}`;
};

const ActaAsistenciasModal: React.FC<ActaAsistenciasModalProps> = ({
  isOpen,
  onClose,
  acta,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contratosFicha, setContratosFicha] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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
              dependencia: a.dependencia || 'INSTRUCTOR',
              aprueba: a.aprueba || 'NO',
              observacion: a.observacion || ''
            }))
          : []
      );
      if (acta.idFicha) {
        const fechaIni = acta.fechaInicialFormacion ? acta.fechaInicialFormacion.split('T')[0] : undefined;
        const fechaFin = acta.fechaFinalFormacion ? acta.fechaFinalFormacion.split('T')[0] : undefined;
        fetchContratos(acta.idFicha.toString(), fechaIni, fechaFin);
      }
    } else {
      setAsistencias([]);
      setContratosFicha([]);
      setSearchTerm('');
    }
  }, [isOpen, acta]);

  const fetchContratos = async (idFicha: string, fechaInicial?: string, fechaFinal?: string) => {
    try {
      const response = await axios.get(`actas/ficha-data`, {
        params: { idFicha, fechaInicial, fechaFinal }
      });
      setContratosFicha(response.data);
    } catch (error) {
      console.error('Error fetching contratos:', error);
    }
  };

  const toggleAsistencia = (contrato: any) => {
    const isSelected = asistencias.some((a) => a.idContrato === contrato.idContrato.toString());

    if (isSelected) {
      setAsistencias((prev) => prev.filter((a) => a.idContrato !== contrato.idContrato.toString()));
    } else {
      setAsistencias((prev) => [
        ...prev,
        {
          idContrato: contrato.idContrato.toString(),
          dependencia: 'INSTRUCTOR',
          aprueba: 'NO',
          observacion: ''
        }
      ]);
    }
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

  const isLocked =
    acta?.asistencias &&
    acta.asistencias.length > 0 &&
    acta.asistencias.every((a) => a.aprueba === 'SI');

  const filteredContratos = contratosFicha.filter(
    (c) =>
      `${c.nombre1} ${c.apellido1}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.numeroContrato && c.numeroContrato.includes(searchTerm))
  );

  if (!isOpen || !acta) return null;

  return (
    <Modal open={isOpen} onClose={onClose} className="mx-4 sm:mx-auto max-w-3xl w-full">
      <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full overflow-hidden shadow-2xl border-none">
        <ModalHeader className="bg-gray-50 dark:bg-coal-400/50 border-b border-gray-100 dark:border-coal-300 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
              <i
                className={`ki-outline ${isLocked ? 'ki-lock' : 'ki-users'} text-blue-600 dark:text-blue-400 text-xl`}
              />
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
          <ModalBody className="p-0 max-h-[75vh] overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-4">
              {isLocked && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                  <i className="ki-outline ki-warning text-amber-600 dark:text-amber-400 text-lg mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                      Acta Bloqueada
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400/80">
                      No se pueden gestionar asistentes porque el acta ya ha sido aceptada por todos
                      los integrantes.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <i className="ki-outline ki-users text-blue-500 text-lg" />
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Instructores
                  </h3>
                </div>
                <div className="relative flex-1 max-w-xs">
                  <i className="ki-outline ki-magnifier absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o contrato..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-coal-600 border border-gray-100 dark:border-coal-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <fieldset disabled={isLocked} className="w-full">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-coal-400/50 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-4 text-center w-14">
                        <span className="sr-only">Seleccionar</span>
                      </th>
                      <th className="py-2.5 px-3 text-left text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Instructor
                      </th>
                      <th className="py-2.5 px-3 text-left text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        Detalles del Contrato
                      </th>
                      <th className="py-2.5 px-4 text-center text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-24">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {contratosFicha.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center">
                          <i className="ki-outline ki-user-remove text-gray-300 text-4xl mb-2 block" />
                          <p className="text-xs text-gray-400">
                            No se encontraron instructores vinculados a esta ficha.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredContratos.map((contrato) => {
                        const isSelected = asistencias.some(
                          (a) => a.idContrato === contrato.idContrato.toString()
                        );
                        return (
                          <tr
                            key={`${contrato.idContrato}`}
                            onClick={() => !isLocked && toggleAsistencia(contrato)}
                            className={`
                              hover:bg-gray-50 dark:hover:bg-coal-400/30 transition-colors cursor-pointer
                              ${isSelected ? 'bg-blue-50/30 dark:bg-blue-500/5' : ''}
                            `}
                          >
                            <td className="py-3 px-4 text-center align-middle">
                              <SeleccionAsistenteSwitch
                                checked={isSelected}
                                onChange={() => toggleAsistencia(contrato)}
                                disabled={isLocked}
                              />
                            </td>
                            <td className="py-3 px-3 align-middle">
                              <div className="flex items-center gap-3">
                                <img
                                  src={getAvatarUrl(contrato.rutaFotoUrl || contrato.rutaFoto)}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-700 shadow-sm"
                                  alt=""
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                    {contrato.nombre1} {contrato.apellido1}
                                  </span>
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                    {contrato.email || 'Sin correo registrado'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 align-middle">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">
                                  # {contrato.numeroContrato || 'S/N'}
                                </span>
                                <span className="text-[9px] text-gray-500 dark:text-gray-500 uppercase tracking-tighter">
                                  Inicia:{' '}
                                  {contrato.fechaInicialHorario
                                    ? new Date(contrato.fechaInicialHorario).toLocaleDateString()
                                    : 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center align-middle">
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-[9px] font-bold text-blue-600 dark:text-blue-400 rounded-full uppercase tracking-tighter">
                                  Asignado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-coal-400 text-[9px] font-bold text-gray-500 dark:text-gray-500 rounded-full uppercase tracking-tighter">
                                  Omitido
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </fieldset>
          </ModalBody>
          <ModalHeader className="border-t border-gray-100 dark:border-coal-300 px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-coal-400/30">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                Seleccionados:
              </span>
              <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-bold">
                {asistencias.length}
              </span>
            </div>
            <div className="flex gap-3">
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
                  disabled={isSubmitting || asistencias.length === 0}
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
            </div>
          </ModalHeader>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default ActaAsistenciasModal;
