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

const ModalTipoIncapacidad = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [tipoIncapacidad, setTipoIncapacidad] = useState('');
  const [responsable, setResponsable] = useState('');
  const [porcentajeDePagoEmpleador , setPorcentajeDePago] = useState('');
  const [duracionCubierta, setDuracionCubierta] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [actualizar, setActualizar] = useState('');

  const validate = () => {
    const newErrors: {
      tipoIncapacidad: string;
      responsable: string;
      porcentajeDePagoEmpleador : string;
      duracionCubierta: string;
      descripcion: string;
      actualizar: string;
    } = {
      tipoIncapacidad: '',
      responsable: '',
      porcentajeDePagoEmpleador : '',
      duracionCubierta: '',
      descripcion: '',
      actualizar: ''
    };

    if (!tipoIncapacidad.trim()) newErrors.tipoIncapacidad = 'El tipo de incapacidad es requerido.';
    if (!responsable.trim()) newErrors.responsable = 'El responsable es requerido.';
    if (!porcentajeDePagoEmpleador .trim() || isNaN(Number(porcentajeDePagoEmpleador .replace(/[%]/g, '')))) {
      newErrors.porcentajeDePagoEmpleador  =
        'El porcentaje de pago es requerido y debe ser un número válido.';
    } else if (Number(porcentajeDePagoEmpleador .replace(/[%]/g, '')) > 100) {
      newErrors.porcentajeDePagoEmpleador  = 'El porcentaje de pago no puede ser mayor a 100.';
    }
    if (!actualizar.trim()) newErrors.actualizar = 'Debe seleccionar una opción.';
    if (!duracionCubierta.trim()) newErrors.duracionCubierta = 'La duración es requerida.';
    if (!descripcion.trim()) newErrors.descripcion = 'La descripción es requerida.';

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      tipoIncapacidad,
      responsable,
      porcentajeDePagoEmpleador : String(porcentajeDePagoEmpleador ).replace(/[%]/g, ''),
      duracionCubierta,
      descripcion,
      actualizar
    };

    try {
      if (data) {
        await axios.put(`tipos_incapacidades/${data.id}`, payload);
        enqueueSnackbar('Incapacidad actualizada con éxito.', { variant: 'success' });
      } else {
        await axios.post('tipos_incapacidades', payload);
        enqueueSnackbar('Incapacidad guardada con éxito.', { variant: 'success' });
      }
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error) {
      enqueueSnackbar('Error al guardar los datos.', { variant: 'solid', state: 'danger' });
    }
  };

  const [errors, setErrors] = useState<{
    tipoIncapacidad: string;
    responsable: string;
    porcentajeDePagoEmpleador : string;
    duracionCubierta: string;
    descripcion: string;
    actualizar: string;
  }>({
    tipoIncapacidad: '',
    responsable: '',
    porcentajeDePagoEmpleador : '',
    duracionCubierta: '',
    descripcion: '',
    actualizar: ''
  });

  useEffect(() => {
    if (open) {
      setTipoIncapacidad(data?.tipoIncapacidad || '');
      setResponsable(data?.responsable || '');
      setPorcentajeDePago(data?.porcentajeDePagoEmpleador  ? String(data.porcentajeDePagoEmpleador ) : '');
      setDuracionCubierta(data?.duracionCubierta || '');
      setDescripcion(data?.descripcion || '');
      setActualizar(data?.actualizar || '');

      setErrors({
        tipoIncapacidad: '',
        responsable: '',
        porcentajeDePagoEmpleador : '',
        duracionCubierta: '',
        descripcion: '',
        actualizar: ''
      });
    }
  }, [open, data]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>
            {data ? 'Editar Tipo de Incapacidad' : 'Nuevo Tipo de Incapacidad'}
          </ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label className="block mb-1 text-sm font-medium">Tipo de Incapacidad</label>
            <textarea
              className={`textarea p-2 border ${errors.tipoIncapacidad ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={tipoIncapacidad}
              placeholder="Ejemplo: Enfermedad común, accidente laboral, etc."
              rows={3}
              onChange={(e) => {
                setTipoIncapacidad(e.target.value);
                if (errors.tipoIncapacidad) setErrors((prev) => ({ ...prev, tipoIncapacidad: '' }));
              }}
            />
            {errors.tipoIncapacidad && (
              <p className="text-red-500 text-sm mt-1">{errors.tipoIncapacidad}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Responsable</label>
            <input
              type="text"
              className={`textarea p-2 border ${errors.responsable ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={responsable}
              placeholder="Ejemplo: Empresa, ARL, EPS, etc."
              onChange={(e) => {
                setResponsable(e.target.value);
                if (errors.responsable) setErrors((prev) => ({ ...prev, responsable: '' }));
              }}
            />
            {errors.responsable && (
              <p className="text-red-500 text-sm mt-1">{errors.responsable}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Porcentaje de Pago (%)</label>
            <input
              type="text"
              className={`input p-2 border ${errors.porcentajeDePagoEmpleador  ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={porcentajeDePagoEmpleador }
              placeholder="Ejemplo: 50, 75, 100"
              onChange={(e) => {
                const value = e.target.value.replace(/[%]/g, '');
                if (!isNaN(Number(value)) && Number(value) > 100) {
                  setErrors((prev) => ({
                    ...prev,
                    porcentajeDePagoEmpleador : 'El porcentaje de pago no puede ser mayor a 100.'
                  }));
                } else {
                  setErrors((prev) => ({ ...prev, porcentajeDePagoEmpleador : '' }));
                }
                setPorcentajeDePago(e.target.value);
              }}
            />

            {errors.porcentajeDePagoEmpleador  && (
              <p className="text-red-500 text-sm mt-1">{errors.porcentajeDePagoEmpleador }</p>
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Duración Cubierta</label>
            <textarea
              className={`textarea p-2 border ${errors.duracionCubierta ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={duracionCubierta}
              placeholder="Ejemplo: 15 días, 2 meses, etc."
              rows={3}
              onChange={(e) => {
                setDuracionCubierta(e.target.value);
                if (errors.duracionCubierta)
                  setErrors((prev) => ({ ...prev, duracionCubierta: '' }));
              }}
            />
            {errors.duracionCubierta && (
              <p className="text-red-500 text-sm mt-1">{errors.duracionCubierta}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Descripción</label>
            <textarea
              className={`textarea p-2 border ${errors.descripcion ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={descripcion}
              placeholder="Añade detalles sobre la incapacidad"
              rows={3}
              onChange={(e) => {
                setDescripcion(e.target.value);
                if (errors.descripcion) setErrors((prev) => ({ ...prev, descripcion: '' }));
              }}
            />
            {errors.descripcion && (
              <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>
            )}
          </div>

          <div>
            <label className="mb-1 text-sm font-medium flex items-center gap-2">
              Extender Incapacidad
              <div className="relative group cursor-pointer">
                <KeenIcon icon="information-1" className="w-4 h-4 text-blue-500" />

                <div
                  className="
                    absolute z-10 hidden group-hover:block
                    text-xs rounded-md p-2 w-56 top-5 left-0 shadow-lg
                    bg-gray-100 text-gray-800
                    dark:bg-gray-800 dark:text-gray-100
                    border border-gray-300 dark:border-gray-700
                  "
                >
                  Si marcas "Sí", la incapacidad podrá extenderse posteriormente.
                </div>
              </div>
            </label>

            <select
              className={`select p-2 border ${
                errors.actualizar ? 'border-red-500' : 'border-gray-300'
              } rounded-md w-full`}
              value={actualizar}
              onChange={(e) => {
                setActualizar(e.target.value);
                if (errors.actualizar) setErrors((prev) => ({ ...prev, actualizar: '' }));
              }}
            >
              <option value="">Seleccione una opción</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>

            {errors.actualizar && <p className="text-red-500 text-sm mt-1">{errors.actualizar}</p>}
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

export { ModalTipoIncapacidad };
