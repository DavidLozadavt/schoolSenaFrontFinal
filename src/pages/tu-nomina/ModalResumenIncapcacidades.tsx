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
  novedades: any[];
  solicitud_inc_lic_personas: any[];
}

const ModalResumenIncapcacidades = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { confirmAction } = useConfirm();
  const [novedades, setNovedades] = useState<Novedades>({
    horas_extra: [],
    solicitud_inc_lic_personas: [],
    novedades: []
  });

  const fetchNovedades = useCallback(async () => {
    if (!data?.contratoId) return;

    setLoading(true);
    try {
      const response = await axios.get(`get_novedades_aprobadas_by_contrato/${data.contratoId}`);
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

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[730px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Distribución de Días y Pagos de Incapacidades</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-6 px-4 py-5">
          <div className="card card-grid min-w-full mt-3">
            <div className="card-table">
              <h3 className="text-sm font-semibold mb-3 text-gray-800 px-4 pt-4">
                Distribución de Días y Pagos de Incapacidades
              </h3>

              <table className="table table-border align-middle text-gray-700 font-medium text-sm w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text">Concepto</th>
                    <th className="px-4 py-2 text">Días</th>
                    <th className="px-4 py-2 text">Valor</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td className="px-4 py-2 text-right">Días Empresa</td>
                    <td className="px-4 py-2 text-right">2</td>
                    <td className="px-4 py-2 text-right">$100.000</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-right">Días EPS</td>
                    <td className="px-4 py-2 text-right">3</td>
                    <td className="px-4 py-2 text-right">$150.000</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-right">Días ARL</td>
                    <td className="px-4 py-2 text-right">1</td>
                    <td className="px-4 py-2 text-right">$50.000</td>
                  </tr>
                  <tr className="font-semibold border-t">
                    <td className="px-4 py-2 text-right">Total</td>
                    <td className="px-4 py-2 text-right">6</td>
                    <td className="px-4 py-2 text-right">$300.000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalResumenIncapcacidades };
