import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import Spinner from '@/components/loaders/Spinner';
import { AfiliacionInterface, VehiculoInterface } from './models/AfiliacionInterface';

import { PersonaInterface } from '../contratacion/model/PersonaInterface';
import { ModalCreatePropietarioAfiliacion } from './ModalCreatePropietarioAfiliacion';
import { useConfirm } from '@/hooks';
import { ModalDetailPropietario } from './ModalDetailPropietario';
import { ModalCreateTrazabilidad } from './ModalCreateTrazabilidad';

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
  const [modalCreatePropietarioAfiliacion, setModalCreatePropietarioAfiliacion] =
    useState<boolean>(false);
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
              <div className="relative w-auto">
                <button
                  onClick={() => setModalCreatePropietarioAfiliacion(true)}
                  className="btn btn-sm btn-light"
                >
                  Agregar Propietario
                </button>
              </div>
            </div>
            <div className="mt-4">
              {propietarios.map((propietario, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setPropietario(propietario);
                    setModalDetailPropietario(true);
                  }}
                  className="
                mt-4
                flex items-center gap-4 p-5
                border border-gray-100 rounded-2xl
                bg-gradient-to-br
                shadow hover:shadow-lg hover:-translate-y-1
                transition-all duration-200
                cursor-pointer backdrop-blur-sm
              "
                >
                  <img
                    src={propietario.rutaFotoUrl}
                    alt="propietario"
                    className="w-28 h-28 object-cover rounded-lg"
                  />

                  <div className="flex flex-col flex-grow">
                    <p className="text-base font-semibold text-gray-900">
                      {propietario.nombre1} {propietario.apellido1}
                    </p>

                    <p className="text-sm text-gray-600">
                      Identificación:
                      <span className="font-bold ml-1">{propietario.identificacion}</span>
                    </p>

                    <p className="text-sm text-gray-600">
                      Porcentaje Propiedad:
                      <span className="font-bold ml-1">{propietario.pivot?.porcentaje}%</span>
                    </p>

                    <p className="text-sm text-gray-600">
                      Celular:
                      <span className="font-bold ml-1">{propietario.celular}</span>
                    </p>

                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        if (propietario.pivot?.administrador !== 'Si') {
                          handlePropietarioAdministrador(propietario.id);
                        }
                      }}
                      className={`
            mt-2 inline-block px-2 py-1 text-sm font-semibold badge badge-outline w-fit
            cursor-pointer
            ${propietario.pivot?.administrador === 'Si' ? 'badge-success' : 'badge-primary'}
          `}
                    >
                      {propietario.pivot?.administrador === 'Si'
                        ? 'Administrador'
                        : 'Volver Administrador'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (propietario.pivot?.administrador !== 'Si') {
                          handleConfirmChangeStatus(propietario?.id);
                        }
                      }}
                      className="btn btn-light btn-sm"
                    >
                      <KeenIcon icon="trash" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ModalCreatePropietarioAfiliacion
            open={modalCreatePropietarioAfiliacion}
            onClose={() => {
              setModalCreatePropietarioAfiliacion(false);
            }}
            afiliacion={data}
            vehiculo={vehiculo}
            totalPorcentaje={totalPorcentaje}
            onSave={handleAfterSave}
          />

          <ModalDetailPropietario
            open={modalDetailPropietario}
            onClose={() => {
              setModalDetailPropietario(false);
            }}
            data={propietario}
            onSave={handleAfterSave}
          />

          <ModalCreateTrazabilidad
            open={modalCreateObservacion}
            afiliacion={data}
            onClose={() => setModalCreateObservacion(false)}
            onSave={() => handleChangeAdministrador()}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalPropietarioAfiliacion };
