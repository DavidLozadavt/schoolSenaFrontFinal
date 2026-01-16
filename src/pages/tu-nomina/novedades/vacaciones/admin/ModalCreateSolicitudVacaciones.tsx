import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';
import { VacacionPeridoInterface } from '../models/SolicitudesInterface';
import { ModalConfirmarVacaciones } from '../ModalConfirmarVacaciones';
import { ModalConfirmarVacacionesAdmin } from './ModalConfirmarVacacionesAdmin';
import Select from 'react-select';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave: () => void;
}

const ModalCreateSolicitudVacaciones = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contratos, setContratos] = useState<any[]>([]);
  const [comentario, setComentario] = useState('');
  const [selectedContrato, setSelectedContrato] = useState(null);
  const [error, setError] = useState('');
  const [periodosVacaciones, setPeriodosVacaciones] = useState<VacacionPeridoInterface[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<VacacionPeridoInterface[]>([]);

  useEffect(() => {
    fetchContratos();
    if (open) {
      setComentario('');
      setSelectedContrato(null);
      setPeriodosVacaciones([]);
      setSelectedPeriods([]);
    }
  }, [open]);

  const fetchContratos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('contracts_actives_nominas');
      setContratos(response.data);
    } catch (error) {
      setError('Error al cargar ');
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodoContratos = async (idContrato: number) => {
    if (!idContrato) return;
    setLoading(true);
    try {
      const response = await axios.get(`vacaciones?idContrato=${idContrato}`);
      setPeriodosVacaciones(response.data.vacaciones);
    } catch (error) {
      setError('Error al cargar las vacaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleContratoChange = (selectedOption: any) => {
    const idContrato = selectedOption ? selectedOption.value : '';

    if (!idContrato) {
      setSelectedContrato(null);
      setPeriodosVacaciones([]);
      return;
    }

    setSelectedContrato(idContrato);
    fetchPeriodoContratos(idContrato);
  };

  const handleCheckboxChange = (periodo: VacacionPeridoInterface) => {
    setSelectedPeriods((prevSelectedPeriods) => {
      if (prevSelectedPeriods.some((p) => p.id === periodo.id)) {
        return prevSelectedPeriods.filter((p) => p.id !== periodo.id);
      } else {
        return [...prevSelectedPeriods, periodo];
      }
    });
  };

  const handleAfterSave = () => {
    setIsModalOpen(false);
    onSave();
  };

  const options = contratos.map((contrato) => ({
    value: contrato.id,
    label: `${contrato.persona?.nombre1} ${contrato.persona?.apellido1}`
  }));

  const theme = JSON.parse(localStorage.getItem('settings-configs') || '{}')?.themeMode;

  const isDarkMode = theme === 'dark';
  const background = isDarkMode ? '#1B1C22' : '#F9F9F9';
  const color = isDarkMode ? 'white' : '#4B5675';
  const fontSize = isDarkMode ? '0.875rem' : '1rem'; // 👈 más pequeña en dark
  const iconColor = isDarkMode ? 'white' : '#4B5675';

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: background,
      color: color,
      fontSize: fontSize,
      borderColor: isDarkMode ? '#2D2E36' : '#E4E6EF',
      boxShadow: 'none',
      '&:hover': {
        borderColor: isDarkMode ? '#555' : '#A1A5B7'
      }
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: color,
      fontSize: fontSize
    }),
    input: (provided: any) => ({
      ...provided,
      color: isDarkMode ? 'white' : '#4B5675',
      fontSize: fontSize
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: isDarkMode ? '#aaa' : '#A1A5B7',
      fontSize: fontSize
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      color: iconColor,
      '&:hover': { color: iconColor }
    }),
    indicatorSeparator: (provided: any) => ({
      ...provided,
      backgroundColor: iconColor
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: background,
      color: color,
      borderRadius: '0.5rem',
      boxShadow: isDarkMode ? '0 2px 6px rgba(0,0,0,0.6)' : '0 2px 6px rgba(0,0,0,0.15)'
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? isDarkMode
          ? '#333'
          : '#E4E6EF'
        : state.isFocused
          ? isDarkMode
            ? '#2D2E36'
            : '#F1F1F1'
          : background,
      color: color,
      fontSize: fontSize
    })
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Crear Solicitud</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="contrato" className="block mb-1 text-sm font-medium">
              Seleccione un Contrato
            </label>
            <Select
              id="contrato"
              options={options}
              isLoading={loading}
              isClearable
              placeholder="Seleccione un contrato"
              value={options.find((option) => option.value === selectedContrato) || null}
              onChange={(selectedOption: any) => {
                setSelectedContrato(selectedOption ? selectedOption.value : '');
                handleContratoChange(selectedOption);
              }}
              className="w-full"
              styles={customStyles}
            />
          </div>

          {periodosVacaciones.length > 0 ? (
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
          ) : (
            <p className="text-center text-gray-500">No hay períodos de vacaciones disponibles.</p>
          )}

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
        <div>
          <ModalConfirmarVacacionesAdmin
            open={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
            }}
            data={selectedPeriods}
            idContrato={selectedContrato}
            onSave={handleAfterSave}
          />
        </div>
      </ModalContent>
    </Modal>
  );
};

export { ModalCreateSolicitudVacaciones };
