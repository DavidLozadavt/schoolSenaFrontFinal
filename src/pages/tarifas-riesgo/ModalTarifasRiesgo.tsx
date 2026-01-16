import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalTarifasRiesgo = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [nivel, setNivel] = useState(data?.nivel || '');
  const [porcentajeCotizacion, setCotizacion] = useState(data?.porcentajeCotizacion || '');
  const [errors, setErrors] = useState<{ nivel: string; porcentajeCotizacion: string }>({
    nivel: '',
    porcentajeCotizacion: ''
  });

  useEffect(() => {
    if (open) {
      setNivel('');
      setCotizacion('');
      setErrors({ nivel: '', porcentajeCotizacion: '' });
    }
  }, [open]);

  useEffect(() => {
    if (data) {
      setNivel(data.nivel || '');
      setCotizacion(data.porcentajeCotizacion || '');
    }
  }, [data]);

  const validateField = (field: string, value: string): string => {
    if (field === 'nivel') {
      if (!value || isNaN(Number(value))) {
        return 'El nivel es requerido y debe ser un número válido.';
      }
    }

    if (field === 'porcentajeCotizacion') {
      const porcentaje = Number(value);
      if (!value || isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
        return 'La cotización debe ser un número entre 0 y 100.';
      }
    }

    return '';
  };

  const validate = () => {
    const nivelError = validateField('nivel', nivel);
    const porcentajeCotizacionError = validateField('porcentajeCotizacion', porcentajeCotizacion);

    setErrors({ nivel: nivelError, porcentajeCotizacion: porcentajeCotizacionError });

    return !nivelError && !porcentajeCotizacionError;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      nivel: Number(nivel),
      porcentajeCotizacion: Number(porcentajeCotizacion)
    };

    try {
      if (data) {
        await axios.put(`tarifas_arls/${data.id}`, payload);
        enqueueSnackbar('Tarifa actualizada con éxito.', {
          variant: 'success'
        });
      } else {
        await axios.post('tarifas_arls', payload);
        enqueueSnackbar('Tarifa guardada con éxito.', {
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
      <ModalContent className="max-w-[500px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editar Tarifa de Riesgo' : 'Nueva Tarifa de Riesgo'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="nivel" className="block text-sm mb-2 font-medium">
              Nivel
            </label>
            <input
              id="nivel"
              type="text"
              className={`input p-2 border ${errors.nivel ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Nivel"
              value={nivel}
              onChange={(e) => {
                const value = e.target.value;
                setNivel(value);
                const error = validateField('nivel', value);
                setErrors((prev) => ({ ...prev, nivel: error }));
              }}
            />
            {errors.nivel && <p className="text-red-500 text-sm mt-1">{errors.nivel}</p>}
          </div>

          <div>
            <label htmlFor="porcentajeCotizacion" className="block mb-1 text-sm font-medium">
              Cotización (%)
            </label>
            <input
              id="porcentajeCotizacion"
              type="text"
              step="0.1"
              min="0"
              max="100"
              className={`input p-2 border ${errors.porcentajeCotizacion ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Cotización (%)"
              value={porcentajeCotizacion}
              onChange={(e) => {
                const value = e.target.value;
                setCotizacion(value);
                const error = validateField('porcentajeCotizacion', value);
                setErrors((prev) => ({ ...prev, porcentajeCotizacion: error }));
              }}
            />
            {errors.porcentajeCotizacion && (
              <p className="text-red-500 text-sm mt-1">{errors.porcentajeCotizacion}</p>
            )}
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

export { ModalTarifasRiesgo };
