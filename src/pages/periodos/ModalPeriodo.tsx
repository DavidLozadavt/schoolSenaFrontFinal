import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components/keenicons';
import { useSnackbar } from 'notistack';

export type PeriodoInterface = {
  id?: string | number;
  nombrePeriodo: string;
  fechaInicio?: string;
  fechaFin?: string;
};

interface ModalProps {
  open: boolean;
  periodo?: PeriodoInterface;
  onClose: () => void;
  onSave?: () => void; // 🔥 solo notifica
}

const ModalPeriodo = ({ open, periodo, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [nombre, setNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ nombre?: string }>({});

  useEffect(() => {
    if (periodo) {
      setNombre(periodo.nombrePeriodo || '');
      setFechaInicio(periodo.fechaInicio || '');
      setFechaFin(periodo.fechaFin || '');
    } else {
      setNombre('');
      setFechaInicio('');
      setFechaFin('');
    }
    setErrors({});
  }, [periodo, open]);

  const validate = () => {
    const newErrors: { nombre?: string } = {};
    if (!nombre.trim()) newErrors.nombre = 'Nombre del periodo requerido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        nombrePeriodo: nombre.trim(),
        fechaInicial: fechaInicio || null, // 🔥 backend
        fechaFinal: fechaFin || null, // 🔥 backend
        idEmpresa: 1 // 🔥 temporal
      };

      if (periodo?.id) {
        await axios.put(`periodos/${periodo.id}`, payload);
        enqueueSnackbar('Periodo actualizado correctamente.', { variant: 'success' });
      } else {
        await axios.post('periodos', payload);
        enqueueSnackbar('Periodo creado correctamente.', { variant: 'success' });
      }

      if (onSave) {
        onSave();
      }
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || 'Error al guardar el periodo';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent className="max-w-[640px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>{periodo?.id ? 'Editar periodo' : 'Crear periodo'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={handleClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-5 px-0 py-5">
          <div className="w-[calc(100%-2rem)] mx-auto">
            <label className="block text-sm font-medium mb-1">Nombre periodo</label>
            <input
              className={`input p-2 w-full ${errors.nombre ? 'border-red-500' : 'border-gray-300'}`}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            {errors.nombre && <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4 w-[calc(100%-2rem)] mx-auto">
            <div>
              <label className="block text-sm font-medium mb-1">Inicio</label>
              <input
                type="date"
                className="input p-2 w-full"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fin</label>
              <input
                type="date"
                className="input p-2 w-full"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary btn-sm" onClick={handleClose} disabled={saving}>
              CANCELAR
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'ACEPTAR'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalPeriodo;
