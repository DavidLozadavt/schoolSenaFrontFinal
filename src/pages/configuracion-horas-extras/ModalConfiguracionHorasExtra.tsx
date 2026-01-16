import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalConfiguracionHorasExtra = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [detalle, setDetalle] = useState(data?.detalle || '');
  const [porcentaje, setPorcentaje] = useState(data?.porcentaje || '');
  const [horaInicial, setHoraInicial] = useState(data?.horaInicial || '');
  const [horaFinal, setHoraFinal] = useState(data?.horaFinal || '');
  const [dias, setDias] = useState(data?.dias || '');
  const [errors, setErrors] = useState({
    detalle: '',
    porcentaje: '',
    horaInicial: '',
    horaFinal: '',
    dias: ''
  });

  useEffect(() => {
    if (open) {
      setDetalle('');
      setPorcentaje('');
      setHoraInicial('');
      setHoraFinal('');
      setDias('');
      setErrors({ detalle: '', porcentaje: '', horaInicial: '', horaFinal: '', dias: '' });
    }
  }, [open]);

  useEffect(() => {
    if (data) {
      setDetalle(data.detalle || '');
      setPorcentaje(data.porcentaje || '');
      setHoraInicial(data.horaInicial || '');
      setHoraFinal(data.horaFinal || '');
      setDias(data.dias || '');
    }
  }, [data]);

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'detalle':
        return value.trim() ? '' : 'El detalle es requerido.';
      case 'porcentaje': {
        const numValue = Number(value);
        if (!value || isNaN(numValue) || numValue < 0) {
          return 'El porcentaje debe ser un número válido.';
        }
        return '';
      }
      case 'horaInicial':
      case 'horaFinal':
        return value
          ? ''
          : `La ${field === 'horaInicial' ? 'hora inicial' : 'hora final'} es requerida.`;
      case 'dias':
        return value.trim() ? '' : 'Los días son requeridos.';
      default:
        return '';
    }
  };

  const validate = () => {
    const newErrors = {
      detalle: validateField('detalle', detalle),
      porcentaje: validateField('porcentaje', porcentaje),
      horaInicial: validateField('horaInicial', horaInicial),
      horaFinal: validateField('horaFinal', horaFinal),
      dias: validateField('dias', dias)
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      detalle,
      porcentaje: Number(porcentaje),
      horaInicial,
      horaFinal,
      dias
    };

    try {
      if (data) {
        await axios.put(`configuracion_horas_extra/${data.id}`, payload);
        enqueueSnackbar('Configuración actualizada con éxito.', {
          variant: 'success'
        });
      } else {
        await axios.post('configuracion_horas_extra', payload);
        enqueueSnackbar('Configuración guardada con éxito.', {
          variant: 'success'
        });
      }
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error) {
      enqueueSnackbar('Error al guardar los datos.', {
        variant: 'solid',
        state: 'danger'
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[500px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editar Configuración' : 'Nueva Configuración'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="detalle" className="block mb-1 text-sm font-medium">
              Detalle
            </label>
            <textarea
              id="detalle"
              className={`textarea p-2 border ${errors.detalle ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Detalle"
              value={detalle}
              onChange={(e) => {
                const value = e.target.value;
                setDetalle(value);
                setErrors((prev) => ({ ...prev, detalle: validateField('detalle', value) }));
              }}
            />
            {errors.detalle && <p className="text-red-500 text-sm mt-1">{errors.detalle}</p>}
          </div>

          <div>
            <label htmlFor="porcentaje" className="block mb-1 text-sm font-medium">
              Porcentaje
            </label>
            <input
              id="porcentaje"
              type="number"
              className={`input p-2 border ${errors.porcentaje ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Porcentaje"
              value={porcentaje}
              onChange={(e) => {
                const value = e.target.value;
                setPorcentaje(value);
                setErrors((prev) => ({ ...prev, porcentaje: validateField('porcentaje', value) }));
              }}
            />
            {errors.porcentaje && <p className="text-red-500 text-sm mt-1">{errors.porcentaje}</p>}
          </div>

          <div>
            <label htmlFor="horaInicial" className="block mb-1 text-sm font-medium">
              Hora Inicial
            </label>
            <input
              id="horaInicial"
              type="time"
              className={`input p-2 border ${errors.horaInicial ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Hora Inicial"
              value={horaInicial}
              onChange={(e) => {
                const value = e.target.value;
                setHoraInicial(value);
                setErrors((prev) => ({
                  ...prev,
                  horaInicial: validateField('horaInicial', value)
                }));
              }}
            />
            {errors.horaInicial && (
              <p className="text-red-500 text-sm mt-1">{errors.horaInicial}</p>
            )}
          </div>

          <div>
            <label htmlFor="horaFinal" className="block text-sm mb-1 font-medium">
              Hora Final
            </label>
            <input
              id="horaFinal"
              type="time"
              className={`input p-2 border ${errors.horaFinal ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Hora Final"
              value={horaFinal}
              onChange={(e) => {
                const value = e.target.value;
                setHoraFinal(value);
                setErrors((prev) => ({ ...prev, horaFinal: validateField('horaFinal', value) }));
              }}
            />
            {errors.horaFinal && <p className="text-red-500 text-sm mt-1">{errors.horaFinal}</p>}
          </div>

          <div>
            <label htmlFor="dias" className="block text-sm mb-1 font-medium">
              Días
            </label>
            <textarea
              id="dias"
              className={`textarea p-2 border ${errors.dias ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Días"
              value={dias}
              onChange={(e) => {
                const value = e.target.value;
                setDias(value);
                setErrors((prev) => ({ ...prev, dias: validateField('dias', value) }));
              }}
            />
            {errors.dias && <p className="text-red-500 text-sm mt-1">{errors.dias}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalConfiguracionHorasExtra };
