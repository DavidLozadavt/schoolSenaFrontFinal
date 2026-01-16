import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

export const getFileUrl = (path: string) =>
  path.startsWith('http') ? path : `${axios.defaults.baseURL}${path}`;

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalEscenario = ({ open, data, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [nombre, setNombre] = useState('');
  const [numero, setNumero] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('');
  const [capacidad, setCapacidad] = useState('');

  const [imagen, setImagen] = useState<File | null>(null);
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [imagenesPrevias, setImagenesPrevias] = useState<string[]>([]);
  const [videosPrevios, setVideosPrevios] = useState<string[]>([]);

  const [videos, setVideos] = useState<File[]>([]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const tiposEscenario = [
    { value: '', label: 'Seleccione un tipo' },
    { value: 'salon', label: 'Salón' },
    { value: 'habitacion', label: 'Habitación' },
    { value: 'hotel', label: 'Hotel' },
    { value: 'cancha', label: 'Cancha' },
    { value: 'casa', label: 'Casa' },
    { value: 'apartamento', label: 'Apartamento' },
    { value: 'parking', label:'Parking'},
    { value: 'parkingCarros', label:'ParkingCarros'},
    { value: 'parkingMotos', label:'ParkingMotos'},
  ];

  useEffect(() => {
    if (data) {
      setNombre(data.nombre || '');
      setNumero(data.numero || '');
      setDescripcion(data.descripcion || '');
      setTipo(data.tipo || '');
      setCapacidad(data.capacidad || '');
      setImagenPreview(data.imagenUrl || null);
      setImagenesPrevias(data.imagenes || []);
      setVideosPrevios(data.videos || []);
    } else {
      setNombre('');
      setNumero('');
      setDescripcion('');
      setTipo('');
      setCapacidad('');
      setImagen(null);
      setImagenPreview(null);
      setImagenes([]);
      setVideos([]);
    }
  }, [data, open]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!numero.trim()) newErrors.numero = 'El número es obligatorio';
    if (!tipo.trim()) newErrors.tipo = 'El tipo es obligatorio';
    if (!imagen && !data?.id) newErrors.imagen = 'Debes subir una imagen principal';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImagenPrincipal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImagen(file);
  };

  const handleImagenesSecundarias = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imagenes.length > 3) {
      enqueueSnackbar('Solo puedes subir máximo 3 imágenes secundarias', { variant: 'warning' });
      return;
    }
    setImagenes((prev) => [...prev, ...files]);
  };

  const handleVideos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + videos.length > 3) {
      enqueueSnackbar('Solo puedes subir máximo 3 videos', { variant: 'warning' });
      return;
    }
    setVideos((prev) => [...prev, ...files]);
  };

  const removeImagenSecundaria = (index: number) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const formData = new FormData();
    formData.append('_method', data?.id ? 'PUT' : 'POST'); // importante para Laravel
    formData.append('nombre', nombre);
    formData.append('numero', numero);
    formData.append('descripcion', descripcion);
    formData.append('tipo', tipo);
    if (capacidad) formData.append('capacidad', capacidad);

    if (imagen) formData.append('imagenUrl', imagen);

    if (data?.id) {
      // estás editando, el backend espera estos nombres
      imagenes.forEach((img) => formData.append('imagenesNuevas[]', img));
      videos.forEach((vid) => formData.append('videosNuevos[]', vid));
    } else {
      // estás creando
      imagenes.forEach((img) => formData.append('imagenes[]', img));
      videos.forEach((vid) => formData.append('videos[]', vid));
    }

    try {
      if (data?.id) {
        await axios.post(`/escenarios/${data.id}`, formData);
        enqueueSnackbar('Escenario actualizado correctamente', { variant: 'success' });
      } else {
        await axios.post('/escenarios', formData);
        enqueueSnackbar('Escenario creado correctamente', { variant: 'success' });
      }
      onSave?.();
      onClose();
    } catch (error) {
      enqueueSnackbar('Error al guardar el escenario', { variant: 'error' });
    }
  };

  return (
    <Modal open={open} >
      <ModalContent className="max-w-[600px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>
            {data ? 'Editar Escenario' : 'Nuevo Escenario'}
          </ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-3 px-0 py-5">
          {/* Número */}
          <div>
            <label className="block mb-1 text-sm font-medium">Número del Escenario</label>
            <input
              type="text"
              className="input border rounded-md w-full p-2"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ej: A12"
            />
            {errors.numero && <p className="text-red-500 text-xs">{errors.numero}</p>}
          </div>

          {/* Nombre */}
          <div>
            <label className="block mb-1 text-sm font-medium">Nombre del Escenario</label>
            <input
              type="text"
              className="input border rounded-md w-full p-2"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Salón Principal"
            />
            {errors.nombre && <p className="text-red-500 text-xs">{errors.nombre}</p>}
          </div>

          {/* Tipo */}
          <div>
            <label className="block mb-1 text-sm font-medium">Tipo de Escenario</label>
            <select
              className="input border rounded-md w-full p-2"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              {tiposEscenario.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.tipo && <p className="text-red-500 text-xs">{errors.tipo}</p>}
          </div>

          {/* Capacidad */}
          <div>
            <label className="block mb-1 text-sm font-medium">Capacidad (opcional)</label>
            <input
              type="number"
              className="input border rounded-md w-full p-2"
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              placeholder="Ej: 500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block mb-1 text-sm font-medium">Descripción</label>
            <textarea
              className="input border rounded-md w-full p-2"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción breve del escenario..."
            />
          </div>

          {/* Imagen principal */}
          <div>
            <label className="block mb-1 text-sm font-medium">Imagen Principal</label>
            <input
              type="file"
              accept="image/*"
              className="file-input"
              onChange={handleImagenPrincipal}
            />
            {errors.imagen && <p className="text-red-500 text-xs">{errors.imagen}</p>}

            {imagen ? (
              <img
                src={URL.createObjectURL(imagen)}
                alt="Preview"
                className="mt-2 h-32 w-full object-cover rounded-md"
              />
            ) : imagenPreview ? (
              <img
                src={getFileUrl(imagenPreview)}
                alt="Preview actual"
                className="mt-2 h-32 w-full object-cover rounded-md"
              />
            ) : null}
          </div>

          {/* Imágenes secundarias */}
          <div>
            <label className="block mb-1 text-sm font-medium">Imágenes Secundarias (máx 3)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="file-input"
              onChange={handleImagenesSecundarias}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {imagenes.map((img, i) => (
                <div key={i} className="relative w-20 h-20 border rounded-md overflow-hidden">
                  <img src={URL.createObjectURL(img)} alt={`img-${i}`} className="object-cover w-full h-full" />
                  <button
                    className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-bl px-1"
                    onClick={() => removeImagenSecundaria(i)}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Videos */}
          <div>
            <label className="block mb-1 text-sm font-medium">Videos (máx 3)</label>
            <input type="file" accept="video/*" multiple className="file-input" onChange={handleVideos} />
            <div className="flex flex-wrap gap-2 mt-2">
              {videos.map((vid, i) => (
                <div key={i} className="relative w-24">
                  <video src={URL.createObjectURL(vid)} controls className="rounded-md" width="100%" />
                  <button
                    className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-bl px-1"
                    onClick={() => removeVideo(i)}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 mt-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn btn-sm btn-primary" onClick={handleSubmit}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalEscenario };