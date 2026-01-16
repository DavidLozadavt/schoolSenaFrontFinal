import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';
import { useConfirm } from '@/hooks';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

interface Novedades {
  horas_extra: any[];
 
  solicitud_inc_lic_personas: any[];
}

const NovedadesModal = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { confirmAction } = useConfirm();
  const [novedades, setNovedades] = useState<Novedades>({
    horas_extra: [],
    solicitud_inc_lic_personas: [],
 
  });
  const fetchNovedades = useCallback(async () => {
    if (!data?.contratoId) return;

    setLoading(true);
    try {
      const response = await axios.get(`get_novedades_by_contrato/${data.contratoId}`);
      setNovedades(response.data);
    } catch (err: any) {
      setError(`Error al cargar: ${err.message || err}`);
      enqueueSnackbar('Error al cargar las novedades', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [data?.contratoId, enqueueSnackbar]);

  useEffect(() => {
    if (open && data?.contratoId) {
      fetchNovedades();
    }
  }, [open, data?.contratoId, fetchNovedades]);

  const fechaActual = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const handleSaveHoraExtra = async (id: any) => {
    const payload = {
      estado: 'APROBADO',
      comentario: `APROBADO DESDE LIQUIDACIÓN - ${fechaActual}`
    };

    try {
      if (id) {
        await axios.put(`update_status_hora_extra_supervisor/${id}`, payload);
        enqueueSnackbar('Novedad actualizada con éxito.', { variant: 'success' });
        if (onSave) {
          onSave();
        }
      }

      fetchNovedades();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al guardar los datos.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleSaveLicencias = async (id: any) => {
    const payload = {
      estado: 'ACEPTADO',
      comentario: `APROBADO DESDE LIQUIDACIÓN - ${fechaActual}`
    };

    try {
      if (id) {
        await axios.put(`update_status_by_supervisor/${id}`, payload);
        enqueueSnackbar('Novedad actualizada con éxito.', { variant: 'success' });
      }

      if (onSave) onSave();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al guardar los datos.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleClickHoraExtra = (id: any) => {
    confirmAction('Esta acción aprueba la novedad de hora extra', () => handleSaveHoraExtra(id));
  };

  const handleClickLicencias = (id: any) => {
    confirmAction('Esta acción aprueba la novedad de licencias e incapacidades', () =>
      handleSaveLicencias(id)
    );
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[930px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Novedades Pendientes</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-6 px-4 py-5">
          {novedades?.horas_extra?.length > 0 && (
            <div className="card card-grid min-w-full mt-3">
              <div className="card-table">
                <h3 className="text-sm font-semibold mb-3 text-gray-800 px-4 pt-4">Horas Extra</h3>
                <table className="table table-border align-middle text-gray-700 font-medium text-sm w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Fecha</th>
                      <th className="px-4 py-2">Número de Horas</th>
                      <th className="px-4 py-2">Valor por Hora</th>
                      <th className="px-4 py-2">Estado</th>
                      <th className="px-4 py-2 text-center">Aprobar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {novedades.horas_extra.map((row: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-center">
                          {new Date(row.fecha).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-2 text-center">{row.numeroHoras}</td>
                        <td className="px-4 py-2 text-center">
                          ${row.valorHoraExtra.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-center">{row.estado}</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            className="btn btn-sm btn-light"
                            onClick={() => handleClickHoraExtra(row.id)}
                          >
                            <KeenIcon icon="double-check" className="text-xl text-green-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        

          {novedades?.solicitud_inc_lic_personas?.length > 0 && (
            <div className="card card-grid min-w-full mt-3">
              <div className="card-table">
                <h3 className="text-sm font-semibold mb-3 text-gray-800 px-4 pt-4">
                  Incapacidades / Licencias
                </h3>

                <table className="table table-border align-middle text-gray-700 font-medium text-sm w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Fecha Inicial</th>
                      <th className="px-4 py-2">Fecha Final</th>
                      <th className="px-4 py-2">Días</th>
                      <th className="px-4 py-2">Valor</th>
                      <th className="px-4 py-2">Estado</th>
                      <th className="px-4 py-2 text-center">Aprobar</th>
                    </tr>
                  </thead>

                  <tbody>
                    {novedades.solicitud_inc_lic_personas.map((row: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-center">
                          {new Date(row.fechaInicial).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {new Date(row.fechaFinal).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-2 text-center">{row.numDias}</td>
                        <td className="px-4 py-2 text-center">${row.valor.toLocaleString()}</td>
                        <td className="px-4 py-2 text-center">{row.estado}</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            className="btn btn-sm btn-light"
                            onClick={() => handleClickLicencias(row.id)}
                          >
                            <KeenIcon icon="double-check" className="text-xl text-green-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!novedades?.horas_extra?.length &&
           
            !novedades?.solicitud_inc_lic_personas?.length && (
              <div className="text-center py-4 text-gray-500 font-medium">
                No hay novedades pendientes.
              </div>
            )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { NovedadesModal };
