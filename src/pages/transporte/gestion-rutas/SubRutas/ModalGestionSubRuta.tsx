import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';
import ModalLugares from '../../Places/ModalLugares';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
  idRutaPadre: any;
}

const ModalGestionSubRuta = ({ open, onClose, data, onSave, idRutaPadre }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [distancia, setDistancia] = useState(data?.distancia || '');
  const [tiempoEstimado, setTiempoEstimado] = useState(data?.tiempoEstimado || '');
  const [descripcion, setDescripcion] = useState(data?.descripcion || '');
  const [precio, setPrecio] = useState(data?.precio || '');
  const [idLugar, setidLugar] = useState(data?.idLugar || '');
  const [isModalSubRutaOpen, setIsModalSubRutaOpen] = useState(false);

  const [errors, setErrors] = useState<{
    distancia: string;
    tiempoEstimado: string;
    descripcion: string;
    precio: string;
    idLugar: string;
  }>({
    distancia: '',
    tiempoEstimado: '',
    descripcion: '',
    precio: '',
    idLugar: ''
  });

  const [lugares, setlugares] = useState([]);
  const [ciudadesOrigen, setCiudadesOrigen] = useState([]);
  const [ciudadesDestino, setCiudadesDestino] = useState([]);
  const handleModalCloseSubRuta = () => {
    setIsModalSubRutaOpen(false);
    fetchlugares(); 
  };
  const handleAddLugar = () => {
    console.log('Agregar nuevo lugar');
    setIsModalSubRutaOpen(true);
  };
  useEffect(() => {
    if (open) {
      fetchlugares();
      setDistancia('');
      setTiempoEstimado('');
      setDescripcion('');
      setPrecio('');
      setidLugar('');
      setErrors({
        distancia: '',
        tiempoEstimado: '',
        descripcion: '',
        precio: '',
        idLugar: ''
      });
    }
  }, [open]);

  useEffect(() => {
    if (data) {
      setDistancia(data.distancia);
      setTiempoEstimado(data.tiempoEstimado);
      setDescripcion(data.descripcion);
      setPrecio(data.precio);
      setidLugar(data.idLugar);
    }
  }, [data]);

  const fetchlugares = async () => {
    try {
      const response = await axios.get('places');
      setlugares(response.data);
    } catch (error) {
      console.error('Error fetching lugares:', error);
    }
  };

  const validate = () => {
    const newErrors = {
      distancia: '',
      tiempoEstimado: '',
      descripcion: '',
      precio: '',
      idLugar: '',
      idCiudadOrigen: ''
    };

    if (!distancia.trim()) newErrors.distancia = 'La distancia es requerida.';
    if (!tiempoEstimado.trim()) newErrors.tiempoEstimado = 'El tiempo estimado es requerido.';
    if (!descripcion.trim()) newErrors.descripcion = 'La descripción es requerida.';
    if (!precio.trim() || isNaN(Number(precio.replace(/[$,]/g, '')))) {
      newErrors.precio = 'El precio es requerido y debe ser un número válido.';
    }
    if (!idLugar) newErrors.idLugar = 'El departamento de origen es requerido.';

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      distancia,
      tiempoEstimado,
      descripcion,
      precio: Number(precio.replace(/[$,]/g, '')),
      idLugar,
      idRutaPadre
    };

    try {
      if (data) {
        await axios.put(`create_sub_ruta/${data.id}`, payload);
        enqueueSnackbar('Sub Ruta actualizada con éxito.', {
          variant: 'success'
        });
      } else {
        await axios.post('create_sub_ruta', payload);
        enqueueSnackbar('Sub Ruta guardada con éxito.', {
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
      <ModalContent className="max-w-[600px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editar Sub Ruta' : 'Nueva Sub Ruta'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="idLugar" className="block mb-1 text-sm font-medium">
              Lugar
            </label>
            <div className="flex gap-2">
              {' '}
              <select
                id="idLugar"
                className={`input p-2 border ${errors.idLugar ? 'border-red-500' : 'border-gray-300'} rounded-md flex-1`} /* flex-1 para que ocupe el espacio restante */
                value={idLugar}
                onChange={(e) => {
                  setidLugar(e.target.value);
                  if (errors.idLugar) setErrors((prev) => ({ ...prev, idLugar: '' }));
                }}
              >
                <option value="">Seleccione un lugar</option>
                {lugares.map((lugar: any) => (
                  <option key={lugar.id} value={lugar.id}>
                    {lugar.nombre}
                  </option>
                ))}
              </select>
              <button className="btn btn-icon btn-primary" onClick={handleAddLugar}>
                <KeenIcon icon="plus" />
              </button>
            </div>
            {errors.idLugar && <p className="mt-1 text-sm text-red-500">{errors.idLugar}</p>}
          </div>

          <div>
            <label htmlFor="distancia" className="block mb-1 text-sm font-medium">
              Distancia
            </label>
            <input
              id="distancia"
              className={`input p-2 border ${errors.distancia ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={distancia}
              onChange={(e) => {
                setDistancia(e.target.value);
                if (errors.distancia) setErrors((prev) => ({ ...prev, distancia: '' }));
              }}
              placeholder="Distancia"
            />
            {errors.distancia && <p className="mt-1 text-sm text-red-500">{errors.distancia}</p>}
          </div>

          <div>
            <label htmlFor="tiempoEstimado" className="block mb-1 text-sm font-medium">
              Tiempo Estimado
            </label>
            <input
              id="tiempoEstimado"
              className={`input p-2 border ${errors.tiempoEstimado ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={tiempoEstimado}
              onChange={(e) => {
                setTiempoEstimado(e.target.value);
                if (errors.tiempoEstimado) setErrors((prev) => ({ ...prev, tiempoEstimado: '' }));
              }}
              placeholder="Tiempo Estimado"
            />
            {errors.tiempoEstimado && (
              <p className="mt-1 text-sm text-red-500">{errors.tiempoEstimado}</p>
            )}
          </div>
          <div>
            <label htmlFor="precio" className="block mb-1 text-sm font-medium">
              Precio
            </label>
            <NumericFormat
              id="precio"
              className={`input p-2 border ${errors.precio ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              prefix={'$'}
              value={precio}
              decimalScale={3}
              onChange={(e) => {
                setPrecio(e.target.value);
                if (errors.precio) setErrors((prev) => ({ ...prev, precio: '' }));
              }}
              thousandsGroupStyle="thousand"
              placeholder="Precio"
              thousandSeparator=","
            />
            {errors.precio && <p className="mt-1 text-sm text-red-500">{errors.precio}</p>}
          </div>

          <div>
            <label htmlFor="descripcion" className="block mb-1 text-sm font-medium">
              Descripción
            </label>
            <textarea
              id="descripcion"
              className={`textarea p-2 border ${errors.descripcion ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Descripción"
              rows={5}
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
            <button className="btn btn-primary" onClick={handleSave}>
              Guardar
            </button>
          </div>
          <ModalLugares open={isModalSubRutaOpen} 
          onClose={handleModalCloseSubRuta}
          onSave={fetchlugares}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalGestionSubRuta;
