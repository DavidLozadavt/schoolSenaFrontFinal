import { useEffect, useState } from 'react';
import { KeenIcon } from '@/components';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import axios from 'axios';
import { useSnackbar } from 'notistack';

interface Item {
  id: number;
  nombreItem: string;
  descripcion: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  seleccionar: boolean;
  created_at?: string;
}

interface ModalFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemEditar?: Item | null;
}

export const ModalForm: React.FC<ModalFormProps> = ({ open, onClose, onSuccess, itemEditar }) => {
  const { enqueueSnackbar } = useSnackbar();
  const esEdicion = !!itemEditar;

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (itemEditar) {
        setNombre(itemEditar.nombreItem);
        setDescripcion(itemEditar.descripcion ?? '');
        setHoraInicio(itemEditar.hora_inicio ? itemEditar.hora_inicio.slice(0, 16) : '');
        setHoraFin(itemEditar.hora_fin ? itemEditar.hora_fin.slice(0, 16) : '');
      } else {
        setNombre('');
        setDescripcion('');
        setHoraInicio('');
        setHoraFin('');
      }
    }
  }, [itemEditar, open]);

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      enqueueSnackbar('El nombre es obligatorio', { variant: 'warning' });
      return;
    }
    if (horaFin && !horaInicio) {
      enqueueSnackbar('Debes seleccionar hora de inicio', { variant: 'warning' });
      return;
    }
    const inicio = horaInicio ? new Date(horaInicio) : null;
    const fin = horaFin ? new Date(horaFin) : null;
    if (inicio && fin && fin < inicio) {
      enqueueSnackbar('La hora de fin no puede ser menor que la de inicio', { variant: 'error' });
      return;
    }
    if (inicio && fin && (fin.getTime() - inicio.getTime()) / 60000 < 1) {
      enqueueSnackbar('La actividad debe durar mínimo 1 minuto', { variant: 'warning' });
      return;
    }

    const payload = {
      nombreItem: nombre.trim(),
      descripcion: descripcion || null,
      hora_inicio: horaInicio || null,
      hora_fin: horaFin || null
    };

    try {
      setLoading(true);
      if (esEdicion) {
        const { data } = await axios.put(`/items/${itemEditar!.id}`, payload);
        enqueueSnackbar(data.message ?? 'Actualizado correctamente', { variant: 'success' });
      } else {
        const { data } = await axios.post('/items', payload);
        enqueueSnackbar(data.message ?? 'Creado correctamente', { variant: 'success' });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message ?? 'Error al guardar', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[560px] top-[8%] p-4">
        <ModalHeader>
          <ModalTitle>{esEdicion ? 'Editar actividad' : 'Nueva actividad'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-4 px-0 py-5">
          <div>
            <label className="block mb-1 text-sm font-medium">
              Nombre de la actividad <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Registro de asistentes"
              className="input p-2 border border-gray-300 rounded-md w-full"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe brevemente la actividad…"
              rows={3}
              className="input p-2 border border-gray-300 rounded-md w-full resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Fecha y hora de inicio</label>
              <input
                type="datetime-local"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="input p-2 border border-gray-300 rounded-md w-full"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Fecha y hora de fin</label>
              <input
                type="datetime-local"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="input p-2 border border-gray-300 rounded-md w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-sm" disabled={loading} onClick={handleSubmit}>
              {loading ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear actividad'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
