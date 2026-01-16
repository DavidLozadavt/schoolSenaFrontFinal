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

const ModalSoportesIncapacidadLicencia = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [fechaInicial, setFechaInicial] = useState(data?.fechaInicial || '');
  const [fechaFinal, setFechaFinal] = useState(data?.fechaFinal || '');
  const [periodos, setPeriodos] = useState(data?.periodos || '');
  const [valor, setValor] = useState(data?.valorMenor || '');
  const [numeroDias, setNumeroDias] = useState(data?.numeroDias || '');
  const [comentario, setComentario] = useState(data?.comentario || '');

  const [errors, setErrors] = useState<{
    fechaInicial: string;
    fechaFinal: string;
    periodos: string;
    numeroDias: string;
    comentario: string;
    valor: string;
  }>({
    fechaInicial: '',
    fechaFinal: '',
    periodos: '',
    numeroDias: '',
    valor: '',
    comentario: ''
  });

  useEffect(() => {
    if (data) {
      setFechaInicial(data.fechaInicial || '');
      setFechaFinal(data.fechaFinal || '');
      setPeriodos(data.periodos || '');
      setNumeroDias(data.numeroDias || '');
      setValor(data.valor || '');
      setComentario(data.comentario || '');
    }
  }, [data]);

  const validate = () => {
    const newErrors: {
      fechaInicial: string;
      fechaFinal: string;
      periodos: string;
      valor: string;
      numeroDias: string;
      comentario: string;
    } = {
      fechaInicial: '',
      fechaFinal: '',
      periodos: '',
      numeroDias: '',
      valor: '',
      comentario: ''
    };

    if (!fechaInicial) newErrors.fechaInicial = 'La fecha inicial es requerida.';
    if (!fechaFinal) newErrors.fechaFinal = 'La fecha final es requerida.';
    if (!periodos.trim()) newErrors.periodos = 'Los periodos son requeridos.';
    if (!valor.trim()) newErrors.periodos = 'El valor es requerido.';
    if (!numeroDias.trim() || isNaN(Number(numeroDias)))
      newErrors.numeroDias = 'El número de días es requerido y debe ser un número válido.';
    if (!comentario.trim()) newErrors.comentario = 'El comentario es requerido.';

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      fechaInicial,
      fechaFinal,
      periodos,
      numeroDias: Number(numeroDias),
      comentario,
      valor: String(valor).replace(/[$,]/g, '')
    };

    try {
      if (data) {
        // await axios.put(`cost_centers/${data.id}`, payload);
        enqueueSnackbar('Datos actualizados con éxito.', {
          variant: 'success'
        });
      } else {
        await axios.post('cost_centers', payload);
        enqueueSnackbar('Datos guardados con éxito.', {
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
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Soporte</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
        <h1>Soporte</h1>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalSoportesIncapacidadLicencia };
