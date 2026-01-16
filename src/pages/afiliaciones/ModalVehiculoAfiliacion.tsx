import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import Spinner from '@/components/loaders/Spinner';
import { AfiliacionInterface, VehiculoInterface } from './models/AfiliacionInterface';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserTie } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import { useConfirm } from '@/hooks';
import { ModalPropietarioAfiliacion } from './ModalPropietarioAfiliacion';
import { ModalConductorAfiliacion } from './ModalConductorAfiliacion';
import { ModalCreateVehiculoAfiliacion } from './ModalCreateVehiculoAfiliacion';
import { ModalDetailVehiculo } from './ModalDetailVehiculo';
import { ModalContratoVinculacionContent } from './ModalContratoVinculacionContent';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave: () => void;
}

const ModalVehiculoAfiliacion = ({ open, data, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const { confirmAction } = useConfirm();
  const [error, setError] = useState('');
  const [modalPropietarioAfiliacion, setModalPropietarioAfiliacion] = useState<boolean>(false);
  const [modalConductorAfiliacion, setModalConductorAfiliacion] = useState<boolean>(false);
  const [modalCreateVehiculoAfiliacion, setModalCreateVehiculoAfiliacion] =
    useState<boolean>(false);
  const [vehiculo, setVehiculo] = useState<VehiculoInterface | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [vehiculos, setVehiculos] = useState<AfiliacionInterface[]>([]);

  const [modalDetailVehiculo, setModalDetailVehiculo] = useState<boolean>(false);

  const handleConfirmChangeStatus = (idVehiculo: number) => {
    confirmAction('Esta acción cambiara el estado del vehículo.', () => handleSave(idVehiculo));
  };

  const handleSave = async (idVehiculo: number) => {
    try {
      setLoading(true);
      await axios.put(`change_status_vehiculo/${idVehiculo}`);
      onSave();
      fetchVehiculos();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      enqueueSnackbar('Error al guardar el cambio de estado.', { variant: 'error' });
    }
  };

  const fetchVehiculos = useCallback(async () => {
    if (!data?.id) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`get_vehiculos_by_id/${data?.id}`);
      setVehiculos([response.data]);
    } catch (error) {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [data?.id]);

  const handleAfterSave = () => {
    fetchVehiculos();
  };

  const hasActiveVehicle = vehiculos.some((afiliacion) =>
    afiliacion.vehiculo?.some((data) => data.estado?.estado === 'ACTIVO')
  );

  useEffect(() => {
    fetchVehiculos();
  }, [fetchVehiculos]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[980px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Vehículos</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-2">
          {loading && <Spinner />}
          <div className="min-w-full">
            <div className="flex justify-end py-2 gap-3">
              <button
                onClick={() => setModalCreateVehiculoAfiliacion(true)}
                className="btn btn-sm btn-light"
                disabled={hasActiveVehicle}
              >
                Agregar Vehículo
              </button>

              {/* <button
                onClick={() => setContratosModal(true)}
                className="btn btn-sm btn-light gap-2"
              >
                Contratos de Vinculación
              </button> */}
            </div>

            <div className="mt-2">
              {vehiculos.map((afiliacion, index) =>
                afiliacion.vehiculo?.map((data, i) => (
                  <div
                    key={`${index}-${i}`}
                    onClick={() => {
                      setVehiculo(data);
                      setModalDetailVehiculo(true);
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
                      src={data.rutaUrl}
                      alt="vehículo"
                      className="w-28 h-28 object-cover rounded-lg"
                    />

                    <div className="flex flex-col flex-grow">
                      <p className="text-base font-semibold text-gray-900">
                        {data.tipo_vehiculo?.tipo}
                      </p>

                      <p className="text-sm text-gray-600">
                        Placa:
                        <span className="font-bold ml-1">{data.placa}</span>
                      </p>

                      <p className="text-sm text-gray-500">
                        {data.marca?.marca} • {data.modelo?.modelo}
                      </p>

                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmChangeStatus(data?.id);
                        }}
                        className={`
        mt-2 inline-block px-2 py-1 text-sm font-semibold badge badge-outline w-fit
        cursor-pointer
        ${data.estado?.estado === 'INACTIVO' ? 'badge-danger' : 'badge-primary'}
      `}
                      >
                        {data.estado?.estado}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalPropietarioAfiliacion(true);
                          setVehiculo(data);
                        }}
                        className="btn btn-light btn-sm"
                      >
                        <KeenIcon icon="users" /> Propietarios
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalConductorAfiliacion(true);
                          setVehiculo(data);
                        }}
                        className="btn btn-light btn-sm"
                      >
                        <FontAwesomeIcon icon={faUserTie} /> Conductores
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalCreateVehiculoAfiliacion(true);
                          setVehiculo(data);
                        }}
                        className="btn btn-info btn-sm"
                      >
                        <KeenIcon icon="pencil" />
                        Editar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <ModalPropietarioAfiliacion
            open={modalPropietarioAfiliacion}
            onClose={() => {
              setModalPropietarioAfiliacion(false);
            }}
            data={data}
            vehiculo={vehiculo}
          />

          <ModalConductorAfiliacion
            open={modalConductorAfiliacion}
            onClose={() => {
              setModalConductorAfiliacion(false);
            }}
            data={data}
            vehiculo={vehiculo}
          />

          <ModalCreateVehiculoAfiliacion
            open={modalCreateVehiculoAfiliacion}
            onClose={() => {
              setModalCreateVehiculoAfiliacion(false);
              setVehiculo(undefined);
            }}
            afiliacion={data}
            vehiculo={vehiculo}
            onSave={handleAfterSave}
          />

          <ModalDetailVehiculo
            open={modalDetailVehiculo}
            onClose={() => {
              setModalDetailVehiculo(false);
            }}
            vinculacion={data}
            data={vehiculo}
            onSave={handleAfterSave}
          />

          {/* <ModalContratoVinculacionContent
            open={contratosModal}
            onClose={() => {
              setContratosModal(false);
            }}
            data={data}
          /> */}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalVehiculoAfiliacion };
