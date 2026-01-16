import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { DescuentoPlanillaModel } from './model/DescuentoPlanillamodel';
import { useSnackbar } from 'notistack';


interface ModalProps {
  open: boolean;
  descuentoPlanilla?: DescuentoPlanillaModel;
  onClose: () => void;
  onSave?: () => void;
}

const ModalDescuentoPlanilla = ({ open, onClose, onSave, descuentoPlanilla }: ModalProps) => {
  const [nombre, setNombre] = useState('');
  const [porcentaje, setPorcentaje] = useState('');
  const [valor, setValor] = useState('');
  const [obligatorio, setObligatorio] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  const [errors, setErrors] = useState({
    nombre: '',
    valor: '',
    porcentaje: '',
  });

  useEffect(() => {
    if (open) {
      setNombre(descuentoPlanilla?.nombre ?? '');
      setPorcentaje(
        descuentoPlanilla?.porcentaje ? formatNumber(descuentoPlanilla.porcentaje) : ''
      );
      setValor(descuentoPlanilla?.valor ? formatNumber(descuentoPlanilla.valor) : '');
      setObligatorio(descuentoPlanilla?.obligatorio ?? true); 
    }
  }, [open, descuentoPlanilla]);

  const formatNumber = (num: number | string) => {
    if (!num && num !== 0) return '';
    const n = typeof num === 'string' ? num.replace(/\./g, '') : num.toString();
    const parsed = parseFloat(n);
    if (isNaN(parsed)) return '';
    return parsed.toLocaleString('es-CO');
  };

  const handleNumericInput = (
    value: string,
    setter: (v: string) => void,
    maxValue?: number
  ) => {
    const cleanValue = value.replace(/\./g, '').replace(/^0+(?=\d)/, '');
    if (!/^\d*$/.test(cleanValue)) return;

    const numericValue = parseFloat(cleanValue || '0');
    if (maxValue && numericValue > maxValue) {
      setter(formatNumber(maxValue));
      return;
    }

    setter(formatNumber(cleanValue));
  };

const handleSave = async () => {
  const cleanPorcentaje = porcentaje.replace(/\./g, '');
  const cleanValor = valor.replace(/\./g, '');

  const newErrors = { nombre: '', porcentaje: '', valor: '' };
  if (!nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
  if (!cleanPorcentaje) newErrors.porcentaje = 'El porcentaje es obligatorio';
  if (parseFloat(cleanPorcentaje) > 100)
    newErrors.porcentaje = 'El porcentaje no puede ser mayor a 100';
  if (!cleanValor) newErrors.valor = 'El valor es obligatorio';

  setErrors(newErrors);
  if (Object.values(newErrors).some((e) => e)) return;

  try {
    const data = {
      nombre: nombre.trim(),
      porcentaje: parseFloat(cleanPorcentaje),
      valor: parseFloat(cleanValor),
      obligatorio,
    };

    if (descuentoPlanilla) {
      await axios.put(`descuentos_planilla/${descuentoPlanilla.id}`, data);
      enqueueSnackbar('Descuento actualizado exitosamente ', { variant: 'success' });
    } else {
      await axios.post('descuentos_planilla', data);
      enqueueSnackbar('Descuento creado exitosamente', { variant: 'success' });
    }

    setNombre('');
    setPorcentaje('');
    setValor('');
    setObligatorio(true);
    onSave?.();
    onClose();
  } catch (error: any) {
    console.error('Error al guardar Descuento de revisión:', error);
    enqueueSnackbar(
      error.response?.data?.message || 'Ocurrió un error al guardar el descuento ',
      { variant: 'error' }
    );
  }
};


  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>
            {descuentoPlanilla ? 'Editar Descuento de Revisión' : 'Nuevo Descuento de Revisión'}
          </ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">

          <div>
            <label htmlFor="nombre" className="block mb-1 text-sm font-medium">
              Nombre
            </label>
            <input
              id="nombre"
              className={`input p-2 border ${errors.nombre ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Ingrese el nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
          </div>

          <div>
            <label htmlFor="porcentaje" className="block mb-1 text-sm font-medium">
              Porcentaje del Descuento
            </label>
            <input
              id="porcentaje"
              type="text"
              inputMode="numeric"
              className={`input p-2 border ${errors.porcentaje ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Ingrese el porcentaje (máx. 100)"
              value={porcentaje}
              onChange={(e) => handleNumericInput(e.target.value, setPorcentaje, 100)}
            />
            {errors.porcentaje && <p className="text-red-500 text-sm mt-1">{errors.porcentaje}</p>}
          </div>

          {/* Valor */}
          <div>
            <label htmlFor="valor" className="block mb-1 text-sm font-medium">
              Valor del Descuento
            </label>
            <input
              id="valor"
              type="text"
              inputMode="numeric"
              className={`input p-2 border ${errors.valor ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Ingrese el valor"
              value={valor}
              onChange={(e) => handleNumericInput(e.target.value, setValor)}
            />
            {errors.valor && <p className="text-red-500 text-sm mt-1">{errors.valor}</p>}
          </div>

          <div className="flex items-center mt-3">
            <input
              id="obligatorio"
              type="checkbox"
              checked={obligatorio}
              onChange={(e) => setObligatorio(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="obligatorio" className="ml-2 text-sm text-gray-700">
              Obligatorio
            </label>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 mt-5 px-4">
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

export default ModalDescuentoPlanilla;
