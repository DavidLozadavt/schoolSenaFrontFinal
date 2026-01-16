import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import Spinner from '@/components/loaders/Spinner';
import { AfiliacionInterface, VehiculoInterface } from './models/AfiliacionInterface';

import { PersonaInterface } from '../contratacion/model/PersonaInterface';

import { useConfirm } from '@/hooks';
import { ModalDetailPropietario } from './ModalDetailPropietario';

interface ModalProps {
  open: boolean;
  data?: any;
  vehiculo?: VehiculoInterface;
  onClose: () => void;
  onSave?: () => void;
}

const ModalPropietarioAfiliacion = ({ open, data, onClose, onSave, vehiculo }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [propietarios, setPropietarios] = useState<PersonaInterface[]>([]);
  const [propietario, setPropietario] = useState<any | undefined>(undefined);
  const { confirmAction } = useConfirm();
  const [totalPorcentaje, setTotalPorcentaje] = useState<number>(0);
  const [selectedIdPropietario, setSelectedIdPropietario] = useState<string>('');
  const [modalDetailPropietario, setModalDetailPropietario] = useState<boolean>(false);
  const [modalCreateObservacion, setModalCreateObservacion] = useState<boolean>(false);

  const fetchPropietarios = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`get_propietarios_by_id/${data?.id}`);
      const afiliacion = response.data;

      const propietarios: Array<{ pivot?: { porcentaje?: number } }> =
        afiliacion[0]?.propietario || [];
      setPropietarios(propietarios);

      const sumaPorcentajes = propietarios.reduce(
        (total: number, prop) => total + (prop.pivot?.porcentaje ?? 0),
        0
      );

      setTotalPorcentaje(sumaPorcentajes);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [data?.id]);

  const handleConfirmChangeStatus = (idPropietario?: number) => {
    if (idPropietario === undefined) return;
    confirmAction('Esta acción cambiará el estado del propietario.', () =>
      handleSave(idPropietario)
    );
  };

  const handleSave = async (idPropietario: number) => {
    try {
      await axios.put(`change_status_propietario/${idPropietario}`, {
        idAfiliacion: data?.id
      });
      enqueueSnackbar('Cambio de estado guardado con éxito.', { variant: 'success' });
      fetchPropietarios();
    } catch (error: unknown) {
      enqueueSnackbar('Error al guardar el cambio de estado.', { variant: 'error' });
    }
  };

  const handlePropietarioAdministrador = (id: any) => {
    setSelectedIdPropietario(id);
    setModalCreateObservacion(true);
  };

  const handleChangeAdministrador = async () => {
    try {
      await axios.post(`change_propietario_administrador`, {
        idPropietario: selectedIdPropietario,
        idAfiliacion: data?.id
      }); 

      enqueueSnackbar('Administrador actualizado con éxito', { variant: 'success' });
      setSelectedIdPropietario('');
      fetchPropietarios();
    } catch (error) {
      enqueueSnackbar('Error al cambiar administrador', { variant: 'error' });
      console.error(error);
    }
  };

  const handleAfterSave = () => {
    fetchPropietarios();
  };

  useEffect(() => {
    fetchPropietarios();
  }, [fetchPropietarios]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[980px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Propietarios</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-2">
          {loading && <Spinner />}
          <div className="min-w-full">
            <div className="flex justify-end py-2">
          
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {propietarios.map((propietario, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setPropietario(propietario);
                    setModalDetailPropietario(true);
                  }}
                  className="relative card h-full flex flex-col border border-gray-200 cursor-pointer
        transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="card-body flex flex-col items-center flex-grow px-2 py-3">
                    <div className="mb-3 w-full flex justify-center">
                      <img
                        className="w-28 h-28 object-cover rounded-full border"
                        src={propietario.rutaFotoUrl}
                        alt=""
                      />
                    </div>

                    <div className="flex items-center justify-center gap-1.5 mb-3 mt-2">
                      <p className="hover:text-primary-active text-base leading-5 font-medium text-gray-900 truncate max-w-[180px]">
                        {propietario.nombre1} {propietario.apellido1}
                      </p>
                    </div>

                    <span className="text-gray-700 text-sm mt-2">
                      Identificación: {propietario.identificacion}
                    </span>

                    <span className="text-gray-700 text-sm mt-2">
                      Porcentaje de Propiedad: {propietario.pivot?.porcentaje} %
                    </span>

                    <span className="text-gray-700 text-sm mt-2">
                      Celular: {propietario?.celular}
                    </span>
                  </div>

                  <div className="card-footer flex justify-center gap-2 mt-auto p-3 items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (propietario.pivot?.administrador !== 'Si') {
                          handlePropietarioAdministrador(propietario.id);
                        }
                      }}
                      className={`btn btn-sm ${
                        propietario.pivot?.administrador === 'Si'
                          ? 'btn-success cursor-default'
                          : 'btn-primary'
                      }`}
                      disabled={propietario.pivot?.administrador === 'Si'}
                    >
                      {propietario.pivot?.administrador === 'Si'
                        ? 'Ya es Administrador'
                        : 'Volver Administrador'}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmChangeStatus(propietario?.id);
                      }}
                      className="btn btn-light btn-sm"
                      disabled={propietario.pivot?.administrador === 'Si'}
                    >
                      <KeenIcon icon="trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

      
          <ModalDetailPropietario
            open={modalDetailPropietario}
            onClose={() => {
              setModalDetailPropietario(false);
            }}
            data={propietario}
            onSave={handleAfterSave}
          />

        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalPropietarioAfiliacion };
