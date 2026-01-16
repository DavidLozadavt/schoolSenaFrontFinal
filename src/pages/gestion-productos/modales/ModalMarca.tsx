import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const ModalMarca = ({ open, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [idClaseProducto, setIdClaseProducto] = useState<number | null>(null);
  const [clases, setClases] = useState<any[]>([]);
  const [errors, setErrors] = useState<{
    nombre?: string;
    descripcion?: string;
    idClaseProducto?: string;
  }>({});

  useEffect(() => {
    if (open) {
      setNombre('');
      setDescripcion('');
      setIdClaseProducto(null);
      setErrors({});
      axios
        .get('clase_productos')
        .then((r) => setClases(r.data))
        .catch(() => {});
    }
  }, [open]);

  const validate = () => {
    const newErrors: any = {};
    if (!nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!descripcion.trim()) newErrors.descripcion = 'La descripcion es obligatoria';
    if (!idClaseProducto) newErrors.idClaseProducto = 'La clase es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      const fd = new FormData();

      // 👇 ESTA ES LA CLAVE
      fd.append('marca', nombre); // backend lo exige

      // 👇 esto lo mantienes para tu UI interna (no afecta nada)
      fd.append('nombre', nombre);

      fd.append('descripcion', descripcion);
      fd.append('idClaseProducto', String(idClaseProducto));

      await axios.post('marcas', fd);

      enqueueSnackbar('Marca creada.', { variant: 'success' });
      if (onSave) onSave();
      onClose();
    } catch (error) {
      enqueueSnackbar('Error al crear marca.', { variant: 'error' });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{'Nueva Marca'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label className="block mb-1 text-sm font-medium">Nombre</label>
            <input
              className={`input p-2 border ${errors.nombre ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Descripcion</label>
            <textarea
              className={`textarea p-2 border ${errors.descripcion ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
            {errors.descripcion && (
              <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Clase Producto</label>
            <select
              className={`select w-full ${errors.idClaseProducto ? 'border-red-500' : ''}`}
              value={idClaseProducto ?? ''}
              onChange={(e) => setIdClaseProducto(Number(e.target.value) || null)}
            >
              <option value="">Seleccione</option>
              {clases.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.nombreClaseProducto}
                </option>
              ))}
            </select>
            {errors.idClaseProducto && (
              <p className="text-red-500 text-sm mt-1">{errors.idClaseProducto}</p>
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

export { ModalMarca };
