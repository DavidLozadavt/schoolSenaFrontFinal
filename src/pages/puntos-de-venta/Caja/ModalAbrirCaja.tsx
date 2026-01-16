import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Modal,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalTitle,
} from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';
import { Caja } from '../models/TypesInterface';
import { useNavigate } from 'react-router-dom';
interface ModalProps {
  open: boolean;
  idPunto?: any;
  onClose: () => void;
  onSave?: (data: any) => void;
  redirectTo?: string;
}


const ModalAbrirCaja = ({ open, idPunto, onClose, onSave, redirectTo }: ModalProps) => {
  const [cajaData, setCajaData] = useState<Caja | null>(null);
  const [exedente, setExedente] = useState<string>('');
  const [observacion, setObservacion] = useState<string>('');
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      fetchCajaData();
    }
  }, [open]);

  const fetchCajaData = async () => {
    try {
      const response = await axios.get(`caja-latest/${idPunto}`);
      setCajaData(response.data);
      setExedente(response.data.exedente || '');
      setObservacion('');
    } catch (error) {
      enqueueSnackbar('Error al cargar los datos de la caja', { variant: 'error' });
    }
  };
  const handleSave = async () => {
    try {
      const dataToSave = {
        ...cajaData,
        exedente,
        observacion,
      };

      await axios.post(`caja-abrir/${idPunto}`, dataToSave);
      enqueueSnackbar('Caja abierta correctamente', { variant: 'success' });

      onClose();
      if (onSave) onSave(dataToSave);

      if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate(`/caja/${idPunto}`);
      }
    } catch (error) {
      const errorMessage =
        (error as any).response?.data?.message || 'Error al guardar los datos de la caja';
      console.error('Error del backend:', errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'warning' });
    }
  };

  const nombreCajero =
    cajaData?.usuario?.persona
      ? `${cajaData.usuario.persona.nombre1 ?? ''} ${cajaData.usuario.persona.nombre2 ?? ''} ${cajaData.usuario.persona.apellido1 ?? ''} ${cajaData.usuario.persona.apellido2 ?? ''}`
      : '';

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>{'Abrir caja'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          {/* Último cajero */}
          <div>
            <label htmlFor="ultimoCajero" className="block mb-1 text-sm font-medium">
              Último Cajero
            </label>
            <input
              id="ultimoCajero"
              type="text"
              readOnly
              value={nombreCajero}
              className="w-full p-2 border border-gray-300 rounded-md input"
            />
          </div>

          {/* Observación anterior */}
          <div>
            <label htmlFor="observacionAnterior" className="block mb-1 text-sm font-medium">
              Observación Anterior
            </label>
            <textarea
              id="observacionAnterior"

              value={cajaData?.observacion || ''}
              className="w-full p-2 border border-gray-300 rounded-md textarea"
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="valorGasto" className="block mb-1 text-sm font-medium">
              Valor Gasto
            </label>
            <NumericFormat
              id="valorGasto"
              value={cajaData?.valorGasto || ''}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md input"
              thousandSeparator
              prefix="$"
            />
          </div>
          <div>
            <label htmlFor="valorEfectivo" className="block mb-1 text-sm font-medium">
              Valor en Efectivo
            </label>
            <NumericFormat
              id="valorEfectivo"
              value={cajaData?.valorEfectivo || ''}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md input"
              thousandSeparator
              prefix="$"
            />
          </div>
          <div>
            <label htmlFor="valorTransaccion" className="block mb-1 text-sm font-medium">
              Valor Transacción
            </label>
            <NumericFormat
              id="valorTransaccion"
              value={cajaData?.valorTransaccion || ''}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md input"
              thousandSeparator
              prefix="$"
            />
          </div>



          {/* Nuevo Excedente */}
          <div>
            <label htmlFor="exedente" className="block mb-1 text-sm font-medium">
              Excedente
            </label>
            <NumericFormat
              id="exedente"
              value={cajaData?.exedente || ''}
              onValueChange={({ value }) => setExedente(value)}
              className="w-full p-2 border border-gray-300 rounded-md input"
              thousandSeparator
              prefix="$"
            />
          </div>

          {/* Nueva observación */}
          <div>
            <label htmlFor="observacion" className="block mb-1 text-sm font-medium">
              Observación
            </label>
            <textarea
              id="observacion"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md textarea"
              rows={5}
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
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

export default ModalAbrirCaja;
