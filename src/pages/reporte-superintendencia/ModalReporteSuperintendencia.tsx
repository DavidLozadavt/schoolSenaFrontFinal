import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

import { useSnackbar } from 'notistack';
import { ModalPersonaAux } from './ModalPersonaAux';
import { ModalVehiculoAux } from './ModalVehiculoAux';

interface ModalProps {
  data?: any;
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const ModalReporteSuperintendencia = ({ open, onClose, data, onSave }: ModalProps) => {
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const [identificacion, setIdentificacion] = useState('');
  const [placa, setPlaca] = useState('');

  const [persona, setPersona] = useState<any | null>(null);
  const [vehiculo, setVehiculo] = useState<any | null>(null);

  const [modalOpenPersonaAux, setModalOpenPersonaAux] = useState(false);
  const [modalOpenVehiculoAux, setModalOpenVehiculoAux] = useState(false);

  const handleBuscarPersona = async () => {
    if (!identificacion) return;
    try {
      const response = await axios.get(`get_persona_auxiliar/${identificacion}`);
      setPersona(response.data);
    } catch (error: any) {
      setPersona(null);
      enqueueSnackbar(error.response?.data?.message || 'Persona no encontrada', {
        variant: 'error'
      });
    }
  };

  const handleBuscarVehiculo = async () => {
    if (!placa) return;
    try {
      const response = await axios.get(`get_vehiculo_auxiliar/${placa}`);
      setVehiculo(response.data);
    } catch (error: any) {
      setVehiculo(null);
      enqueueSnackbar(error.response?.data?.message || 'Vehículo no encontrado', {
        variant: 'error'
      });
    }
  };

  useEffect(() => {
    if (open) {
      setIdentificacion('');
      setPlaca('');
      setPersona(null);
      setVehiculo(null);
      setModalOpenPersonaAux(false);
      setModalOpenVehiculoAux(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setIdentificacion('');
      setPlaca('');
      setPersona(null);
      setVehiculo(null);
      setModalOpenPersonaAux(false);
      setModalOpenVehiculoAux(false);

      if (data) {
        if (data.cedulaConductor) {
          setIdentificacion(data.cedulaConductor);
          handleBuscarPersona();
        }
        if (data.placaVehiculo) {
          setPlaca(data.placaVehiculo);
          handleBuscarVehiculo();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!persona?.id || !vehiculo?.id) {
      enqueueSnackbar('Debe seleccionar persona y vehículo válidos', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('idPersona', String(persona.id));
      formData.append('idVehiculo', String(vehiculo.id));

      let response;
      if (data) {
        response = await axios.post(`update_report_superintendencia/${data.id}`, formData);
      } else {
        response = await axios.post('store_report_superintendencia', formData);
      }

      enqueueSnackbar('Reporte guardado correctamente', { variant: 'success' });
      if (onSave) onSave();
      onClose();
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al guardar reporte', {
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>Gestión Reporte</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody className="grid gap-5 px-0 py-5">
            <div className="px-4">
              <label className="block mb-1 text-sm font-medium">Identificación</label>

              <div className="flex items-center">
                <input
                  type="text"
                  className="input w-4/4 mr-2"
                  value={identificacion}
                  onChange={(e) => setIdentificacion(e.target.value)}
                  onBlur={handleBuscarPersona}
                  placeholder="Ingrese identificación"
                />
                <button
                  onClick={() => {
                    setModalOpenPersonaAux(true);
                  }}
                  type="button"
                  className="w-10 h-10 btn btn-sm btn-light"
                >
                  <KeenIcon icon="plus" />
                </button>
              </div>
              {persona && (
                <div className="mt-2 p-2 border rounded text-sm text-gray-700">
                  <p className="mb-1">
                    <b>Identificación:</b> {persona.identificacion}
                  </p>
                  <p>
                    <b>Nombre:</b> {persona.nombre1} {persona.apellido1}
                  </p>
                </div>
              )}
            </div>

            <div className="px-4">
              <label className="block mb-1 text-sm font-medium">Placa</label>
              <div className="flex items-center">
                <input
                  type="text"
                  className="input w-4/4 mr-2"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                  onBlur={handleBuscarVehiculo}
                  placeholder="Ingrese placa"
                />

                <button
                  onClick={() => {
                    setModalOpenVehiculoAux(true);
                  }}
                  type="button"
                  className="w-10 h-10 btn btn-sm btn-light"
                >
                  <KeenIcon icon="plus" />
                </button>
              </div>
              {vehiculo && (
                <div className="mt-2 p-2 border rounded text-sm text-gray-700">
                  <p>
                    <b>Placa:</b> {vehiculo.placa}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4 px-4">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-sm btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </ModalBody>
        </form>

        <ModalPersonaAux
          open={modalOpenPersonaAux}
          onClose={() => {
            setModalOpenPersonaAux(false);
          }}
        />

        <ModalVehiculoAux
          open={modalOpenVehiculoAux}
          onClose={() => {
            setModalOpenVehiculoAux(false);
          }}
        />
      </ModalContent>
    </Modal>
  );
};

export { ModalReporteSuperintendencia };
