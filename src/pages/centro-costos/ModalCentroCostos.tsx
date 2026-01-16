import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';
import { ModalCentroOperacion } from './ModalCentroOperacion';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalCentroCostos = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [idSede, setIdSede] = useState(data?.idSede || '');
  const [idCentroOperacion, setIdCentroOperacion] = useState(data?.idCentroOperacion || '');
  const [idArea, setIdArea] = useState(data?.idArea || '');
  const [descripcion, setDescripcion] = useState(data?.descripcion || '');
  const [presupuesto, setPresupuesto] = useState(data?.presupuesto || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [errors, setErrors] = useState<{
    idSede: string;
    descripcion: string;
    presupuesto: string;
  }>({
    idSede: '',
    descripcion: '',
    presupuesto: ''
  });

  const [sedes, setSedes] = useState([]);
  const [areas, setAreas] = useState([]);
  const [centroOperaciones, setCentroOperaciones] = useState([]);

  useEffect(() => {
    if (open) {
      fetchSedes();
      fetchCentroOperaciones();
      setIdSede('');
      setIdArea('');
      setDescripcion('');
      setPresupuesto('');
      setIdCentroOperacion('');
      setErrors({ idSede: '', descripcion: '', presupuesto: '' });
    }
  }, [open]);

  useEffect(() => {
    if (data) {
      setIdSede(data.idSede);
      setIdCentroOperacion(data.idCentroOperacion || '');
      setIdArea(data.idArea || '');
      setDescripcion(data.descripcion);
      setPresupuesto(data.presupuesto);
    }
  }, [data]);

  useEffect(() => {
    const fetchAreas = async (sedeId: string) => {
      try {
        const response = await axios.get(`areas?idSede=${sedeId}`);
        setAreas(response.data);
      } catch (error) {
        console.error('Error fetching areas:', error);
      }
    };

    if (idSede) {
      fetchAreas(idSede);
    }
  }, [idSede]);

  const fetchSedes = async () => {
    try {
      const response = await axios.get('sedes');
      setSedes(response.data);
    } catch (error) {
      console.error('Error fetching sedes:', error);
    }
  };

  const fetchCentroOperaciones = async () => {
    try {
      const response = await axios.get('get_centros_operaciones');
      setCentroOperaciones(response.data);
    } catch (error) {
      console.error('Error fetching centro de operaciones:', error);
    }
  };

  const handleAfterSave = () => {
    fetchCentroOperaciones();
    setModalOpen(false);
  };

   const handleModalClose = () => {
    setModalOpen(false);
  };

  const validate = () => {
    const newErrors: { idSede: string; descripcion: string; presupuesto: string } = {
      idSede: '',
      descripcion: '',
      presupuesto: ''
    };

    if (!idSede) newErrors.idSede = 'La sede es requerida.';
    if (!descripcion.trim()) newErrors.descripcion = 'La descripción es requerida.';
    if (!presupuesto.trim() || isNaN(Number(presupuesto.replace(/[$,]/g, ''))))
      newErrors.presupuesto = 'El presupuesto es requerido y debe ser un número válido.';

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      idSede,
      idArea: idArea || null,
      idCentroOperacion: idCentroOperacion || null,
      descripcion,
      presupuesto: String(presupuesto).replace(/[$,]/g, '')
    };

    try {
      if (data) {
        await axios.put(`cost_centers/${data.id}`, payload);
        enqueueSnackbar('Centro de Costos actualizado con éxito.', {
          variant: 'success'
        });
      } else {
        await axios.post('cost_centers', payload);
        enqueueSnackbar('Centro de Costos guardado con éxito.', {
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
          <ModalTitle>{data ? 'Editar Centro de Costos' : 'Nuevo Centro de Costos'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="idSede" className="block mb-1 text-sm font-medium">
              Sede
            </label>
            <select
              id="idSede"
              className={`select p-2 border ${errors.idSede ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={idSede}
              onChange={(e) => {
                setIdSede(e.target.value);
                if (errors.idSede) setErrors((prev) => ({ ...prev, idSede: '' }));
              }}
            >
              <option value="">Seleccione una sede</option>
              {sedes.map((sede: any) => (
                <option key={sede.id} value={sede.id}>
                  {sede.nombre}
                </option>
              ))}
            </select>
            {errors.idSede && <p className="text-red-500 text-sm mt-1">{errors.idSede}</p>}
          </div>

          <div>
            <label htmlFor="idArea" className="block mb-1 text-sm font-medium">
              Área (opcional)
            </label>
            <select
              id="idArea"
              className="select p-2 border border-gray-300 rounded-md w-full"
              value={idArea}
              onChange={(e) => setIdArea(e.target.value)}
            >
              <option value="">Seleccione un área (opcional)</option>
              {areas.map((area: any) => (
                <option key={area.id} value={area.id}>
                  {area.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="idCentroOperacion" className="block mb-1 text-sm font-medium">
              Centro de Operación
            </label>
            <div className="flex items-center">
              <select
                id="idCentroOperacion"
                className="select w-4/4 mr-2"
                value={idCentroOperacion}
                onChange={(e) => setIdCentroOperacion(e.target.value)}
              >
                <option value="">Seleccione una opción</option>
                {centroOperaciones.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>

              <button
             onClick={() => setModalOpen(true)}
                className="w-10 h-10 btn btn-sm btn-light"
              >
                <KeenIcon icon="plus" />
              </button>
            </div>
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
              <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>
            )}
          </div>

          <div>
            <label htmlFor="presupuesto" className="block mb-1 text-sm font-medium">
              Presupuesto
            </label>
            <NumericFormat
              id="presupuesto"
              className={`input p-2 border ${errors.presupuesto ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              prefix={'$'}
              value={presupuesto}
              decimalScale={3}
              onChange={(e) => {
                setPresupuesto(e.target.value);
                if (errors.presupuesto) setErrors((prev) => ({ ...prev, presupuesto: '' }));
              }}
              thousandsGroupStyle="thousand"
              placeholder="Presupuesto"
              thousandSeparator=","
            />
            {errors.presupuesto && (
              <p className="text-red-500 text-sm mt-1">{errors.presupuesto}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleSave}>
              Guardar
            </button>
          </div>

          <ModalCentroOperacion
            open={modalOpen}
            onClose={handleModalClose}
            onSave={handleAfterSave}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalCentroCostos };
