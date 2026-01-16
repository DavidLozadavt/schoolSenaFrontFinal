import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { ModalConfirmarVacaciones } from './ModalConfirmarVacaciones';
import { VacacionPeridoInterface } from './models/SolicitudesInterface';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave: () => void;
}

const ModalSolictudVacaciones = ({ open, onClose, data, onSave }: ModalProps) => {

  const { enqueueSnackbar } = useSnackbar();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [periodosVacaciones, setPeriodosVacaciones] = useState<VacacionPeridoInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [solicitud, setSolicitud] = useState<VacacionPeridoInterface | undefined>(undefined);
  const [selectedPeriods, setSelectedPeriods] = useState<VacacionPeridoInterface[]>([]);

  useEffect(() => {
    if (open) {
      setSelectedPeriods([]);
    }
  }, [open]);

  const handleCheckboxChange = (periodo: VacacionPeridoInterface) => {
    setSelectedPeriods((prevSelectedPeriods) => {
      if (prevSelectedPeriods.some((p) => p.id === periodo.id)) {
        return prevSelectedPeriods.filter((p) => p.id !== periodo.id);
      } else {
        return [...prevSelectedPeriods, periodo];
      }
    });
  };

  const fetchPeriodosVacaciones = async () => {
    setLoading(true);
    try {
      const response = await axios.get('vacaciones');
      setPeriodosVacaciones(response.data.vacaciones);
    } catch (error) {
      setError('Error al cargar ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriodosVacaciones();
  }, []);

  const handleAfterSave = () => {
    setIsModalOpen(false);
    onSave();
  };

  useEffect(() => {
    if (open) {
      setSelectedPeriods(data?.vacaciones || []);
      setSolicitud(data);
    }
  }, [open, data]);

  return (
    <Modal open={open} onClose={onClose}>
      <>
        <ModalContent className="max-w-[600px] top-[5%] p-4">
          <ModalHeader>
            <ModalTitle>Periodos</ModalTitle>
            <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
              <KeenIcon icon="cross" />
            </button>
          </ModalHeader>
          <ModalBody className="grid gap-3 px-0 py-5">
            <table className="table table-border rounded-sm align-middle text-gray-700 font-medium text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-center">Período</th>
                  <th className="p-2 text-center">Estado</th>
                  <th className="p-2 text-center">Seleccionar</th>
                </tr>
              </thead>
              <tbody>
                {periodosVacaciones.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="text-center border border-gray-300 px-4 py-2">{row.periodo}</td>
                    <td className="p-2 text-center">
                      <span
                        className={`px-2 py-1 rounded text-white text-xs ${
                          row.estado === 'LIQUIDADO'
                            ? 'bg-green-500'
                            : row.estado === 'PENDIENTE'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      >
                        {row.estado}
                      </span>
                    </td>
                    <td className="flex items-center justify-center">
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={selectedPeriods.some((p) => p.id === row.id)}
                          onChange={() => handleCheckboxChange(row)}
                        />
                        <span className="slider round"></span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end gap-3 mt-4 px-4">
              <button className="btn btn-sm btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button
                disabled={selectedPeriods.length === 0}
                onClick={() => {
                  setIsModalOpen(true);
                }}
                className="btn btn-sm btn-primary"
              >
                Solicitar
              </button>
            </div>
          </ModalBody>
        </ModalContent>
        <div>
          <ModalConfirmarVacaciones
            open={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
            }}
            data={selectedPeriods}
            solicitud={solicitud}
            onSave={handleAfterSave}
          />
        </div>
      </>
    </Modal>
  );
};

export { ModalSolictudVacaciones };
