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

type Errors = {
  porcentaje?: string;
  valorMenor?: string;
  valorMayor?: string;
};

const ModalComision = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [porcentaje, setPorcentaje] = useState(data?.porcentaje || '');
  const [valorMenor, setValorMenor] = useState(data?.valorMenor || '');
  const [valorMayor, setValorMayor] = useState(data?.valorMayor || '');
  const [errors, setErrors] = useState<Errors>({}); 

  useEffect(() => {
    if (open) {
      setPorcentaje('');
      setValorMenor('');
      setValorMayor('');
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (data) {
      setPorcentaje(data.porcentaje || '');
      setValorMenor(data.valorMenor || '');
      setValorMayor(data.valorMayor || '');
    }
  }, [data]);

  const validateFields = () => {
    const newErrors: Errors = {};
    if (!porcentaje || isNaN(Number(porcentaje)) || porcentaje < 0 || porcentaje > 100) {
      newErrors.porcentaje = 'El porcentaje debe ser un número entre 0 y 100.';
    }
    if (!valorMenor) {
      newErrors.valorMenor = 'El valor menor es requerido.';
    }
    if (!valorMayor) {
      newErrors.valorMayor = 'El valor mayor es requerido.';
    } else if (Number(valorMayor) < Number(valorMenor)) {
      newErrors.valorMayor = 'El valor mayor debe ser igual o mayor al valor menor.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) return;

    const payload = {
      porcentaje: Number(porcentaje),
      valorMenor: String(valorMenor).replace(/[$,]/g, ''),
      valorMayor: String(valorMayor).replace(/[$,]/g, '')
    };

    try {
      if (data) {
        await axios.put(`comisiones/${data.id}`, payload);
        enqueueSnackbar('Comisión actualizada con éxito.', {
          variant: 'success'
        });
      } else {
        await axios.post('comisiones', payload);
        enqueueSnackbar('Comisión guardada con éxito.', {
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

  const handleChangePorcentaje = (value: string) => {
    setPorcentaje(value);
    if (!value || isNaN(Number(value)) || Number(value) < 0 || Number(value) > 100) {
      setErrors((prev) => ({
        ...prev,
        porcentaje: 'El porcentaje debe ser un número entre 0 y 100.'
      }));
    } else {
      setErrors((prev) => ({ ...prev, porcentaje: undefined }));
    }
  };

  const handleChangeValorMenor = (value: string) => {
    setValorMenor(value);
    if (!value) {
      setErrors((prev) => ({ ...prev, valorMenor: 'El valor menor es requerido.' }));
    } else {
      setErrors((prev) => ({ ...prev, valorMenor: undefined }));
    }
  };

  const handleChangeValorMayor = (value: string) => {
    setValorMayor(value);
    if (!value) {
      setErrors((prev) => ({ ...prev, valorMayor: 'El valor mayor es requerido.' }));
    } else if (Number(value) < Number(valorMenor)) {
      setErrors((prev) => ({
        ...prev,
        valorMayor: 'El valor mayor debe ser igual o mayor al valor menor.'
      }));
    } else {
      setErrors((prev) => ({ ...prev, valorMayor: undefined }));
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[500px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editar Comisión' : 'Nueva Comisión'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="valorMenor" className="block text-sm mb-1 font-medium">
              Valor Menor
            </label>
            <NumericFormat
              id="valorMenor"
              className={`input p-2 border ${errors.valorMenor ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              prefix={'$'}
              value={valorMenor}
              decimalScale={2}
              onValueChange={({ value }) => handleChangeValorMenor(value)}
              placeholder="Valor Menor"
              thousandSeparator=","
              allowNegative={false}
            />
            {errors.valorMenor && <span className="text-red-500 text-sm">{errors.valorMenor}</span>}
          </div>

          <div>
            <label htmlFor="valorMayor" className="block text-sm mb-1 font-medium">
              Valor Mayor
            </label>
            <NumericFormat
              id="valorMayor"
              className={`input p-2 border ${errors.valorMayor ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              prefix={'$'}
              value={valorMayor}
              decimalScale={2}
              onValueChange={({ value }) => handleChangeValorMayor(value)}
              placeholder="Valor Mayor"
              thousandSeparator=","
              allowNegative={false}
            />
            {errors.valorMayor && <span className="text-red-500 text-sm">{errors.valorMayor}</span>}
          </div>

          <div>
            <label htmlFor="porcentaje" className="block mb-1 text-sm font-medium">
              Porcentaje (%)
            </label>
            <input
              id="porcentaje"
              type="text"
              step="0.1"
              min="0"
              max="100"
              className={`input p-2 border ${errors.porcentaje ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Porcentaje (%)"
              value={porcentaje}
              onChange={(e) => handleChangePorcentaje(e.target.value)}
            />
            {errors.porcentaje && <span className="text-red-500 text-sm">{errors.porcentaje}</span>}
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalComision };
