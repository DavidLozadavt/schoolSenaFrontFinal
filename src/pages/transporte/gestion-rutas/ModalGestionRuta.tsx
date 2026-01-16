import React, { useState, useEffect } from 'react';
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

const ModalGestionRuta = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [distancia, setDistancia] = useState(data?.distancia || '');
  const [tiempoEstimado, setTiempoEstimado] = useState(data?.tiempoEstimado || '');
  const [descripcion, setDescripcion] = useState(data?.descripcion || '');
  const [precio, setPrecio] = useState(data?.precio || '');
  const [idDepartamentoOrigen, setIdDepartamentoOrigen] = useState(
    data?.idDepartamentoOrigen || ''
  );
  const [idCiudadOrigen, setIdCiudadOrigen] = useState(data?.idCiudadOrigen || '');
  const [idDepartamentoDestino, setIdDepartamentoDestino] = useState(
    data?.idDepartamentoDestino || ''
  );
  const [idCiudadDestino, setIdCiudadDestino] = useState(data?.idCiudadDestino || '');
  const [idLugar, setIdLugar] = useState(data?.idLugar || null);

  const [errors, setErrors] = useState<{
    distancia: string;
    tiempoEstimado: string;
    descripcion: string;
    precio: string;
    idDepartamentoOrigen: string;
    idCiudadOrigen: string;
    idDepartamentoDestino: string;
    idCiudadDestino: string;
  }>({
    distancia: '',
    tiempoEstimado: '',
    descripcion: '',
    precio: '',
    idDepartamentoOrigen: '',
    idCiudadOrigen: '',
    idDepartamentoDestino: '',
    idCiudadDestino: ''
  });

  const [departamentos, setDepartamentos] = useState([]);
  const [ciudadesOrigen, setCiudadesOrigen] = useState([]);
  const [ciudadesDestino, setCiudadesDestino] = useState([]);

  useEffect(() => {
    if (open) {
      fetchDepartamentos();
      setDistancia('');
      setTiempoEstimado('');
      setDescripcion('');
      setPrecio('');
      setIdDepartamentoOrigen('');
      setIdCiudadOrigen('');
      setIdDepartamentoDestino('');
      setIdCiudadDestino('');
      setIdLugar(null);
      setErrors({
        distancia: '',
        tiempoEstimado: '',
        descripcion: '',
        precio: '',
        idDepartamentoOrigen: '',
        idCiudadOrigen: '',
        idDepartamentoDestino: '',
        idCiudadDestino: ''
      });
    }
  }, [open]);

  useEffect(() => {
    if (data) {
      setDistancia(data.distancia);
      setTiempoEstimado(data.tiempoEstimado);
      setDescripcion(data.descripcion);
      setPrecio(data.precio);
      setIdDepartamentoOrigen(data.idDepartamentoOrigen);
      setIdCiudadOrigen(data.idCiudadOrigen);
      setIdDepartamentoDestino(data.idDepartamentoDestino);
      setIdCiudadDestino(data.idCiudadDestino);
      setIdLugar(data.idLugar);
    }
  }, [data]);

  const fetchDepartamentos = async () => {
    try {
      const response = await axios.get('departamentos');
      setDepartamentos(response.data);
    } catch (error) {
      console.error('Error fetching departamentos:', error);
    }
  };

  const fetchCiudadesPorDepartamento = async (
    departamentoId: string,
    tipo: 'origen' | 'destino'
  ) => {
    try {
      const response = await axios.get(`ciudades/departamento/${departamentoId}`);
      if (tipo === 'origen') {
        setCiudadesOrigen(response.data);
      } else {
        setCiudadesDestino(response.data);
      }
    } catch (error) {
      console.error('Error fetching ciudades:', error);
    }
  };

  useEffect(() => {
    if (idDepartamentoOrigen) {
      fetchCiudadesPorDepartamento(idDepartamentoOrigen, 'origen');
    } else {
      setCiudadesOrigen([]);
    }
  }, [idDepartamentoOrigen]);

  useEffect(() => {
    if (idDepartamentoDestino) {
      fetchCiudadesPorDepartamento(idDepartamentoDestino, 'destino');
    } else {
      setCiudadesDestino([]);
    }
  }, [idDepartamentoDestino]);

  const validate = () => {
    const newErrors = {
      distancia: '',
      tiempoEstimado: '',
      descripcion: '',
      precio: '',
      idDepartamentoOrigen: '',
      idCiudadOrigen: '',
      idDepartamentoDestino: '',
      idCiudadDestino: ''
    };

    if (!distancia.trim()) newErrors.distancia = 'La distancia es requerida.';
    if (!tiempoEstimado.trim()) newErrors.tiempoEstimado = 'El tiempo estimado es requerido.';
    if (!descripcion.trim()) newErrors.descripcion = 'La descripción es requerida.';
    if (!precio.trim() || isNaN(Number(precio.replace(/[$,]/g, '')))) {
      newErrors.precio = 'El precio es requerido y debe ser un número válido.';
    }
    if (!idDepartamentoOrigen)
      newErrors.idDepartamentoOrigen = 'El departamento de origen es requerido.';
    if (!idCiudadOrigen) newErrors.idCiudadOrigen = 'La ciudad de origen es requerida.';
    if (!idDepartamentoDestino)
      newErrors.idDepartamentoDestino = 'El departamento de destino es requerido.';
    if (!idCiudadDestino) newErrors.idCiudadDestino = 'La ciudad de destino es requerida.';

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
      idCiudadOrigen,
      idCiudadDestino,
      idLugar
    };

    try {
      if (data) {
        await axios.put(` /${data.id}`, payload);
        enqueueSnackbar('Ruta actualizada con éxito.', {
          variant: 'success'
        });
      } else {
        await axios.post('rutas', payload);
        enqueueSnackbar('Ruta guardada con éxito.', {
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
          <ModalTitle>{data ? 'Editar Ruta' : 'Nueva Ruta'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="idDepartamentoOrigen" className="block mb-1 text-sm font-medium">
              Departamento Origen
            </label>
            <select
              id="idDepartamentoOrigen"
              className={`input p-2 border ${errors.idDepartamentoOrigen ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={idDepartamentoOrigen}
              onChange={(e) => {
                setIdDepartamentoOrigen(e.target.value);
                if (errors.idDepartamentoOrigen)
                  setErrors((prev) => ({ ...prev, idDepartamentoOrigen: '' }));
              }}
            >
              <option value="">Seleccione un departamento</option>
              {departamentos.map((departamento: any) => (
                <option key={departamento.id} value={departamento.id}>
                  {departamento.descripcion}
                </option>
              ))}
            </select>
            {errors.idDepartamentoOrigen && (
              <p className="mt-1 text-sm text-red-500">{errors.idDepartamentoOrigen}</p>
            )}
          </div>

          <div>
            <label htmlFor="idCiudadOrigen" className="block mb-1 text-sm font-medium">
              Ciudad Origen
            </label>
            <select
              id="idCiudadOrigen"
              className={`input p-2 border ${errors.idCiudadOrigen ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={idCiudadOrigen}
              onChange={(e) => {
                setIdCiudadOrigen(e.target.value);
                if (errors.idCiudadOrigen) setErrors((prev) => ({ ...prev, idCiudadOrigen: '' }));
              }}
              disabled={!idDepartamentoOrigen}
            >
              <option value="">Seleccione una ciudad</option>
              {ciudadesOrigen.map((ciudad: any) => (
                <option key={ciudad.id} value={ciudad.id}>
                  {ciudad.descripcion}
                </option>
              ))}
            </select>
            {errors.idCiudadOrigen && (
              <p className="mt-1 text-sm text-red-500">{errors.idCiudadOrigen}</p>
            )}
          </div>

          <div>
            <label htmlFor="idDepartamentoDestino" className="block mb-1 text-sm font-medium">
              Departamento Destino
            </label>
            <select
              id="idDepartamentoDestino"
              className={`input p-2 border ${errors.idDepartamentoDestino ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={idDepartamentoDestino}
              onChange={(e) => {
                setIdDepartamentoDestino(e.target.value);
                if (errors.idDepartamentoDestino)
                  setErrors((prev) => ({ ...prev, idDepartamentoDestino: '' }));
              }}
            >
              <option value="">Seleccione un departamento</option>
              {departamentos.map((departamento: any) => (
                <option key={departamento.id} value={departamento.id}>
                  {departamento.descripcion}
                </option>
              ))}
            </select>
            {errors.idDepartamentoDestino && (
              <p className="mt-1 text-sm text-red-500">{errors.idDepartamentoDestino}</p>
            )}
          </div>

          <div>
            <label htmlFor="idCiudadDestino" className="block mb-1 text-sm font-medium">
              Ciudad Destino
            </label>
            <select
              id="idCiudadDestino"
              className={`input p-2 border ${errors.idCiudadDestino ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={idCiudadDestino}
              onChange={(e) => {
                setIdCiudadDestino(e.target.value);
                if (errors.idCiudadDestino) setErrors((prev) => ({ ...prev, idCiudadDestino: '' }));
              }}
              disabled={!idDepartamentoDestino}
            >
              <option value="">Seleccione una ciudad</option>
              {ciudadesDestino.map((ciudad: any) => (
                <option key={ciudad.id} value={ciudad.id}>
                  {ciudad.descripcion}
                </option>
              ))}
            </select>
            {errors.idCiudadDestino && (
              <p className="mt-1 text-sm text-red-500">{errors.idCiudadDestino}</p>
            )}
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
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalGestionRuta;
