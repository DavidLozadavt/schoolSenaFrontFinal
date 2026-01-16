import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  data?: any;
  solicitud?: any;
  idContrato?: any;
  onClose: () => void;
  onSave?: () => void;
}

interface DataItemInterface {
  id?: number;
  periodo?: number;
  estado?: string;
}

const ModalConfirmarVacacionesAdmin = ({ open, onClose, data, onSave, solicitud, idContrato }: ModalProps) => {

  const { enqueueSnackbar } = useSnackbar();
  const [fechaInicial, setFechaInicial] = useState(data?.fechaInicial || '');
  const [fechaFinal, setFechaFinal] = useState(data?.fechaFinal || '');
  const [periodos, setPeriodos] = useState('');
  const [valor, setValor] = useState(data?.valorMenor || '');
  const [numeroDias, setNumeroDias] = useState(data?.numeroDias || '');
  const [comentario, setComentario] = useState(data?.comentario || '');

  const [errors, setErrors] = useState<{
    fechaInicial: string;
    // fechaFinal: string;
    periodos: string;
    // numeroDias: string;
    comentario: string;
    // valor: string;
  }>({
    fechaInicial: '',
    // fechaFinal: '',
    periodos: '',
    // numeroDias: '',
    // valor: '',
    comentario: ''
  });

  const validate = () => {
    const newErrors: {
      fechaInicial: string;
      // fechaFinal: string;
      periodos: string;
      // valor: string;
      // numeroDias: string;
      comentario: string;
    } = {
      fechaInicial: '',
      // fechaFinal: '',
      periodos: '',
      // numeroDias: '',
      // valor: '',
      comentario: ''
    };

    if (!fechaInicial) newErrors.fechaInicial = 'La fecha inicial es requerida.';
    // if (!fechaFinal) newErrors.fechaFinal = 'La fecha final es requerida.';
    if (!periodos.trim()) newErrors.periodos = 'Los periodos son requeridos.';
    // if (!valor.trim()) newErrors.periodos = 'El valor es requerido.';
    // if (!numeroDias.trim() || isNaN(Number(numeroDias)))
    //   newErrors.numeroDias = 'El número de días es requerido y debe ser un número válido.';
    if (!comentario.trim()) newErrors.comentario = 'El comentario es requerido.';

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleSave = async () => {
    if (!validate()) return;

    const periodosIds = data.map((item: DataItemInterface) => Number(item.id));

    const payload = {
      periodos: periodosIds,
      fechaInicial,
      comentario,
      idContrato: idContrato
    };

    try {
      if (solicitud?.id) {
        await axios.post(`update_solicitud_by_supervisor/${solicitud?.id}`, payload);
        enqueueSnackbar('Solicitud actualizada con éxito.', { variant: 'success' });
      } else {
        await axios.post('create_solicitud_by_supervisor', payload);
        enqueueSnackbar('Solicitud guardada con éxito.', { variant: 'success' });
      }

      if (onSave) onSave();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al guardar los datos.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  useEffect(() => {
    if (data && data.length > 0) {
      const periodosString = data.map((item: DataItemInterface) => item.periodo).join(', ');
      setPeriodos(periodosString);
    }
  }, [data]);

  useEffect(() => {
    if (solicitud?.fechaEjecucion) {
      setFechaInicial(solicitud.fechaEjecucion);
    } else {
      setFechaInicial('');
    }
  }, [solicitud]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Confirmar Solicitud</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="fechaInicial" className="block mb-1 text-sm font-medium">
              Fecha Inicial
            </label>
            <input
              type="date"
              id="fechaInicial"
              className={`input p-2 border ${errors.fechaInicial ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={fechaInicial || ''}
              onChange={(e) => {
                setFechaInicial(e.target.value);
                if (errors.fechaInicial) setErrors((prev) => ({ ...prev, fechaInicial: '' }));
              }}
            />

            {errors.fechaInicial && (
              <p className="text-red-500 text-sm mt-1">{errors.fechaInicial}</p>
            )}
          </div>

          {/* <div>
            <label htmlFor="fechaFinal" className="block mb-1 text-sm font-medium">
              Fecha Final
            </label>
            <input
              type="date"
              disabled
              id="fechaFinal"
              className={`input p-2 border ${errors.fechaFinal ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={fechaFinal}
              onChange={(e) => {
                setFechaFinal(e.target.value);
                if (errors.fechaFinal) setErrors((prev) => ({ ...prev, fechaFinal: '' }));
              }}
            />
            {errors.fechaFinal && <p className="text-red-500 text-sm mt-1">{errors.fechaFinal}</p>}
          </div> */}

          <div>
            <label htmlFor="periodos" className="block mb-1 text-sm font-medium">
              Periodos
            </label>
            <input
              type="text"
              disabled
              id="periodos"
              className={`input p-2 border ${errors.periodos ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={periodos}
              onChange={(e) => {
                setPeriodos(e.target.value);
                if (errors.periodos) setErrors((prev) => ({ ...prev, periodos: '' }));
              }}
            />
            {errors.periodos && <p className="text-red-500 text-sm mt-1">{errors.periodos}</p>}
          </div>
          {/* <div>
            <label htmlFor="numeroDias" className="block mb-1 text-sm font-medium">
              Número de Días
            </label>
            <input
              disabled
              type="text"
              id="numeroDias"
              className={`input p-2 border ${errors.numeroDias ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={numeroDias}
              onChange={(e) => {
                setNumeroDias(e.target.value);
                if (errors.numeroDias) setErrors((prev) => ({ ...prev, numeroDias: '' }));
              }}
            />
            {errors.numeroDias && <p className="text-red-500 text-sm mt-1">{errors.numeroDias}</p>}
          </div> */}

          {/* <div>
            <label htmlFor="valorMayor" className="block text-sm mb-1 font-medium">
              Valor
            </label>
            <NumericFormat
              id="valor"
              disabled
              className={`input p-2 border ${errors.valor ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              prefix={'$'}
              value={valor}
              decimalScale={2}
              onChange={(e) => {
                setValor(e.target.value);
                if (errors.valor) setErrors((prev) => ({ ...prev, valor: '' }));
              }}
              placeholder="Valor"
              thousandSeparator=","
              allowNegative={false}
            />
            {errors.valor && <span className="text-red-500 text-sm">{errors.valor}</span>}
          </div> */}

          <div>
            <label htmlFor="comentario" className="block mb-1 text-sm font-medium">
              Comentario
            </label>
            <textarea
              id="comentario"
              className={`textarea p-2 border ${errors.comentario ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Escribe un comentario"
              rows={5}
              value={comentario}
              onChange={(e) => {
                setComentario(e.target.value);
                if (errors.comentario) setErrors((prev) => ({ ...prev, comentario: '' }));
              }}
            />
            {errors.comentario && <p className="text-red-500 text-sm mt-1">{errors.comentario}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalConfirmarVacacionesAdmin };
