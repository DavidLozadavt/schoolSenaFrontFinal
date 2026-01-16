import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalAlmacen = ({ open, data, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [sede, setSede] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({
    nombreAlmacen: '',
    direccion: '',
    sede: '',
    descripcion: ''
  });

  const [sedes, setSedes] = useState<any[]>([]);
  const [loadingSedes, setLoadingSedes] = useState<boolean>(false);

  const fetchSedes = async () => {
    setLoadingSedes(true);
    try {
      const response = await axios.get('sedes');
      setSedes(response.data);
    } catch (error) {
      console.error('Error al cargar las sedes:', error);
      enqueueSnackbar('No se pudieron cargar las sedes.', { variant: 'error' });
    } finally {
      setLoadingSedes(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSedes();
      if (data) {
        setNombre(data.nombreAlmacen || '');
        setDireccion(data.direccion || '');
        setSede(data.idSede?.toString() || '');
        setDescripcion(data.descripcion || '');
      } else {
        setNombre('');
        setDireccion('');
        setSede('');
        setDescripcion('');
      }
      setErrors({
        nombreAlmacen: '',
        direccion: '',
        sede: '',
        descripcion: ''
      });
    }
  }, [open, data]);

  const validate = () => {
    const newErrors = {
      nombreAlmacen: nombre.trim() ? '' : 'El nombre es requerido.',
      direccion: direccion.trim() ? '' : 'La dirección es requerida.',
      sede:
        typeof sede === 'string'
          ? sede.trim()
            ? ''
            : 'La sede es requerida.'
          : sede
            ? ''
            : 'La sede es requerida.',
      descripcion: descripcion.trim() ? '' : 'La descripción es requerida.'
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => e === '');
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('nombreAlmacen', nombre);
      formData.append('direccion', direccion);
      formData.append('idSede', sede?.toString() || '');
      formData.append('descripcion', descripcion);
      formData.append('estado', 'ACTIVO');
      if (data?.id) {
        formData.append('_method', 'PUT'); // Laravel lo interpreta como PUT

        await axios.post(`almacenes/${data.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        enqueueSnackbar('Almacén actualizado con éxito.', { variant: 'success' });
      } else {
        await axios.post('almacenes', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        enqueueSnackbar('Almacén guardado con éxito.', { variant: 'success' });
      }

      onSave?.();
      onClose();
    } catch (error: any) {
      console.error('Error al guardar el almacén:', error.response?.data || error);
      enqueueSnackbar('Error al guardar los datos.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open}>
      <ModalContent className="max-w-[600px] top-[10%] p-4 relative">
        {/* 🟢 Tarjeta pequeña mientras se guarda */}
        {saving && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/20 dark:bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-black shadow-xl rounded-xl px-6 py-4 flex items-center gap-3 border border-blue-100 animate-fadeIn">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent dark:border-blue-600 dark:border-t-transparent"></div>
              <p className="text-blue-600 dark:text-blue-600 font-semibold text-base">
                Guardando almacen...
              </p>
            </div>
          </div>
        )}
        <ModalHeader>
          <ModalTitle>
            <KeenIcon icon="warehouse" className="mr-2" />
            {data ? 'Editar Almacén' : 'Nuevo Almacén'}
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
              type="text"
              className={`input p-2 border ${
                errors.nombreAlmacen ? 'border-red-500' : 'border-gray-300'
              } rounded-md w-full`}
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errors.nombreAlmacen) setErrors((prev) => ({ ...prev, nombreAlmacen: '' }));
              }}
            />
            {errors.nombreAlmacen && (
              <p className="mt-1 text-sm text-red-500">{errors.nombreAlmacen}</p>
            )}
          </div>

          <div>
            <label htmlFor="direccion" className="block mb-1 text-sm font-medium">
              Dirección
            </label>
            <input
              id="direccion"
              type="text"
              className={`input p-2 border ${
                errors.direccion ? 'border-red-500' : 'border-gray-300'
              } rounded-md w-full`}
              value={direccion}
              onChange={(e) => {
                setDireccion(e.target.value);
                if (errors.direccion) setErrors((prev) => ({ ...prev, direccion: '' }));
              }}
            />
            {errors.direccion && <p className="mt-1 text-sm text-red-500">{errors.direccion}</p>}
          </div>

          <div>
            <label htmlFor="sede" className="block mb-1 text-sm font-medium">
              Sede
            </label>
            <select
              id="sede"
              className={`input p-2 border ${
                errors.sede ? 'border-red-500' : 'border-gray-300'
              } rounded-md w-full`}
              value={sede}
              onChange={(e) => {
                setSede(e.target.value);
                if (errors.sede) setErrors((prev) => ({ ...prev, sede: '' }));
              }}
            >
              <option value="">{loadingSedes ? 'Cargando sedes...' : 'Seleccione una sede'}</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombreSede}
                </option>
              ))}
            </select>
            {errors.sede && <p className="mt-1 text-sm text-red-500">{errors.sede}</p>}
          </div>

          <div>
            <label htmlFor="descripcion" className="block mb-1 text-sm font-medium">
              Descripción
            </label>
            <textarea
              id="descripcion"
              className={`textarea p-2 border ${
                errors.descripcion ? 'border-red-500' : 'border-gray-300'
              } rounded-md w-full`}
              placeholder="Descripción"
              rows={4}
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                if (errors.descripcion) setErrors((prev) => ({ ...prev, descripcion: '' }));
              }}
            />
            {errors.descripcion && (
              <p className="mt-1 text-sm text-red-500">{errors.descripcion}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 px-4 mt-4">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`btn btn-primary ${saving ? 'opacity-60' : ''}`}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalAlmacen };